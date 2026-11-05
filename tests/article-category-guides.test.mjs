import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const cache = new Map();
const jsx = (type, props) => ({ type, props });
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const requireMock = name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'react') return { useMemo: fn => fn(), useRef: () => ({ current: null }) };
    if (name === 'next/link') return { __esModule: true, default: 'a' };
    if (name === 'next/image') return { __esModule: true, default: 'img' };
    if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => `Icon.${String(key)}` });
    if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (name === '@/components/content-access-gate') return { ProtectedContentLink: 'a' };
    if (name === '@/components/article-card') return { ArticleCard: 'ArticleCard' };
    if (name.startsWith('@/lib/')) return load(`${name.slice(2)}.ts`);
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', code)(requireMock, module, module.exports);
  cache.set(relative, module.exports);
  return module.exports;
}
const { categories, subcategories } = load('lib/articles-data.ts');
const { categoryGuides, subcategoryGuides, getCategoryGuide } = load('lib/article-category-guides.ts');
const { ArticleLibrary } = load('app/articles/article-library.tsx');
function nodes(tree, predicate) {
  const result = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) result.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  return result;
}
const text = tree => Array.isArray(tree) ? tree.map(text).join('') : tree && typeof tree === 'object' ? text(tree.props?.children) : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : '';
const render = props => ArticleLibrary({ articles: [], view: 'recommended', searchQuery: '', onSearchChange() {}, ...props });
const heading = tree => nodes(tree, node => node.type === 'h1')[0];

test('all fourteen categories have distinct introductions, art and three concrete learning outcomes', () => {
  assert.deepEqual(Object.keys(categoryGuides).sort(), categories.map(c => c.id).sort());
  assert.equal(new Set(Object.values(categoryGuides).map(g => g.description)).size, 14);
  assert.equal(new Set(Object.values(categoryGuides).map(g => g.artwork)).size, 14);
  for (const category of categories) {
    const guide = getCategoryGuide(category.id);
    assert.equal(guide.outcomes.length, 3);
    assert.ok(guide.description.length > 30);
    assert.ok(guide.tagline.length > 10);
    const tree = render({categoryId: category.id, articles: [{id: 'example', categoryId: category.id, title: 'Example', summary: ''}]});
    assert.equal(text(heading(tree)), category.name);
    assert.equal(nodes(tree, n => n.type === 'img' && n.props.src === guide.artwork).length, 1);
    const outcomes = nodes(tree, n => n.props.className === 'categoryOutcomes')[0];
    assert.equal(nodes(outcomes, n => n.type === 'li').length, 3);
    assert.ok(text(tree).includes(guide.description));
    assert.ok(text(tree).includes('在这里，你可以学会'));
    assert.ok(!text(tree).includes('按自己的需要选择阅读'));
  }
});

test('all seven subcategory introductions are owned by the correct parent and preserve filters', () => {
  assert.deepEqual(Object.keys(subcategoryGuides).sort(), subcategories.map(c => c.id).sort());
  for (const sub of subcategories) {
    const parent = getCategoryGuide(sub.categoryId);
    const guide = getCategoryGuide(sub.categoryId, sub.id);
    assert.notEqual(guide.description, parent.description);
    assert.equal(guide.artwork, parent.artwork);
    const tree = render({categoryId: sub.categoryId, subcategoryId: sub.id});
    assert.equal(text(heading(tree)), sub.name);
    assert.ok(text(tree).includes(guide.description));
    assert.equal(nodes(tree, n => n.type === 'a' && n.props['aria-current'] === 'page')[0].props.href, `/articles/${sub.categoryId}?subcategory=${sub.id}`);
  }
  assert.equal(getCategoryGuide('crypto', 'us-broker'), getCategoryGuide('crypto'));
  assert.equal(getCategoryGuide('bank', 'constructor'), getCategoryGuide('bank'));
  for (const id of [undefined, 'unknown', '__proto__', 'constructor', 'toString']) assert.equal(getCategoryGuide(id), undefined);
});

test('every icon is a lightweight transparent local asset with an archived original', async () => {
  for (const [id, guide] of Object.entries(categoryGuides)) {
    const file = path.join(root, 'public', guide.artwork);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, 256, id);
    assert.equal(metadata.height, 256, id);
    assert.ok(metadata.hasAlpha, id);
    const stats = await sharp(file).stats();
    assert.equal(stats.channels[3].min, 0, `${id} has real transparency`);
    assert.equal(stats.channels[3].max, 255, `${id} is not blank`);
    assert.ok(fs.statSync(file).size < 20000, id);
    assert.ok(fs.existsSync(path.join(root, 'assets/source-images/article-category-icons', `${id}-ivory.png`)));
  }
});

test('search replaces category content and counts remain tied to filtered articles', () => {
  const articles = [
    {id: 'a', categoryId: 'bank', subcategoryId: 'digital-bank', title: 'Wise', summary: 'Account'},
    {id: 'b', categoryId: 'bank', subcategoryId: 'physical-bank', title: 'Bank', summary: 'Account'},
    {id: 'c', categoryId: 'crypto', title: 'Crypto', summary: 'Exchange'},
  ];
  const tree = render({categoryId: 'bank', subcategoryId: 'digital-bank', articles});
  assert.equal(nodes(tree, n => n.type === 'ArticleCard').length, 1);
  assert.ok(text(nodes(tree, n => n.props.className === 'categoryArticleHeading')[0]).includes('(1)'));
  const search = render({categoryId: 'bank', searchQuery: 'Crypto', articles});
  assert.equal(text(heading(search)), '搜索结果');
  assert.equal(nodes(search, n => n.props.className === 'categoryIntro').length, 0);
  assert.equal(nodes(search, n => n.props.className === 'categoryLearning').length, 0);
  assert.equal(nodes(search, n => n.type === 'ArticleCard')[0].props.article.id, 'c');
});

test('empty categories clearly describe planned content without offering nonexistent lessons', () => {
  const tree = render({categoryId: 'strategy'});
  assert.ok(text(tree).includes('计划整理的学习方向'));
  assert.ok(text(tree).includes('内容筹备中，暂时没有已发布文章。'));
  assert.ok(!text(tree).includes('在这里，你可以学会'));
  assert.equal(nodes(tree, n => n.type === 'ArticleCard').length, 0);
  assert.ok(text(nodes(tree, n => n.props.className === 'categoryArticleHeading')[0]).includes('(0)'));
});

test('library landing views remain separate from category introductions', () => {
  for (const [view, title, artwork] of [['recommended', '文章中心', 'reading'], ['series', '系列内容', 'series'], ['all', '全部文章', 'all']]) {
    const tree = render({view});
    assert.equal(text(heading(tree)), title);
    assert.equal(nodes(tree, n => n.props.className === 'categoryLearning').length, 0);
    const icon = nodes(tree, n => n.props.className === 'libraryIcon')[0];
    assert.equal(icon.props.src, `/images/articles/category-icons/${artwork}-ivory.webp`);
    assert.equal(icon.props.alt, '');
    assert.equal(nodes(render({view, searchQuery: 'test'}), n => n.props.className === 'libraryIcon').length, 0);
    const introduction = nodes(tree, n => n.props['data-library-introduction'])[0];
    assert.ok(text(introduction).length > 60);
    assert.equal(text(introduction).split('。').filter(Boolean).length, 2);
    assert.equal(nodes(render({view, searchQuery: 'test'}), n => n.props['data-library-introduction']).length, 0);
  }
  const sectionIcons = nodes(render({}), n => n.props.className === 'sectionIcon');
  assert.equal(sectionIcons.length, 2);
  assert.ok(sectionIcons.every(n => n.props.alt === ''));
});

test('library heading icons preserve alpha and remain lightweight', async () => {
  for (const id of ['reading', 'series', 'all']) {
    const file = path.join(root, `public/images/articles/category-icons/${id}-ivory.webp`);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, 256);
    assert.equal(metadata.height, 256);
    assert.ok(metadata.hasAlpha);
    const stats = await sharp(file).stats();
    assert.equal(stats.channels[3].min, 0);
    assert.equal(stats.channels[3].max, 255);
    assert.ok(fs.statSync(file).size < 20000);
    assert.ok(fs.existsSync(path.join(root, `assets/source-images/article-category-icons/${id}-ivory.png`)));
  }
});
