#!/usr/bin/env node

// Local authoring stages only: no model calls, network requests, Git or deployment.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parseArticleMarkdown, validateGuide, validateArticle, walkArticleFiles } from './lib/article-validation.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const TYPES = new Set(['tutorial', 'comparison', 'concept', 'referral', 'research', 'journal', 'overview']);
const ACCESS = new Set(['PUBLIC', 'MEMBER', 'VIP', 'VIP_PLUS']);
const REVIEW_KEYS = ['guide', 'facts', 'visuals', 'referrals', 'access'];
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const fail = message => { throw new Error(message); };
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

function rootPath(root) { return fs.realpathSync(root); }
function validId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(id)) fail('id 必须是 1–100 位字母、数字、下划线或连字符');
  return id;
}

// Reject every symlink on managed paths, even one currently pointing inside the root.
// This also prevents accidental writes through a previously linked draft/target directory.
function safePath(root, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\\') || relative.includes('\0') || relative.split('/').some(part => !part || part === '.' || part === '..')) fail('路径必须是项目内规范相对路径，不接受绝对路径或 ..');
  let cursor = root;
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) || fs.lstatSync(cursor, { throwIfNoEntry: false })) {
      const stat = fs.lstatSync(cursor);
      if (stat.isSymbolicLink()) fail(`拒绝符号链接路径：${relative}`);
      if (stat.isFile() && stat.nlink > 1) fail(`拒绝多重硬链接文件：${relative}`);
    }
  }
  return cursor;
}
function draftPath(root, id, name) { return safePath(root, `.article-drafts/${validId(id)}/${name}`); }
function targetPath(root, target) {
  if (typeof target !== 'string' || !/\.mdx?$/.test(target)) fail('target 必须是 content/articles 内的 .md 或 .mdx 文件');
  return safePath(root, `content/articles/${target}`);
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function saveJson(file, value) { fs.writeFileSync(file, json(value), { encoding: 'utf8', mode: 0o600 }); }
function assertIssues(issues, label) {
  const errors = issues.filter(issue => issue.severity === 'error');
  if (errors.length) fail(`${label}未通过：\n${errors.map(issue => `- ${issue.code}: ${issue.message}`).join('\n')}`);
}

// Compile only trusted repository configuration. A fresh cache per operation sees
// concurrent cover/series/access changes and does not execute article content.
function configLoader(root) {
  const cache = new Map();
  return function load(relative) {
    const filename = safePath(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const localRequire = name => {
      if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
      const base = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
      const resolved = ['.ts', '.tsx', '.json', ''].map(ext => base + ext).find(file => fs.existsSync(file));
      if (!resolved) fail(`配置依赖不存在：${name}`);
      const local = path.relative(root, resolved).split(path.sep).join('/');
      if (local.endsWith('.json')) return readJson(safePath(root, local));
      return load(local);
    };
    new Function('require', 'module', 'exports', source)(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  };
}

function singleLine(value, name) {
  if (typeof value !== 'string' || !value.trim() || /[\r\n\0]/.test(value)) fail(`${name} 必须是非空单行文本`);
  const text = value.trim();
  if (/\b(?:TODO|TBD)\b|待补充|待填写|占位文案|这里填写/i.test(text)) fail(`${name} 不允许占位内容`);
  return text;
}
function planMeta(plan) {
  return {
    id: plan.id, title: plan.title, categoryId: plan.categoryId, ...(plan.subcategoryId ? { subcategoryId: plan.subcategoryId } : {}),
    articleType: plan.type, authoringVersion: 1, summary: plan.summary, date: plan.date,
    guideAudience: plan.guide.audience.join(' | '), guideOutcomes: plan.guide.outcomes.join(' | '),
    guidePrepare: plan.guide.prepare, guideStatus: plan.guide.status,
  };
}
function published(root) {
  return walkArticleFiles(root).map(file => ({ file, ...parseArticleMarkdown(fs.readFileSync(file, 'utf8')) })).filter(entry => entry.meta.id);
}
function validatePlan(input, root) {
  if (!isObject(input) || !isObject(input.guide)) fail('必须先提供计划及独立的 guide 内容');
  const plan = { ...input, id: validId(input.id) };
  for (const field of ['title', 'summary', 'categoryId', 'date', 'target']) plan[field] = singleLine(input[field], field);
  if (!TYPES.has(input.type)) fail(`type 必须是：${[...TYPES].join(', ')}`);
  if (!ACCESS.has(input.access)) fail('access 必须明确指定 PUBLIC、MEMBER、VIP 或 VIP_PLUS');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plan.date) || Number.isNaN(Date.parse(plan.date)) || new Date(plan.date).toISOString().slice(0, 10) !== plan.date) fail('date 必须是有效的 YYYY-MM-DD 日期');
  targetPath(root, plan.target);
  const { categories, subcategories = [] } = configLoader(root)('lib/articles-data.ts');
  if (!categories.some(item => item.id === plan.categoryId)) fail(`分类不存在：${plan.categoryId}`);
  if (input.subcategoryId && !subcategories.some(item => item.id === input.subcategoryId && item.categoryId === plan.categoryId)) fail('subcategoryId 与分类不匹配');
  if (input.readTime !== undefined && (!Number.isInteger(input.readTime) || input.readTime < 1)) fail('readTime 必须为正整数');
  if (!Array.isArray(input.outline) || input.outline.length === 0) fail('必须先生成非空 outline，再撰写正文');
  plan.outline = input.outline.map(item => singleLine(item, 'outline'));
  plan.guide = {};
  for (const field of ['audience', 'outcomes']) {
    if (!Array.isArray(input.guide[field]) || !input.guide[field].length) fail(`必须先生成 guide.${field}`);
    plan.guide[field] = input.guide[field].map(item => {
      const line = singleLine(item, `guide.${field}`);
      if (line.includes('|')) fail('导读条目内部不能使用 | 分隔符');
      return line;
    });
  }
  for (const field of ['prepare', 'status']) plan.guide[field] = singleLine(input.guide[field], `guide.${field}`);
  if (input.seriesId !== undefined) plan.seriesId = singleLine(input.seriesId, 'seriesId');
  const peers = published(root);
  if (peers.some(entry => entry.meta.id === plan.id)) fail(`文章 id 已存在，生成流程不覆盖既有文章：${plan.id}`);
  const { genUid } = configLoader(root)('lib/article-uid.ts');
  if (peers.some(entry => entry.meta.categoryId === plan.categoryId && genUid(entry.meta.id) === genUid(plan.id))) fail('新 ID 与现有文章路由 UID 冲突，请选择不同 ID');
  assertIssues(validateGuide(planMeta(plan), { peers }), '逐篇导读');
  if (plan.summary.replace(/\s/g, '') === plan.title.replace(/\s/g, '')) fail('summary 不能重复标题');
  return plan;
}

export function prepareDraft({ root = projectRoot, planFile, plan: input }) {
  root = rootPath(root);
  const plan = validatePlan(input ?? readJson(planFile), root);
  const file = draftPath(root, plan.id, 'plan.json');
  const receiptFile = draftPath(root, plan.id, 'receipt.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Re-preparing invalidates any old composition/review; no old article is deleted.
  saveJson(file, plan);
  const receipt = { version: 1, stage: 'prepared', id: plan.id, planSha256: digest(json(plan)) };
  saveJson(receiptFile, receipt);
  return { stage: receipt.stage, id: plan.id, planFile: file, next: `compose --id ${plan.id} --body <body.md>` };
}

function prepared(root, id) {
  const planFile = draftPath(root, id, 'plan.json'), receiptFile = draftPath(root, id, 'receipt.json');
  if (!fs.existsSync(planFile) || !fs.existsSync(receiptFile)) fail('尚未完成 prepare：请先生成并验证逐篇导读计划');
  const receipt = readJson(receiptFile), raw = fs.readFileSync(planFile, 'utf8');
  if (receipt.version !== 1 || receipt.id !== id || receipt.stage === 'finalized' || !['prepared', 'composed'].includes(receipt.stage)) fail('生成阶段无效或已经完成；不重复写入文章');
  if (receipt.planSha256 !== digest(raw)) fail('计划已变动，请重新 prepare，不能沿用旧导读凭据');
  const plan = validatePlan(JSON.parse(raw), root);
  if (plan.id !== id) fail('计划 id 与草稿目录不一致');
  return { plan, receipt, receiptFile };
}
function chineseNumber(number) {
  const digits = '零一二三四五六七八九';
  if (number < 10) return digits[number];
  if (number < 20) return `十${number % 10 ? digits[number % 10] : ''}`;
  if (number < 100) return `${digits[Math.floor(number / 10)]}十${number % 10 ? digits[number % 10] : ''}`;
  fail('单篇文章不支持超过 99 个大章节，请拆分内容');
}

export function normalizeArticleBody(body, title) {
  if (typeof body !== 'string' || !body.trim()) fail('正文不能为空');
  const lines = body.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim().split('\n');
  // Only this exact duplicate is removable; a different H1 remains for validation.
  if (lines[0].trim() === `# ${title}`) lines.shift();
  let fence = null, count = 0;
  return lines.map(line => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker) {
      if (!fence) fence = { char: marker[1][0], size: marker[1].length };
      else if (marker[1][0] === fence.char && marker[1].length >= fence.size && !marker[2].trim()) fence = null;
      return line;
    }
    if (fence) return line;
    const heading = line.match(/^##\s+(.+)$/);
    if (!heading) return line;
    // A decimal/year at the beginning is content, not a list marker (0.5%, 2026.11).
    // Arabic dotted markers require whitespace; ambiguous prefixes are preserved.
    const headingText = heading[1].replace(/^(?:[一二三四五六七八九十百零]+、|\d{1,2}、|\d{1,2}[.．]\s+)/, '').trim();
    return `## ${chineseNumber(++count)}、${headingText}`;
  }).join('\n').trim() + '\n';
}
function readTime(body) {
  const chinese = body.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const words = body.match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil(chinese / 300 + words / 200));
}

export function composeDraft({ root = projectRoot, id, bodyFile, body }) {
  root = rootPath(root);
  const { plan, receipt, receiptFile } = prepared(root, id);
  const normalized = normalizeArticleBody(body ?? fs.readFileSync(bodyFile, 'utf8'), plan.title);
  const meta = { ...planMeta(plan), readTime: plan.readTime ?? readTime(normalized) };
  // The existing site parser supports single-line values, not nested YAML.
  // The site's single-line parser strips one outer quote on each side but does
  // not interpret JSON/YAML escapes. Only wrap boundary-quoted strings literally
  // to preserve quotes that belong to content (e.g. a title beginning with "ETF").
  const scalar = value => typeof value === 'string' && /^["']|["']$/.test(value) ? `"${value}"` : value;
  const raw = `---\n${Object.entries(meta).map(([key, value]) => `${key}: ${scalar(value)}`).join('\n')}\n---\n\n${normalized}`;
  const roundTrip = parseArticleMarkdown(raw);
  for (const [key, value] of Object.entries(meta)) {
    if (roundTrip.meta[key] !== String(value)) fail(`frontmatter 无法无损保存 ${key}，请检查单行格式`);
  }
  const articleFile = draftPath(root, id, 'article.md');
  fs.writeFileSync(articleFile, raw, { encoding: 'utf8', mode: 0o600 });
  saveJson(receiptFile, { ...receipt, stage: 'composed', articleSha256: digest(raw) });
  return { stage: 'composed', id, articleFile, articleSha256: digest(raw), next: `check --id ${id}` };
}

export function checkDraft({ root = projectRoot, id }) {
  root = rootPath(root);
  const { plan, receipt } = prepared(root, id);
  const file = draftPath(root, id, 'article.md');
  if (receipt.stage !== 'composed' || !fs.existsSync(file)) fail('请先 compose 正文，再检查或完成文章');
  const raw = fs.readFileSync(file, 'utf8'), articleSha256 = digest(raw);
  if (receipt.articleSha256 !== articleSha256) fail('正文已改变，请重新 compose 后复核，不能复用旧稿凭据');
  const target = targetPath(root, plan.target);
  if (fs.existsSync(target)) fail(`目标文件已存在，不允许覆盖：${plan.target}`);
  const issues = validateArticle({ raw, file: target, root, peers: published(root), strict: true });
  const load = configLoader(root);
  const { getContentAccessRule } = load('lib/content-access.ts');
  const { genUid } = load('lib/article-uid.ts');
  const staticAccess = getContentAccessRule(`/articles/${plan.categoryId}/${genUid(plan.id)}`).access;
  if (staticAccess !== plan.access) issues.push({ code: 'static-access-mismatch', severity: 'error', message: `计划权限 ${plan.access} 与静态权限 ${staticAccess} 不一致，请配置真实权限，不要改计划掩盖差异` });
  if (plan.seriesId) {
    const { articleSeries } = load('lib/article-library.ts');
    const series = articleSeries.find(item => item.id === plan.seriesId);
    if (!series || (series.existingArticleId !== id && !series.chapters.some(chapter => chapter.articleId === id))) issues.push({ code: 'series-membership-missing', severity: 'error', message: '计划中的系列未包含此文章，请维护真实系列关联' });
  }
  const cover = load('lib/article-covers.ts').articleCovers[id];
  let coverSha256;
  if (cover?.src?.startsWith('/')) {
    const coverFile = safePath(root, `public${cover.src}`);
    if (fs.existsSync(coverFile)) coverSha256 = digest(fs.readFileSync(coverFile));
  }
  if (!coverSha256) issues.push({ code: 'review-cover-missing', severity: 'error', message: '完成封面配置与文件后才能取得审阅哈希' });
  assertIssues(issues, '新稿严格校验');
  return { stage: 'checked', id, articleFile: file, target, planSha256: receipt.planSha256, articleSha256, coverSha256, staticAccess,
    accessScope: '仅检查网站代码中的文章公开策略；未查询线上数据库，也未进行线上匿名阅读全文验收', warnings: issues.filter(issue => issue.severity === 'warning') };
}

export function finalizeDraft({ root = projectRoot, id, reviewFile, review: input }) {
  root = rootPath(root);
  const checked = checkDraft({ root, id });
  const review = input ?? (reviewFile ? readJson(reviewFile) : null);
  if (!isObject(review) || !isObject(review.checks)) fail('必须先审阅实际文章与封面，提供 review 证据；程序不会自动确认事实或品牌正确');
  if (review.planSha256 !== checked.planSha256 || review.articleSha256 !== checked.articleSha256 || review.coverSha256 !== checked.coverSha256) fail('review 的计划、文章或封面哈希已过期，请按当前成稿重新审阅');
  for (const key of REVIEW_KEYS) {
    const note = singleLine(review.checks[key], `review.checks.${key}`);
    if (note.length < 10 || /^(?:true|通过|已检查|无问题|ok)[。.!！\s]*$/i.test(note)) fail(`review.checks.${key} 必须写具体核对说明，不能只打勾`);
  }
  const { receipt, receiptFile } = prepared(root, id);
  // Persist review before installation; output is always a new file (exclusive create).
  const savedReview = draftPath(root, id, 'review.json');
  saveJson(savedReview, review);
  fs.mkdirSync(path.dirname(checked.target), { recursive: true });
  const raw = fs.readFileSync(checked.articleFile, 'utf8');
  if (digest(raw) !== checked.articleSha256) fail('文章在检查后发生变化，请重试校验与审阅');
  fs.writeFileSync(checked.target, raw, { encoding: 'utf8', flag: 'wx', mode: 0o644 });
  saveJson(receiptFile, { ...receipt, stage: 'finalized', target: checked.target, reviewSha256: digest(json(review)) });
  return { stage: 'finalized', id, target: checked.target, reviewFile: savedReview,
    message: '已加入本地网站文章目录；未提交、推送或部署', staticAccess: checked.staticAccess, accessScope: checked.accessScope };
}

function cli(argv) {
  const [command, ...args] = argv;
  if (!command || command === '--help') {
    console.log('本地文章流水线（不部署）：\n  prepare --plan <plan.json>\n  compose --id <ID> --body <body.md>\n  check --id <ID>\n  finalize --id <ID> --review <review.json>');
    return;
  }
  const allowed = { prepare: ['plan'], compose: ['id', 'body'], check: ['id'], finalize: ['id', 'review'] }[command];
  if (!allowed) fail('未知命令，请运行 --help');
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    if (!args[i]?.startsWith('--') || !allowed.includes(key) || !args[i + 1] || args[i + 1].startsWith('--') || options[key]) fail(`无效参数：${args[i]}`);
    options[key] = args[i + 1];
  }
  for (const key of allowed) if (!options[key]) fail(`缺少 --${key}`);
  const result = command === 'prepare' ? prepareDraft({ planFile: options.plan })
    : command === 'compose' ? composeDraft({ id: options.id, bodyFile: options.body })
      : command === 'check' ? checkDraft({ id: options.id }) : finalizeDraft({ id: options.id, reviewFile: options.review });
  console.log(JSON.stringify(result, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
