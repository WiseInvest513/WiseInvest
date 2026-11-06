import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { imageSize } = require('next/dist/compiled/image-size');
const GUIDE_LISTS = ['guideAudience', 'guideOutcomes'];
const GUIDE_TEXT = ['guidePrepare', 'guideStatus'];
const GENERIC_GUIDE = /第一次接触这个主题，想快速建立全局理解|把文章里的关键信息转成可执行步骤|先看完摘要和目录，再按自己的场景|内容会持续维护，涉及价格/;
const PLACEHOLDER = /^(?:TODO|TBD|待填写|待补充|占位|读者一|读者二|收获一|收获二|准备事项|内容边界|示例文案)(?:[。.!！\s]*)$/i;
const normalize = value => String(value ?? '').normalize('NFKC').replace(/[\s\p{P}\p{S}]+/gu, '').toLowerCase();
const issue = (code, message, field, severity = 'error') => ({ code, message, ...(field ? { field } : {}), severity });
const asMeta = entry => entry?.meta ?? entry;

/** The site intentionally supports single-line frontmatter, not arbitrary YAML. */
export function parseArticleMarkdown(raw) {
  const text = String(raw ?? '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return { meta: {}, body: text, issues: [issue('frontmatter.missing', '缺少完整的单行 frontmatter。')] };
  const meta = {};
  const issues = [];
  for (const [index, line] of match[1].split('\n').entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const field = line.match(/^([A-Za-z][\w-]*):[ \t]*(.*)$/);
    if (!field) {
      issues.push(issue('frontmatter.line', `frontmatter 第 ${index + 2} 行不是支持的 key: value 格式。`));
      continue;
    }
    const [, key, value] = field;
    if (Object.hasOwn(meta, key)) issues.push(issue('frontmatter.duplicate', `字段 ${key} 重复，网站读取时会覆盖前值。`, key));
    meta[key] = value.trim().replace(/^["']|["']$/g, '');
    if (/^[|>][+-]?$/.test(meta[key])) issues.push(issue('frontmatter.multiline', `${key} 必须写在一行，不能使用 YAML 多行块。`, key));
  }
  return { meta, body: text.slice(match[0].length).trimStart(), issues };
}

/** Content has to be authored; this function never manufactures fallback copy. */
export function validateGuide(meta, { peers = [] } = {}) {
  const issues = [];
  for (const field of [...GUIDE_LISTS, ...GUIDE_TEXT]) {
    const value = meta?.[field];
    if (typeof value !== 'string' || !value.trim()) {
      issues.push(issue('guide.required', `必须先逐篇撰写 ${field}，不能用分类模板替代。`, field));
      continue;
    }
    if (/[\r\n]/.test(value)) issues.push(issue('guide.singleLine', `${field} 必须为单行。`, field));
    const values = GUIDE_LISTS.includes(field) ? value.split('|').map(item => item.trim()) : [value.trim()];
    if (GUIDE_LISTS.includes(field) && (values.length < 1 || values.length > 3 || values.some(item => !item))) {
      issues.push(issue('guide.list', `${field} 用 | 分隔 1–3 条具体内容，不能有空条目。`, field));
    }
    if (values.some(item => item.length < (GUIDE_LISTS.includes(field) ? 8 : 15))) {
      issues.push(issue('guide.tooShort', `${field} 未充分描述这篇文章的读者、收获或适用条件。`, field));
    }
    if (values.some(item => PLACEHOLDER.test(item)) || GENERIC_GUIDE.test(value)) {
      issues.push(issue('guide.boilerplate', `${field} 含占位内容或已废弃的通用导读。`, field));
    }
    if (new Set(values.map(normalize)).size !== values.length) issues.push(issue('guide.repeatedItem', `${field} 内条目重复。`, field));
  }
  for (const field of GUIDE_LISTS) {
    const value = normalize(meta?.[field]);
    if (!value) continue;
    const duplicate = peers.map(asMeta).find(peer => peer && peer.id !== meta.id && normalize(peer[field]) === value);
    if (duplicate) issues.push(issue('guide.duplicate', `${field} 与文章 ${duplicate.id ?? '另一篇'} 完全重复，需根据本篇实际内容改写。`, field));
  }
  return issues;
}

/** Reuse current application mappings/parsers. This loader runs in Node tooling only. */
export function loadValidationConfig(root) {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
        const resolved = ['.ts', '.js', '.json'].map(ext => base + ext).find(candidate => fs.existsSync(candidate));
        if (!resolved) throw new Error(`无法读取 ${name}（${relative}）`);
        if (resolved.endsWith('.json')) return JSON.parse(fs.readFileSync(resolved, 'utf8'));
        return load(path.relative(root, resolved));
      }
      return require(name);
    }, module, module.exports);
    return module.exports;
  }
  return {
    covers: load('lib/article-covers.ts').articleCovers,
    categories: load('lib/articles-data.ts').categories,
    subcategories: load('lib/articles-data.ts').subcategories,
    parseRegistrationCallout: load('lib/article-registration.ts').parseRegistrationCallout,
    getRegistrationBrand: load('lib/registration-brands.ts').getRegistrationBrand,
  };
}

function withoutFences(body) {
  let fence;
  return body.split('\n').map(line => {
    const token = line.match(/^\s*(`{3,}|~{3,})/);
    if (token) {
      if (!fence) fence = token[1];
      else if (token[1][0] === fence[0] && token[1].length >= fence.length) fence = undefined;
      return '';
    }
    return fence ? '' : line;
  }).join('\n');
}

function chineseNumber(value) {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (value < 10) return digits[value];
  if (value < 20) return '十' + (value % 10 ? digits[value % 10] : '');
  if (value < 100) return digits[Math.floor(value / 10)] + '十' + (value % 10 ? digits[value % 10] : '');
  return String(value);
}

function localAsset(root, source) {
  let pathname;
  try { pathname = decodeURIComponent(source.split(/[?#]/, 1)[0]); } catch { return undefined; }
  if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('\\')) return undefined;
  const publicRoot = path.resolve(root, 'public');
  const target = path.resolve(publicRoot, '.' + pathname);
  if (!target.startsWith(publicRoot + path.sep)) return undefined;
  // Do not follow an asset symlink out of public while validating supplied drafts.
  if (fs.existsSync(target) && !fs.realpathSync(target).startsWith(fs.realpathSync(publicRoot) + path.sep)) return undefined;
  return target;
}

export function validateArticle({ raw, file, root, peers = [], strict = false, config }) {
  const parsed = parseArticleMarkdown(raw);
  const { meta, body } = parsed;
  const issues = [...parsed.issues, ...validateGuide(meta, { peers })];
  const editorial = strict ? 'error' : 'warning';
  for (const field of ['id', 'title', 'categoryId', 'date', 'readTime', 'summary']) {
    if (!meta[field]?.trim()) issues.push(issue('metadata.required', `缺少文章字段 ${field}。`, field));
  }
  if (meta.id && !/^[A-Za-z0-9_-]+$/.test(meta.id)) issues.push(issue('metadata.id', '文章 ID 只能使用英文字母、数字、下划线及短横线。', 'id'));
  if (meta.date && (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || Number.isNaN(Date.parse(meta.date)) || new Date(meta.date).toISOString().slice(0, 10) !== meta.date)) issues.push(issue('metadata.date', '文章日期必须是有效的 YYYY-MM-DD，不代表规则核验日期。', 'date'));
  if (meta.readTime && !/^[1-9]\d*$/.test(meta.readTime)) issues.push(issue('metadata.readTime', 'readTime 必须为正整数分钟。', 'readTime'));
  if (meta.title && normalize(meta.summary) === normalize(meta.title)) issues.push(issue('metadata.summaryDuplicate', '摘要不能重复标题，应概括具体内容。', 'summary'));
  if (meta.summary && PLACEHOLDER.test(meta.summary)) issues.push(issue('metadata.placeholder', '摘要仍为占位内容。', 'summary'));
  if (!body.trim()) issues.push(issue('body.empty', '正文为空。'));
  const prose = withoutFences(body);
  if (/^#\s+/m.test(prose)) issues.push(issue('body.h1', '页面已用 title 生成主标题，正文不要再放 H1。', undefined, editorial));
  if (/^\s*(?:TODO|TBD|待补充正文|正文待补充|教程马上安排|此处填写正文)\s*[。.!！]?\s*$/im.test(prose)) issues.push(issue('body.placeholder', '正文仍有未完成的占位段落。', undefined, editorial));
  const headings = [...prose.matchAll(/^##\s+(.+)$/gm)];
  if (!headings.length) issues.push(issue('body.sections', '正文需要有实际内容的大章节。', undefined, editorial));
  for (const [index, match] of headings.entries()) {
    if (!match[1].startsWith(chineseNumber(index + 1) + '、')) issues.push(issue('body.headingSequence', `第 ${index + 1} 个大章节应以「## ${chineseNumber(index + 1)}、」开头。`, undefined, editorial));
    const section = prose.slice(match.index + match[0].length, headings[index + 1]?.index).replace(/^\s*#{1,6}\s+.*$/gm, '').replace(/[\s*-]/g, '');
    if (!section) issues.push(issue('body.emptySection', `章节「${match[1]}」没有内容。`, undefined, editorial));
  }
  try { config ??= loadValidationConfig(root); } catch (error) {
    issues.push(issue('config.unreadable', `无法加载网站文章配置：${error.message}`));
    return issues;
  }
  if (meta.categoryId && !config.categories?.some(category => category.id === meta.categoryId)) issues.push(issue('metadata.category', `未知文章分类 ${meta.categoryId}。`, 'categoryId'));
  if (meta.subcategoryId && !config.subcategories?.some(category => category.id === meta.subcategoryId && category.categoryId === meta.categoryId)) issues.push(issue('metadata.subcategory', `二级分类 ${meta.subcategoryId} 不属于当前文章分类。`, 'subcategoryId'));
  const cover = config.covers?.[meta.id];
  if (!cover?.src) issues.push(issue('cover.required', '缺少独立列表封面配置，不得回退到正文第一张图。'));
  else {
    const coverPath = localAsset(root, cover.src);
    if (!coverPath || !fs.existsSync(coverPath) || !fs.statSync(coverPath).isFile()) issues.push(issue('cover.missing', `列表封面不存在或路径无效：${cover.src}`));
    else {
      try {
        const buffer = fs.readFileSync(coverPath);
        const dimensions = imageSize(buffer);
        if (!cover.src.startsWith('/images/articles/covers/') || !/\.webp$/i.test(cover.src) || dimensions.type !== 'webp') issues.push(issue('cover.format', '列表封面应集中保存在 public/images/articles/covers/，格式为 WebP。', undefined, editorial));
        if (dimensions.width !== 640 || dimensions.height !== 360) issues.push(issue('cover.dimensions', `列表封面为 ${dimensions.width}×${dimensions.height}，标准为 640×360。`, undefined, editorial));
        if (buffer.length > 25 * 1024) issues.push(issue('cover.bytes', `列表封面 ${(buffer.length / 1024).toFixed(1)} KB，需压缩至不超过 25 KB。`, undefined, editorial));
      } catch { issues.push(issue('cover.invalid', `无法读取封面图尺寸：${cover.src}`)); }
    }
    if (!cover.alt?.trim()) issues.push(issue('cover.alt', '封面配置缺少描述内容的 alt。', undefined, editorial));
  }
  const base = path.relative(path.join(root, 'content/articles'), path.dirname(path.resolve(file))).split(path.sep).join('/');
  for (const match of prose.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    const src = match[1].trim();
    if (/^https?:\/\//i.test(src)) continue; // No network request, and no claim that remote assets were checked.
    if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(src)) {
      issues.push(issue('image.protocol', `图片使用了不支持的地址：${src}`, undefined, editorial));
      continue;
    }
    const imageUrl = src.startsWith('/') ? src : `/content/articles/${base}/${src.replace(/^\.\//, '')}`;
    const imagePath = localAsset(root, imageUrl);
    if (!imagePath || !fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) issues.push(issue('image.missing', `正文图片不存在或路径无效：${src}`, undefined, editorial));
    if (cover?.src === imageUrl) issues.push(issue('image.listCoverInBody', '列表封面不应重复放入正文；只去掉此封面引用，不删除操作截图或原文件。', undefined, editorial));
  }
  const seenBrands = new Set();
  for (const line of prose.split('\n')) {
    const card = config.parseRegistrationCallout(line);
    if (!card) {
      if (/^>\s*(?:\[)?(?:注册|开通|申请|领取|使用)\s/.test(line) && / · (?:邀请码|优惠码|邀请链接)/.test(line)) issues.push(issue('invitation.syntax', '邀请卡格式无法识别，需使用统一的注册/申请/使用引用行。', undefined, editorial));
      continue;
    }
    const brand = config.getRegistrationBrand(card.href, card.title);
    if (!brand) issues.push(issue('invitation.brand', `邀请卡「${card.title}」没有明确品牌映射，不能默认通用黄色卡。`));
    else {
      const icon = localAsset(root, brand.iconSrc);
      if (!icon || !fs.existsSync(icon) || !fs.statSync(icon).isFile() || !fs.statSync(icon).size) issues.push(issue('invitation.icon', `邀请卡「${card.title}」缺少本地品牌图标。`));
      if (seenBrands.has(brand.name)) issues.push(issue('invitation.duplicate', `同一文章重复放置 ${brand.name} 邀请卡。`, undefined, editorial));
      seenBrands.add(brand.name);
    }
    if (card.codeLabel !== '优惠码' && /暂无|待补/.test(card.benefitText ?? '')) issues.push(issue('invitation.emptyBenefit', '注册邀请卡不能显示暂无/待补；无具体权益时沿用独家福利说明，不编造数字。', undefined, editorial));
    if (card.href && /https:\/\/(?:www\.)?example\.(?:com|org)(?:\/|$)/i.test(card.href)) issues.push(issue('invitation.placeholder', '邀请卡仍使用示例链接。', undefined, editorial));
  }
  return issues;
}

export function walkArticleFiles(root) {
  const directory = path.join(root, 'content/articles');
  function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return entry.isFile() && /\.mdx?$/.test(entry.name) ? [full] : [];
    });
  }
  return walk(directory).sort();
}

export function validateRepository(root, { files, strict = false } = {}) {
  root = path.resolve(root);
  const errors = [], warnings = [];
  const records = [];
  const report = (entry, file, id) => (entry.severity === 'error' ? errors : warnings).push({ ...entry, file, ...(id ? { id } : {}) });
  // Enumerate every article even for selected checks: duplicates must not evade the gate.
  for (const file of walkArticleFiles(root)) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const parsed = parseArticleMarkdown(raw);
      if (parsed.meta.id || /^id\s*:/m.test(raw)) records.push({ file, raw, ...parsed });
    } catch (error) { report(issue('file.unreadable', `无法读取文章：${error.message}`), file); }
  }
  const selected = files?.map(file => path.resolve(root, file));
  const chosen = selected ? records.filter(record => selected.includes(record.file)) : records;
  if (selected) {
    for (const file of selected) if (!records.some(record => record.file === file)) report(issue('file.notArticle', '指定文件不存在或不是带 ID 的文章。'), file);
  }
  let config;
  try { config = loadValidationConfig(root); } catch (error) {
    report(issue('config.unreadable', `无法加载网站文章配置：${error.message}`), root);
    return { articleCount: chosen.length, errors, warnings };
  }
  const byId = new Map();
  for (const record of records) {
    if (!record.meta.id) continue;
    if (byId.has(record.meta.id)) report(issue('metadata.duplicateId', `文章 ID ${record.meta.id} 与 ${path.relative(root, byId.get(record.meta.id))} 重复。`), record.file, record.meta.id);
    else byId.set(record.meta.id, record.file);
  }
  for (const record of chosen) {
    // Workflow-created articles keep the strict contract on later builds too.
    const enforceStrict = strict || Boolean(record.meta.authoringVersion);
    for (const entry of validateArticle({ ...record, root, strict: enforceStrict, peers: records, config })) report(entry, record.file, record.meta.id);
  }
  return { articleCount: chosen.length, errors, warnings };
}
