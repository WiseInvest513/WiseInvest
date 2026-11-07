import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
function loadModule(relativePath, overrides) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, relativePath), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const mockRequire = name => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name.startsWith('@/')) return loadModule(`${name.slice(2)}.ts`, overrides);
    return require(name);
  };
  new Function('require', 'module', 'exports', compiled)(mockRequire, module, module.exports);
  return module.exports;
}

function harness({ signedIn = true, database = true, saved = [] } = {}) {
  const records = new Map(saved.map(item => [item.contentKey, item]));
  const lookups = [];
  const events = [];
  const overrides = {
    '@/auth': { auth: async () => signedIn ? { user: { id: 'reader-1' } } : null },
    '@/lib/prisma': {
      isDatabaseConfigured: () => database,
      getPrisma() {
        assert.ok(database, 'must not access an unavailable database');
        return {
          userContentItem: {
            async findUnique(query) {
              lookups.push(query);
              assert.equal(query.where.userId_contentType_contentKey.userId, 'reader-1');
              return records.get(query.where.userId_contentType_contentKey.contentKey) ?? null;
            },
            async findMany() { throw new Error('An individual favorite lookup must not use the eight-item account preview'); },
            async upsert({ where, create, update }) {
              const key = where.userId_contentType_contentKey.contentKey;
              records.set(key, records.has(key) ? { ...records.get(key), ...update } : create);
            },
          },
          contentEvent: { async create(event) { events.push(event); } },
        };
      },
    },
  };
  return {
    ...loadModule('app/api/account/content-library/route.ts', overrides),
    ...loadModule('app/api/content/activity/route.ts', overrides),
    records, lookups, events,
  };
}

const href = '/articles/series/us-stock-zero-to-one';
const statusRequest = value => new Request(`http://localhost/api/account/content-library?href=${encodeURIComponent(value)}`);
const activityRequest = eventType => new Request('http://localhost/api/content/activity', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ eventType, href, title: '美股从 0~1 投资开户教程', summary: '从账户准备到首次交易。', metadata: { seriesId: 'us-stock-zero-to-one', kind: 'series' } }),
});

test('series favorites persist through the existing content activity store and can be removed', async () => {
  const api = harness();
  assert.equal((await (await api.GET(statusRequest(href))).json()).favorited, false);
  assert.deepEqual(await (await api.POST(activityRequest('FAVORITE_ADD'))).json(), { ok: true, favorited: true });
  assert.equal((await (await api.GET(statusRequest(href))).json()).favorited, true);
  const saved = api.records.get(href);
  assert.equal(saved.contentType, 'ARTICLE');
  assert.equal(saved.href, href);
  assert.equal(saved.title, '美股从 0~1 投资开户教程');
  assert.equal(saved.summary, '从账户准备到首次交易。');
  assert.deepEqual(api.events[0].data.metadata, { seriesId: 'us-stock-zero-to-one', kind: 'series' });
  assert.deepEqual(await (await api.POST(activityRequest('FAVORITE_REMOVE'))).json(), { ok: true, favorited: false });
  assert.equal((await (await api.GET(statusRequest(href))).json()).favorited, false);
});

test('old series favorites restore by canonical key even outside the latest eight items', async () => {
  const saved = [...Array.from({ length: 9 }, (_, i) => ({ contentKey: `/articles/index/article-${i}`, favoritedAt: new Date() })), { contentKey: href, favoritedAt: new Date('2025-01-01') }];
  const api = harness({ saved });
  const result = await (await api.GET(statusRequest(`https://www.wise-invest.org${href}?route=overview#stage-banks`))).json();
  assert.equal(result.favorited, true);
  assert.deepEqual(api.lookups[0].where.userId_contentType_contentKey, { userId: 'reader-1', contentType: 'ARTICLE', contentKey: href });
});

test('guests cannot save favorites, including when the database is unavailable', async () => {
  for (const database of [true, false]) {
    const api = harness({ signedIn: false, database });
    assert.equal((await api.GET(statusRequest(href))).status, 401);
    assert.equal((await api.POST(activityRequest('FAVORITE_ADD'))).status, 401);
    assert.equal(api.records.size, 0);
  }
});

test('unavailable persistence never reports a successful favorite mutation', async () => {
  const api = harness({ database: false });
  assert.equal((await api.GET(statusRequest(href))).status, 200);
  assert.equal((await api.POST(activityRequest('FAVORITE_ADD'))).status, 503);
  assert.equal((await api.POST(activityRequest('FAVORITE_REMOVE'))).status, 503);
});

test('favorite status lookup rejects external and empty URLs', async () => {
  const api = harness();
  for (const value of ['', 'https://example.com/articles/series/test', '//example.com/articles/series/test']) {
    assert.equal((await api.GET(statusRequest(value))).status, 400);
  }
  assert.equal(api.lookups.length, 0);
});
