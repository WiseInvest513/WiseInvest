import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  loadValidationConfig, parseArticleMarkdown, validateArticle,
  validateGuide, validateRepository, walkArticleFiles,
} from '../scripts/lib/article-validation.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const appConfig = loadValidationConfig(projectRoot);
const guide = {
  guideAudience: '还没有注册 OKX，想先理解账户申请流程的人 | 已有账户但分不清人民币买币和现货交易的用户',
  guideOutcomes: '按认证、C2C 与现货委托区分操作阶段 | 看懂转账核对、付款确认和账户安全的检查项',
  guidePrepare: '准备本人证件及可以接收验证的联系方式，付款前核对本人账户和订单要求。',
  guideStatus: '本文介绍账户和买币操作，不讨论杠杆策略；不同地区与账户的实际开放功能需要分别确认。',
};
const meta = {
  id: 'sample-okx', title: 'OKX 账户申请与买币流程', categoryId: 'crypto',
  date: '2026-11-06', readTime: '8', summary: '先理解账户与资金流转，再按认证、C2C 和现货交易的顺序核对操作结果。',
  ...guide,
};
const body = '本文从账户申请开始，帮助你理解人民币买 U 与现货买币的区别。\n\n## 一、认识账户\n\n先确认账户用途及自己所在地区的资格，本文不替代实名审核。\n\n## 二、核对操作结果\n\n认证、转账与买币不是同一步，每一步都要在当前页面核对结果。\n';
const markdown = (fields = meta, content = body) => `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n\n${content}`;
const codes = result => result.map(item => item.code);

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wise-article-validation-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'content/articles/crypto/sample/article.md');
  const cover = '/images/articles/covers/sample.webp';
  const icon = '/images/brand/okx.svg';
  for (const directory of ['lib', 'content/articles/crypto/sample', 'public/images/articles/covers', 'public/images/brand']) fs.mkdirSync(path.join(root, directory), { recursive: true });
  fs.copyFileSync(path.join(projectRoot, 'public/images/articles/covers/galaxy-etf-guide.webp'), path.join(root, 'public', cover));
  fs.writeFileSync(path.join(root, 'public', icon), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  const config = {
    covers: { [meta.id]: { src: cover, alt: 'OKX 账户与资金操作示意' } },
    categories: [{ id: 'crypto' }], subcategories: [],
    parseRegistrationCallout: appConfig.parseRegistrationCallout,
    getRegistrationBrand: (href, title) => /OKX/.test(title ?? '') ? { name: 'OKX', iconSrc: icon, tone: 'black' } : undefined,
  };
  // Minimal source config lets repository checks exercise the real build-time loader.
  fs.writeFileSync(path.join(root, 'lib/article-covers.ts'), `export const articleCovers = ${JSON.stringify(config.covers)};`);
  fs.writeFileSync(path.join(root, 'lib/articles-data.ts'), 'export const categories = [{id:"crypto"}]; export const subcategories = [];');
  fs.writeFileSync(path.join(root, 'lib/article-registration.ts'), fs.readFileSync(path.join(projectRoot, 'lib/article-registration.ts')));
  fs.writeFileSync(path.join(root, 'lib/registration-brands.ts'), 'export function getRegistrationBrand(){ return undefined; }');
  const validate = (raw = markdown(), options = {}) => validateArticle({ raw, file, root, strict: true, config, ...options });
  return { root, file, cover, icon, config, validate };
}

test('parser reads existing single-line frontmatter, rejects duplicate keys and multiline YAML', () => {
  const parsed = parseArticleMarkdown('\uFEFF' + markdown().replaceAll('\n', '\r\n'));
  assert.deepEqual(parsed.meta, meta);
  assert.equal(parsed.body, body);
  assert.deepEqual(parsed.issues, []);
  assert(codes(parseArticleMarkdown('---\nid: first\nid: second\n---\n').issues).includes('frontmatter.duplicate'));
  assert(codes(parseArticleMarkdown('---\nsummary: |\n  text\n---\n').issues).includes('frontmatter.multiline'));
  assert(codes(parseArticleMarkdown('---\nid: broken\n').issues).includes('frontmatter.missing'));
});

test('guide gate requires all four authored fields and rejects boilerplate without generating anything', () => {
  assert.deepEqual(validateGuide(meta), []);
  for (const field of Object.keys(guide)) {
    assert(validateGuide({ ...meta, [field]: '' }).some(item => item.code === 'guide.required' && item.field === field));
  }
  assert(codes(validateGuide({ ...meta, guideAudience: '甲 | ' })).includes('guide.list'));
  assert(codes(validateGuide({ ...meta, guidePrepare: 'TODO' })).includes('guide.boilerplate'));
  assert(codes(validateGuide({ ...meta, guideOutcomes: '把文章里的关键信息转成可执行步骤' })).includes('guide.boilerplate'));
  assert(codes(validateGuide({ ...meta, guideAudience: '相同的目标读者群体 | 相同的目标读者群体' })).includes('guide.repeatedItem'));
});

test('guide duplicate comparison covers other articles but permits an article edit', () => {
  assert.deepEqual(validateGuide(meta, { peers: [{ meta }] }), []);
  const copy = { ...meta, id: 'other-article' };
  assert.equal(validateGuide(copy, { peers: [meta] }).filter(item => item.code === 'guide.duplicate').length, 2);
  const fields = { ...copy, guideAudience: '不同读者面对另外一个实际问题', guideOutcomes: '从本文获得另一项具体操作的认识' };
  assert.deepEqual(validateGuide(fields, { peers: [{ meta }] }), []);
});

test('a complete new article with existing cover passes without creating or altering files', t => {
  const { validate, file } = fixture(t);
  assert(!fs.existsSync(file));
  assert.deepEqual(validate(), []);
  assert(!fs.existsSync(file), 'validation is read-only even when the future article path does not exist');
});

test('missing metadata, repeated summary, invalid dates and unknown taxonomy fail closed', t => {
  const { validate } = fixture(t);
  assert(codes(validate(markdown({ ...meta, title: '' }))).includes('metadata.required'));
  assert(codes(validate(markdown({ ...meta, summary: meta.title }))).includes('metadata.summaryDuplicate'));
  assert(codes(validate(markdown({ ...meta, date: '2026-02-30' }))).includes('metadata.date'));
  assert(codes(validate(markdown({ ...meta, readTime: '0' }))).includes('metadata.readTime'));
  assert(codes(validate(markdown({ ...meta, categoryId: 'unknown' }))).includes('metadata.category'));
  assert(codes(validate(markdown({ ...meta, subcategoryId: 'wrong' }))).includes('metadata.subcategory'));
});

test('new articles require continuous numbered chapters and no empty placeholder sections', t => {
  const { validate } = fixture(t);
  const draft = '# 重复标题\n\n## 二、内容\n\nTODO\n\n## 三、空章\n';
  const errors = validate(markdown(meta, draft));
  for (const code of ['body.h1', 'body.headingSequence', 'body.emptySection', 'body.placeholder']) assert(codes(errors).includes(code), code);
  assert(errors.filter(item => item.code.startsWith('body.')).every(item => item.severity === 'error'));
  const legacy = validate(markdown(meta, draft), { strict: false });
  assert(legacy.filter(item => item.code.startsWith('body.')).every(item => item.severity === 'warning'));
  assert.deepEqual(validate(markdown(meta, body + '\n```markdown\n# 示例标题\n## 任意序号\nTODO\n```\n')), []);
});

test('missing cover is always blocking, and oversize covers are strict errors or legacy warnings', t => {
  const { validate, config, root, cover } = fixture(t);
  assert(codes(validate(undefined, { config: { ...config, covers: {} } })).includes('cover.required'));
  assert(codes(validate(undefined, { config: { ...config, covers: { [meta.id]: { src: '/missing.webp', alt: '描述' } } } })).includes('cover.missing'));
  fs.appendFileSync(path.join(root, 'public', cover), Buffer.alloc(26 * 1024));
  assert.equal(validate().find(item => item.code === 'cover.bytes')?.severity, 'error');
  assert.equal(validate(undefined, { strict: false }).find(item => item.code === 'cover.bytes')?.severity, 'warning');
});

test('cover validation reads real image dimensions and format, not just the extension', t => {
  const { validate, root, cover } = fixture(t);
  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZb8AAAAASUVORK5CYII=', 'base64');
  fs.writeFileSync(path.join(root, 'public', cover), tinyPng);
  assert(codes(validate()).includes('cover.format'));
  assert(codes(validate()).includes('cover.dimensions'));
});

test('future article paths resolve local screenshots, with missing files blocking strict publication', t => {
  const { validate, root, cover } = fixture(t);
  const content = body + '\n![操作截图](./step.webp)\n';
  assert.equal(validate(markdown(meta, content)).find(item => item.code === 'image.missing')?.severity, 'error');
  assert.equal(validate(markdown(meta, content), { strict: false }).find(item => item.code === 'image.missing')?.severity, 'warning');
  const directory = path.join(root, 'public/content/articles/crypto/sample');
  fs.mkdirSync(directory, { recursive: true });
  fs.copyFileSync(path.join(root, 'public', cover), path.join(directory, 'step.webp'));
  assert.deepEqual(validate(markdown(meta, content)), []);
  assert(codes(validate(markdown(meta, body + `\n![宣传封面](${cover})`))).includes('image.listCoverInBody'));
  assert(codes(validate(markdown(meta, body + '\n![越界](/../../outside.png)'))).includes('image.missing'));
});

test('referral-recovery prose is not forced into a new-account invitation card', t => {
  const { validate } = fixture(t);
  const recovery = body + '\n> 已经注册但忘记邀请码时，先核对账户邀请关系，不要立刻注销。\n';
  assert.deepEqual(validate(markdown(meta, recovery)), []);
});

test('real invitation parser and brand mappings reject malformed or unknown cards and missing icons', t => {
  const { validate, root, icon } = fixture(t);
  const valid = '> [注册 OKX 账户](https://okx.com/join/known) · 邀请码：**KNOWN**';
  assert.deepEqual(validate(markdown(meta, body + '\n' + valid)), []);
  assert(codes(validate(markdown(meta, body + '\n' + valid.replace('**KNOWN**', 'KNOWN')))).includes('invitation.syntax'));
  assert(codes(validate(markdown(meta, body + '\n' + valid.replace('OKX', '未知品牌')))).includes('invitation.brand'));
  assert(codes(validate(markdown(meta, body + '\n' + valid + '\n' + valid))).includes('invitation.duplicate'));
  assert(codes(validate(markdown(meta, body + '\n' + valid + ' · 福利：暂无专属福利'))).includes('invitation.emptyBenefit'));
  fs.unlinkSync(path.join(root, 'public', icon));
  assert(codes(validate(markdown(meta, body + '\n' + valid))).includes('invitation.icon'));
});

test('repository validation skips no-id drafts but catches duplicates before the site can deduplicate', t => {
  const { root, file } = fixture(t);
  fs.writeFileSync(file, markdown());
  fs.writeFileSync(path.join(path.dirname(file), 'draft.md'), '# 一个尚未进入发布目录的旧草稿\n');
  assert.equal(walkArticleFiles(root).length, 2);
  const clean = validateRepository(root);
  assert.equal(clean.articleCount, 1);
  assert.deepEqual(clean.errors, []);
  const duplicate = path.join(path.dirname(file), 'duplicate.md');
  fs.writeFileSync(duplicate, markdown());
  const result = validateRepository(root, { files: [file] });
  assert.equal(result.articleCount, 1);
  assert(codes(result.errors).includes('metadata.duplicateId'));
});

test('a malformed published file is reported instead of silently disappearing', t => {
  const { root, file } = fixture(t);
  fs.writeFileSync(file, '---\nid: broken\ntitle: 缺失结束边界\n');
  const result = validateRepository(root);
  assert.equal(result.articleCount, 1);
  assert(codes(result.errors).includes('frontmatter.missing'));
  assert(codes(validateRepository(root, { files: ['content/articles/missing.md'] }).errors).includes('file.notArticle'));
});

test('workflow-created articles retain strict rules during ordinary repository builds', t => {
  const { root, file } = fixture(t);
  const unnumbered = body.replace('## 一、认识账户', '## 认识账户');
  fs.writeFileSync(file, markdown(meta, unnumbered));
  assert.equal(validateRepository(root).errors.length, 0);
  fs.writeFileSync(file, markdown({ ...meta, authoringVersion: '1' }, unnumbered));
  assert(codes(validateRepository(root).errors).includes('body.headingSequence'));
});

test('current published guides pass hard requirements without silently removing articles', () => {
  const result = validateRepository(projectRoot);
  assert(result.articleCount >= 65);
  assert.deepEqual(result.errors, []);
});
