import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}
const platforms = load('lib/vip/binding-platforms.ts');
const identifiers = load('lib/vip/partner-identifier.ts');
const status = load('lib/vip/status.ts');

function setup({ enabled = true, existing = null, signedIn = true } = {}) {
  const calls = [];
  const prisma = {
    partner: {
      upsert: async args => { calls.push(['partner', args]); },
      findUnique: async ({ where }) => ({ id: where.slug, enabled, vipEligible: true }),
    },
    partnerAccount: {
      findUnique: async () => existing,
      create: async args => { calls.push(['create', args]); return { id: 'application', status: args.data.status }; },
      update: async args => { calls.push(['update', args]); return { id: 'application', status: args.data.status }; },
    },
    auditLog: { create: async args => { calls.push(['audit', args]); } },
  };
  const { POST } = load('app/api/account/partner-accounts/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ status: options?.status ?? 200, body }) } },
    '@/auth': { auth: async () => signedIn ? { user: { id: 'user' } } : null },
    '@/lib/identity/dev-preview': { WISE_DEV_PREVIEW_COOKIE: 'preview', isDevPreviewCookieValue: () => false },
    '@/lib/prisma': { getPrisma: () => prisma, isDatabaseConfigured: () => true },
    '@/lib/vip/api-guards': { checkVipBindingSubmitLimit: async () => null },
    '@/lib/vip/status': status,
    '@/lib/vip/partner-identifier': identifiers,
    '@/lib/vip/binding-platforms': platforms,
  });
  return { calls, post: body => POST({ json: async () => body, cookies: { get: () => undefined } }) };
}
const application = { partnerSlug: 'bbae', externalIdentifier: 'account-123', userNote: '2026 年 11 月开户，通过 Wise 渠道。' };

test('named platforms have distinct identities and BIT is not Bybit or Bitget', async () => {
  for (const slug of ['fosun-securities', 'chief-securities', 'tengda-securities', 'bbae', 'bit']) {
    const { post, calls } = setup();
    const result = await post({ ...application, partnerSlug: slug });
    assert.equal(result.status, 200);
    assert.equal(calls.find(([action]) => action === 'create')[1].data.partnerId, slug);
    assert.equal(result.body.partnerAccount.status, 'PENDING');
    assert.deepEqual(calls.find(([action]) => action === 'partner')[1].update, {});
  }
  assert.equal(platforms.getAdditionalBindingPartner('bit').type, 'EXCHANGE');
  assert.equal(platforms.getAdditionalBindingPartner('invented-platform'), null);
});

test('all applications require non-whitespace notes on the server', async () => {
  for (const partnerSlug of ['bbae', 'binance', 'bit', 'other']) {
    for (const userNote of ['', '  \n ', undefined]) {
      const { post, calls } = setup();
      const result = await post({ ...application, partnerSlug, userNote, externalIdentifier: '1234567890', platformName: '测试平台' });
      assert.equal(result.status, 400);
      assert.match(result.body.message, /补充说明/);
      assert.equal(calls.length, 0);
    }
  }
});

test('other requires a name and saves it with the complete note for admin review', async () => {
  const { post, calls } = setup();
  assert.equal((await post({ ...application, partnerSlug: 'other', platformName: '  ' })).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await post({ ...application, partnerSlug: 'other', platformName: ' 新平台 ' })).status, 200);
  const saved = calls.find(([action]) => action === 'create')[1].data;
  assert.equal(saved.partnerId, 'other');
  assert.equal(saved.userNote, `平台 / 产品：新平台\n${application.userNote}`);
  assert.equal(saved.status, 'PENDING');
});

test('disabled platforms and unauthenticated submissions cannot create bindings', async () => {
  for (const options of [{ enabled: false }, { signedIn: false }]) {
    const { post, calls } = setup(options);
    assert.equal((await post(application)).status, options.enabled === false ? 400 : 401);
    assert.ok(!calls.some(([action]) => action === 'create'));
  }
});

test('UID rules and long notes remain validated server-side', async () => {
  const { post, calls } = setup();
  assert.equal((await post({ ...application, partnerSlug: 'binance', externalIdentifier: '123' })).status, 400);
  assert.equal((await post({ ...application, userNote: '字'.repeat(2001) })).status, 400);
  assert.equal(calls.length, 0);
});

test('rejected other submissions can be corrected; pending duplicates remain blocked', async () => {
  const retry = setup({ existing: { id: 'existing', status: 'REJECTED' } });
  const response = await retry.post({ ...application, partnerSlug: 'other', platformName: '修正平台' });
  assert.equal(response.body.resubmitted, true);
  assert.match(retry.calls.find(([action]) => action === 'update')[1].data.userNote, /修正平台/);
  const pending = setup({ existing: { id: 'existing', status: 'PENDING' } });
  assert.equal((await pending.post(application)).status, 409);
  assert.ok(!pending.calls.some(([action]) => action === 'create' || action === 'update'));
});

test('fallback catalogue fills missing rows while honoring admin disabled / ineligible settings', async () => {
  const partners = load('lib/vip/partners.ts', {
    '@/lib/vip/binding-platforms': platforms,
    '@/lib/vip/status': status,
    '@/lib/prisma': {
      isDatabaseConfigured: () => true,
      getPrisma: () => ({ partner: { findMany: async () => [
        { slug: 'bbae', enabled: false, vipEligible: true },
        { slug: 'bit', enabled: true, vipEligible: false },
        { slug: 'binance', enabled: true, vipEligible: true },
      ] } }),
    },
  });
  const slugs = (await partners.getEnabledVipPartners()).map(p => p.slug);
  assert.ok(!slugs.includes('bbae'));
  assert.ok(!slugs.includes('bit'));
  assert.ok(slugs.includes('fosun-securities'));
  assert.ok(slugs.includes('other'));
  assert.ok(slugs.includes('binance'));
});
