import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicPath = '/roadmap/crypto-trading';
const articlePath = '/articles/broker/example';
const minute = 60_000;
const deadline = Date.parse('2026-09-14T00:00:00+08:00');

function harness() {
  const state = {
    now: deadline + minute,
    configured: true,
    permissions: [],
    readFailure: false,
    writeFailure: false,
    auditFailure: false,
    invalidationFailure: false,
    admin: true,
    preview: false,
    limited: false,
    afterCacheRead: undefined,
  };
  const modules = new Map();
  const entries = new Map();
  const definitions = [];
  const queries = [];
  const events = [];
  const invalidations = [];
  let authCalls = 0;
  class RequestDate extends Date {
    static now() { return state.now; }
  }

  const prisma = {
    contentPermission: {
      findMany: async (query) => {
        queries.push(query);
        if (state.readFailure) throw new Error('Policy database unavailable');
        return state.permissions.map((permission) => Object.fromEntries(
          Object.keys(query.select).map((key) => [key, permission[key]]),
        ));
      },
      upsert: async ({ where, create, update, select }) => {
        events.push('upsert');
        if (state.writeFailure) throw new Error('Policy write failed');
        const key = where.contentType_contentKey;
        let permission = state.permissions.find((row) => row.contentType === key.contentType && row.contentKey === key.contentKey);
        if (permission) Object.assign(permission, update);
        else {
          permission = { id: 'new-permission', ...create };
          state.permissions.push(permission);
        }
        return Object.fromEntries(Object.keys(select).map((field) => [field, permission[field]]));
      },
    },
    auditLog: {
      create: async () => {
        events.push('audit');
        if (state.auditFailure) throw new Error('Audit write failed');
      },
    },
  };

  function load(relativePath) {
    const filename = path.join(root, relativePath);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText;
    const requireMock = (name) => {
      if (name === 'next/cache') return {
        unstable_cache: (callback, keyParts, options) => {
          definitions.push({ keyParts, options });
          return async (...args) => {
            const key = JSON.stringify([keyParts, args]);
            // Model Next's persisted JSON values and stale-while-revalidate:
            // an expired existing key can still return its old value. The strict
            // minute key must make permission reads miss instead of trusting it.
            if (!entries.has(key)) {
              const value = await callback(...args);
              entries.set(key, { json: JSON.stringify(value), tags: options.tags });
            }
            state.afterCacheRead?.();
            return JSON.parse(entries.get(key).json);
          };
        },
        revalidateTag: (tag) => {
          events.push('invalidate');
          invalidations.push(tag);
          if (state.invalidationFailure) throw new Error('Private cache connection detail');
          for (const [key, entry] of entries) {
            if (entry.tags.includes(tag)) entries.delete(key);
          }
        },
      };
      if (name === '@/lib/prisma') return {
        isDatabaseConfigured: () => state.configured,
        getPrisma: () => prisma,
      };
      if (name === 'next/server') return {
        NextResponse: { json: (body, init = {}) => ({ body, status: init.status ?? 200 }) },
      };
      if (name === '@/auth') return {
        auth: async () => {
          authCalls++;
          return state.admin ? { user: { id: 'admin-user', role: 'ADMIN' } } : null;
        },
      };
      if (name === '@/lib/identity/dev-preview') return {
        WISE_DEV_PREVIEW_COOKIE: 'wise_dev_preview',
        isDevPreviewAdminCookieValue: () => state.preview,
      };
      if (name === '@/lib/vip/api-guards') return {
        checkAdminMutationLimit: async () => state.limited ? { status: 429 } : null,
      };
      if (name === '@/lib/content-catalog') return {
        getContentCatalogItems: () => [
          { contentType: 'ROADMAP_DETAIL', contentKey: publicPath },
          { contentType: 'ARTICLE', contentKey: articlePath },
        ],
      };
      if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
      throw new Error(`Unexpected dependency: ${name}`);
    };
    new Function('require', 'module', 'exports', 'Date', compiled)(requireMock, module, module.exports, RequestDate);
    return module.exports;
  }

  const resolver = load('lib/content-access-server.ts');
  const route = load('app/api/admin/content-permissions/route.ts');
  const { genUid } = load('lib/article-uid.ts');
  return {
    state, entries, definitions, queries, events, invalidations, resolver,
    authCalls: () => authCalls,
    releasePath: `/articles/VIP/${genUid('VIP002')}`,
    update: (access, overrides = {}) => route.POST({
      cookies: { get: () => undefined },
      json: async () => ({
        contentType: 'ROADMAP_DETAIL', contentKey: publicPath,
        title: 'Example content', reason: 'Updated policy', access, ...overrides,
      }),
    }),
  };
}

const permission = (contentKey, access) => ({
  id: 'existing-permission',
  contentType: contentKey.startsWith('/roadmap/') ? 'ROADMAP_DETAIL' : 'ARTICLE',
  contentKey, access, reason: 'Stored policy',
  updatedById: 'private-admin-id', updatedAt: new Date(),
});

test('different content requests share plain policy rows, not viewer decisions or mutable maps', async () => {
  const h = harness();
  h.state.permissions = [permission(publicPath, 'VIP'), permission(articlePath, 'VIP_PLUS')];
  const first = await h.resolver.getResolvedContentAccessRules([publicPath]);
  first.get(publicPath).access = 'PUBLIC';
  first.clear();
  const fullUrl = 'https://www.wise-invest.org' + articlePath + '?from=share#section';
  const next = await h.resolver.getResolvedContentAccessRules([fullUrl, publicPath]);
  assert.equal(next.get(fullUrl).access, 'VIP_PLUS');
  assert.equal(next.get(publicPath).access, 'VIP');
  assert.equal(h.queries.length, 1);
  assert.equal(h.authCalls(), 0, 'shared config does not read or cache identity');
  assert.deepEqual(h.queries[0], { select: { contentType: true, contentKey: true, access: true, reason: true } });
  assert.equal(h.definitions[0].options.revalidate, 60);
  assert.equal(h.definitions[0].options.tags.length, 1);
  const cached = JSON.parse([...h.entries.values()][0].json);
  assert.ok(Array.isArray(cached));
  assert.deepEqual(Object.keys(cached[0]).sort(), ['access', 'contentKey', 'contentType', 'reason']);
});

test('strict minute buckets refresh out-of-band restrictions without accepting SWR stale policies', async () => {
  const h = harness();
  h.state.permissions = [permission(publicPath, 'PUBLIC')];
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'PUBLIC');
  h.state.permissions[0].access = 'VIP_PLUS';
  h.state.now += minute - 1;
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'PUBLIC');
  assert.equal(h.queries.length, 1);
  h.state.now++;
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'VIP_PLUS');
  assert.equal(h.queries.length, 2);
});

test('successful admin restriction immediately expires the policy shared by article and list requests', async () => {
  const h = harness();
  h.state.permissions = [permission(publicPath, 'PUBLIC')];
  await h.resolver.getResolvedContentAccessRules([publicPath, articlePath]);
  const response = await h.update('VIP');
  assert.equal(response.status, 200);
  assert.deepEqual(h.events, ['upsert', 'invalidate', 'audit']);
  assert.deepEqual(h.invalidations, h.definitions[0].options.tags);
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'VIP');
  assert.equal(h.queries.length, 2, 'next request rereads without waiting a minute');
});

test('a saved restrictive policy is invalidated even if the later audit write fails', async () => {
  const h = harness();
  h.state.permissions = [permission(publicPath, 'PUBLIC')];
  await h.resolver.getResolvedContentAccessRule(publicPath);
  h.state.auditFailure = true;
  assert.equal((await h.update('VIP_PLUS')).status, 400);
  assert.deepEqual(h.events, ['upsert', 'invalidate', 'audit']);
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'VIP_PLUS');
});

test('tag invalidation failure preserves the committed save and audit, with bounded stale policy expiry', async (t) => {
  const h = harness();
  const warnings = [];
  t.mock.method(console, 'warn', (...args) => warnings.push(args));
  h.state.permissions = [permission(publicPath, 'PUBLIC')];
  await h.resolver.getResolvedContentAccessRule(publicPath);
  h.state.invalidationFailure = true;
  const response = await h.update('VIP');
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.permission.access, 'VIP');
  assert.deepEqual(h.events, ['upsert', 'invalidate', 'audit']);
  assert.deepEqual(warnings, [['[content-access] cache invalidation unavailable; using bounded expiry']]);
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'PUBLIC');
  h.state.now += minute;
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'VIP');
  assert.equal(h.queries.length, 2);
});

test('rejected, rate-limited, invalid, and failed writes do not invalidate or mutate cached policies', async () => {
  for (const [setup, expectedStatus, overrides] of [
    [(state) => { state.admin = false; }, 403],
    [(state) => { state.limited = true; }, 429],
    [() => {}, 400, { access: 'INVALID' }],
    [(state) => { state.writeFailure = true; }, 400],
  ]) {
    const h = harness();
    h.state.permissions = [permission(publicPath, 'PUBLIC')];
    await h.resolver.getResolvedContentAccessRule(publicPath);
    setup(h.state);
    assert.equal((await h.update('VIP', overrides)).status, expectedStatus);
    assert.deepEqual(h.invalidations, []);
    assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'PUBLIC');
    assert.equal(h.queries.length, 1);
  }
});

test('failed policy reads fail closed, are not cached as empty, and retry after recovery', async () => {
  const h = harness();
  h.state.readFailure = true;
  await assert.rejects(h.resolver.getResolvedContentAccessRule(publicPath), /Policy database unavailable/);
  assert.equal(h.entries.size, 0);
  h.state.readFailure = false;
  h.state.permissions = [permission(publicPath, 'VIP')];
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'VIP');
  assert.equal(h.queries.length, 2);
});

test('an outage cannot keep an old cached PUBLIC policy alive after its minute', async () => {
  const h = harness();
  h.state.permissions = [permission(publicPath, 'PUBLIC')];
  await h.resolver.getResolvedContentAccessRule(publicPath);
  h.state.readFailure = true;
  h.state.now += minute;
  await assert.rejects(h.resolver.getResolvedContentAccessRule(publicPath), /Policy database unavailable/);
  assert.equal(h.queries.length, 2);
});

test('database-free preview defaults and mock saves never populate or invalidate the shared cache', async () => {
  const h = harness();
  h.state.configured = false;
  h.state.preview = true;
  h.state.admin = false;
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'PUBLIC');
  const response = await h.update('VIP');
  assert.equal(response.body.preview, true);
  assert.equal(h.entries.size, 0);
  assert.equal(h.queries.length, 0);
  assert.deepEqual(h.events, []);
  h.state.configured = true;
  h.state.permissions = [permission(publicPath, 'VIP_PLUS')];
  assert.equal((await h.resolver.getResolvedContentAccessRule(publicPath)).access, 'VIP_PLUS');
  assert.equal(h.queries.length, 1);
});

test('a cache hit crossing the release deadline reevaluates the clock after reading cached configuration', async () => {
  const h = harness();
  h.state.now = deadline - 1;
  h.state.permissions = [permission(h.releasePath, 'PUBLIC')];
  assert.equal((await h.resolver.getResolvedContentAccessRule(h.releasePath)).access, 'PUBLIC');
  h.state.afterCacheRead = () => { h.state.now = deadline; };
  assert.equal((await h.resolver.getResolvedContentAccessRule(h.releasePath)).access, 'VIP');
  assert.equal(h.queries.length, 1, 'the deadline decision was not cached with the database rule');
});

test('authoritative release rules survive an outage but mixed unknown policies fail closed', async (t) => {
  const h = harness();
  h.state.readFailure = true;
  const warnings = [];
  t.mock.method(console, 'warn', (...args) => warnings.push(args));
  assert.equal((await h.resolver.getResolvedContentAccessRule(h.releasePath)).access, 'VIP');
  await assert.rejects(h.resolver.getResolvedContentAccessRules([h.releasePath, publicPath]), /Policy database unavailable/);
  h.state.now = deadline - 1;
  assert.equal((await h.resolver.getResolvedContentAccessRule(h.releasePath)).access, 'PUBLIC');
  assert.equal(h.entries.size, 0);
  assert.deepEqual(warnings, [
    ['[content-access] using authoritative release rule after DB failure'],
    ['[content-access] using authoritative release rule after DB failure'],
  ]);
});

test('empty content lists never query the database', async () => {
  const h = harness();
  assert.equal((await h.resolver.getResolvedContentAccessRules([])).size, 0);
  assert.equal(h.queries.length, 0);
});
