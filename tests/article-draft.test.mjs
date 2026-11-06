import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { prepareDraft, composeDraft, checkDraft, finalizeDraft, normalizeArticleBody } from '../scripts/article-draft.mjs';
import { parseArticleMarkdown } from '../scripts/lib/article-validation.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const PLAN = {
  id: 'sample-concept', title: '从账户用途理解开户准备', categoryId: 'crypto', type: 'concept',
  summary: '区分身份认证、资金转移与交易操作，按自己的任务准备资料并核对每一步结果。',
  date: '2026-11-06', access: 'MEMBER', target: 'crypto/sample/article.md',
  guide: {
    audience: ['还不了解账户认证与买币区别的入门读者', '准备了解资金路径但还没有开始操作的人'],
    outcomes: ['区分身份核验、资金入账与下单成交三种结果', '根据账户用途列出材料与资金检查清单'],
    prepare: '先列出自己要完成的具体任务及现有账户资料，无需为了阅读先转账或买币。',
    status: '本文解释账户与资金的基本关系，不保证开户或交易成功；具体功能由真实账户状态决定。',
  },
  outline: ['账户与认证', '检查资金结果'],
};
const BODY = `# ${PLAN.title}\r\n\r\n先从使用账户的目的出发，认识身份核验与资金操作的区别。\r\n\r\n## 账户与认证\r\n\r\n身份核验需要本人真实资料，但通过核验不代表已经完成入金。\r\n\r\n## 五、检查资金结果\r\n\r\n转出后要检查收款账户的实际状态，不能把付款成功当作交易成交。\r\n`;
function setRules(root, { publicRules = [], vipRules = [] } = {}) {
  fs.writeFileSync(path.join(root, 'lib/content-access-rules.ts'), `
    import { genUid } from './article-uid';
    export const defaultArticleAccessRule={access:"MEMBER"};
    export const publicArticleAccessRules=${JSON.stringify(publicRules)};
    export const vipArticleAccessRules=${JSON.stringify(vipRules)};
    export const publicArticlePaths=new Set(publicArticleAccessRules.map(r=>'/articles/'+r.categoryId+'/'+genUid(r.articleId)));
    export const vipArticlePaths=new Set(vipArticleAccessRules.map(r=>'/articles/'+r.categoryId+'/'+genUid(r.articleId)));
  `);
}
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wise-article-draft-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const directory of ['lib', 'content/articles', 'public/images/articles/covers']) fs.mkdirSync(path.join(root, directory), { recursive: true });
  fs.writeFileSync(path.join(root, 'lib/articles-data.ts'), 'export const categories=[{id:"crypto"}]; export const subcategories=[{id:"exchange",categoryId:"crypto"}];');
  for (const filename of ['article-registration.ts', 'article-uid.ts', 'article-release.ts', 'content-access.ts']) fs.copyFileSync(path.join(projectRoot, 'lib', filename), path.join(root, 'lib', filename));
  fs.writeFileSync(path.join(root, 'lib/registration-brands.ts'), 'export function getRegistrationBrand(){return undefined;}');
  setRules(root);
  fs.writeFileSync(path.join(root, 'lib/article-library.ts'), 'export const articleSeries=[];');
  const cover = path.join(root, 'public/images/articles/covers/sample.webp');
  fs.copyFileSync(path.join(projectRoot, 'public/images/articles/covers/galaxy-etf-guide.webp'), cover);
  fs.writeFileSync(path.join(root, 'lib/article-covers.ts'), `export const articleCovers={"${PLAN.id}":{src:"/images/articles/covers/sample.webp",alt:"账户核验与资金操作的概念图"}};`);
  const plan = structuredClone(PLAN);
  const target = path.join(root, 'content/articles', plan.target);
  const draftFile = name => path.join(root, '.article-drafts', plan.id, name);
  const prepare = () => prepareDraft({ root, plan });
  const compose = body => composeDraft({ root, id: plan.id, body: body ?? BODY });
  const check = () => checkDraft({ root, id: plan.id });
  const review = () => {
    const checked = check();
    return { planSha256: checked.planSha256, articleSha256: checked.articleSha256, coverSha256: checked.coverSha256, checks: {
      guide: '导读对应两节正文：身份认证与资金结果分别检查。',
      facts: '正文是基础概念说明，没有新增产品费用、资格或收益数字。',
      visuals: '测试封面来自本地既有素材，尺寸与文件体积已核对。',
      referrals: '这篇概念文章没有邀请码、注册链接或优惠承诺。',
      access: '已核对静态规则为 MEMBER，未请求线上权限数据库。',
    } };
  };
  const finish = input => finalizeDraft({ root, id: plan.id, review: input });
  return { root, plan, target, cover, draftFile, prepare, compose, check, review, finish };
}

test('missing per-article guide fails before creating any managed draft', t => {
  const f = fixture(t);
  for (const field of ['audience', 'outcomes', 'prepare', 'status']) {
    const plan = structuredClone(f.plan); delete plan.guide[field];
    assert.throws(() => prepareDraft({ root: f.root, plan }), /guide|导读/);
  }
  const plan = structuredClone(f.plan); plan.guide.outcomes = ['把文章里的关键信息转成可执行步骤'];
  assert.throws(() => prepareDraft({ root: f.root, plan }), /boilerplate/);
  assert(!fs.existsSync(path.join(f.root, '.article-drafts')));
});

test('prepare requires type, real taxonomy, nonempty outline, real date and explicit access', t => {
  const f = fixture(t);
  for (const invalid of [{ type: 'misc' }, { categoryId: 'unknown' }, { subcategoryId: 'bank' }, { outline: [] }, { date: '2026-02-30' }, { access: undefined }]) {
    assert.throws(() => prepareDraft({ root: f.root, plan: { ...f.plan, ...invalid } }));
  }
  assert(!fs.existsSync(path.join(f.root, '.article-drafts')));
});

test('compose/check cannot run before a guide has been prepared', t => {
  const f = fixture(t);
  assert.throws(() => f.compose(), /prepare/);
  assert.throws(() => f.check(), /prepare/);
  f.prepare();
  assert.throws(() => f.check(), /compose/);
  assert(!fs.existsSync(f.target));
});

test('changing an approved plan invalidates its receipt instead of silently carrying it forward', t => {
  const f = fixture(t); f.prepare();
  const plan = JSON.parse(fs.readFileSync(f.draftFile('plan.json'), 'utf8'));
  plan.guide.status += '新的内容边界。';
  fs.writeFileSync(f.draftFile('plan.json'), JSON.stringify(plan));
  assert.throws(() => f.compose(), /计划已变动/);
  assert(!fs.existsSync(f.target));
});

test('normalization removes only exact duplicate title, numbers H2 and preserves fenced examples and hard breaks', () => {
  const body = '# 标题\r\n\r\n段落  \r\n换行\r\n## 三、第一章\r\n内容\r\n```markdown\r\n## 示例标题\r\n```\r\n## Second\r\n内容\r\n~~~markdown\r\n## Another example\r\n~~~~\r\n';
  const result = normalizeArticleBody(body, '标题');
  assert(!result.startsWith('# '));
  assert(result.includes('段落  \n换行'));
  assert(result.includes('## 一、第一章'));
  assert(result.includes('## 二、Second'));
  assert(result.includes('```markdown\n## 示例标题\n```'));
  assert(result.includes('~~~markdown\n## Another example\n~~~~'));
  assert(normalizeArticleBody('# 不同标题\n正文', '标题').startsWith('# 不同标题'));
});

test('numbering keeps decimal rates, amounts and dates instead of treating them as ordinals', () => {
  const result = normalizeArticleBody('## 0.5% 的费率如何计算\n内容\n## 1.5 万元门槛\n内容\n## 2026.11 的记录\n内容\n## 2. 明确的第二节\n内容\n', '费用');
  assert(result.includes('## 一、0.5% 的费率如何计算'));
  assert(result.includes('## 二、1.5 万元门槛'));
  assert(result.includes('## 三、2026.11 的记录'));
  assert(result.includes('## 四、明确的第二节'));
});

test('a prepared article composes with its authored guide and estimated read time, still outside the site', t => {
  const f = fixture(t); f.prepare(); const result = f.compose();
  const raw = fs.readFileSync(result.articleFile, 'utf8');
  assert.equal(parseArticleMarkdown(raw).meta.guideAudience, f.plan.guide.audience.join(' | '));
  assert.equal(parseArticleMarkdown(raw).meta.guideStatus, f.plan.guide.status);
  assert.match(raw, /^authoringVersion: 1$/m);
  assert.match(raw, /^readTime: [1-9]\d*$/m);
  assert(!raw.includes('\r'));
  assert(!fs.existsSync(f.target));
  const checked = f.check();
  assert.match(checked.articleSha256, /^[a-f0-9]{64}$/);
  assert.match(checked.coverSha256, /^[a-f0-9]{64}$/);
  assert.match(checked.accessScope, /未查询线上/);
});

test('frontmatter round-trips literal boundary quotes without silently changing authored text', t => {
  const f = fixture(t);
  f.plan.title = '"ETF" 费用怎么读';
  f.plan.guide.prepare = '"账户准备"只是读前检查，请核对当前可用账户与实际材料，不需要先转移资金。';
  f.plan.guide.status = '本文只解释操作的区别，不将文字中的 "核验通过" 当作承诺。';
  f.prepare(); f.compose(BODY.replace(PLAN.title, f.plan.title));
  const meta = parseArticleMarkdown(fs.readFileSync(f.draftFile('article.md'), 'utf8')).meta;
  assert.equal(meta.title, f.plan.title);
  assert.equal(meta.guidePrepare, f.plan.guide.prepare);
  assert.equal(meta.guideStatus, f.plan.guide.status);
  assert(f.check().articleSha256);
});

test('strict checking blocks incomplete bodies and missing assets without inserting filler', t => {
  const f = fixture(t); f.prepare();
  f.compose('## 空章节\n\n## 需要完善的章节\n\nTODO\n');
  assert.throws(() => f.check(), /body.emptySection|body.placeholder/);
  f.compose(BODY + '\n![操作截图](./missing.webp)\n');
  assert.throws(() => f.check(), /image.missing/);
  assert(!fs.existsSync(f.target));
});

test('static access and series association must match current website config', t => {
  const f = fixture(t); f.plan.access = 'PUBLIC'; f.plan.seriesId = 'new-series';
  f.prepare(); f.compose();
  assert.throws(() => f.check(), /static-access-mismatch/);
  setRules(f.root, { publicRules: [{ articleId: f.plan.id, categoryId: 'crypto', access: 'PUBLIC' }] });
  assert.throws(() => f.check(), /series-membership-missing/);
  fs.writeFileSync(path.join(f.root, 'lib/article-library.ts'), `export const articleSeries=[{id:"new-series",existingArticleId:"${f.plan.id}",chapters:[]}];`);
  assert.equal(f.check().staticAccess, 'PUBLIC');
  assert(!fs.existsSync(f.target));
});

test('finalize refuses missing, empty and stale reviews, then creates exactly one new article', t => {
  const f = fixture(t); f.prepare(); f.compose();
  assert.throws(() => f.finish(), /必须先审阅/);
  const review = f.review();
  assert.throws(() => f.finish({ ...review, checks: { ...review.checks, facts: true } }), /非空单行文本/);
  assert.throws(() => f.finish({ ...review, articleSha256: 'stale' }), /哈希已过期/);
  assert(!fs.existsSync(f.target));
  const result = f.finish(review);
  assert.equal(result.stage, 'finalized');
  assert(fs.existsSync(f.target));
  assert.equal(fs.readFileSync(f.target, 'utf8'), fs.readFileSync(f.draftFile('article.md'), 'utf8'));
  assert.deepEqual(JSON.parse(fs.readFileSync(f.draftFile('review.json'), 'utf8')), review);
  const previous = fs.readFileSync(f.target);
  assert.throws(() => f.finish(review), /已经完成/);
  assert.deepEqual(fs.readFileSync(f.target), previous);
});

test('changing body or cover invalidates prior composition/review hashes', t => {
  const f = fixture(t); f.prepare(); f.compose(); const review = f.review();
  fs.appendFileSync(f.draftFile('article.md'), '\n新段落。\n');
  assert.throws(() => f.finish(review), /正文已改变/);
  f.compose();
  fs.appendFileSync(f.cover, Buffer.from('changed'));
  assert.throws(() => f.finish(review), /哈希已过期/);
  assert(!fs.existsSync(f.target));
});

test('re-preparing a changed plan invalidates review even when composed article and cover are identical', t => {
  const f = fixture(t); f.prepare(); f.compose(); const review = f.review();
  f.plan.outline.push('新增审阅重点但还未修改正文');
  f.prepare(); f.compose(); const checked = f.check();
  assert.equal(checked.articleSha256, review.articleSha256);
  assert.equal(checked.coverSha256, review.coverSha256);
  assert.notEqual(checked.planSha256, review.planSha256);
  assert.throws(() => f.finish(review), /计划、文章或封面哈希已过期/);
  assert(!fs.existsSync(f.target));
});

test('permission checks use the real site resolver, not a more permissive interpretation of rule arrays', t => {
  const f = fixture(t); f.plan.access = 'VIP_PLUS';
  setRules(f.root, { vipRules: [{ articleId: f.plan.id, categoryId: 'crypto', access: 'VIP_PLUS' }] });
  f.prepare(); f.compose();
  assert.throws(() => f.check(), /计划权限 VIP_PLUS 与静态权限 VIP 不一致/);
});

test('finalization never overwrites an existing target or accepts a duplicate ID', t => {
  const f = fixture(t); f.prepare(); f.compose(); const review = f.review();
  fs.mkdirSync(path.dirname(f.target), { recursive: true });
  fs.writeFileSync(f.target, '这份现有文件属于用户。');
  assert.throws(() => f.finish(review), /目标文件已存在/);
  assert.equal(fs.readFileSync(f.target, 'utf8'), '这份现有文件属于用户。');
  fs.writeFileSync(path.join(f.root, 'content/articles/existing.md'), `---\nid: ${f.plan.id}\ntitle: 另一篇文章\n---\n正文`);
  assert.throws(() => f.prepare(), /id 已存在/);
});

test('same-category hashed UID collision is rejected before making a draft', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.root, 'lib/article-uid.ts'), 'export const genUid=()=>"collision";');
  fs.writeFileSync(path.join(f.root, 'content/articles/existing.md'), '---\nid: other\ncategoryId: crypto\n---\n正文');
  assert.throws(() => f.prepare(), /UID 冲突/);
});

test('managed target and draft paths reject traversal, absolute paths and symlinks', t => {
  const f = fixture(t);
  for (const target of ['../escape.md', '/tmp/escape.md', 'crypto/../escape.md', 'crypto\\escape.md']) {
    assert.throws(() => prepareDraft({ root: f.root, plan: { ...f.plan, target } }), /路径/);
  }
  assert.throws(() => prepareDraft({ root: f.root, plan: { ...f.plan, id: '../escape' } }), /id/);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wise-article-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.symlinkSync(outside, path.join(f.root, '.article-drafts'));
  assert.throws(() => f.prepare(), /符号链接/);
  fs.unlinkSync(path.join(f.root, '.article-drafts'));
  fs.symlinkSync(outside, path.join(f.root, 'content/articles/crypto'));
  assert.throws(() => f.prepare(), /符号链接/);
  assert.deepEqual(fs.readdirSync(outside), []);
});
