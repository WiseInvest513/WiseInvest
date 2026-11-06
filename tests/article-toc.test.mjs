import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const compiled = new Map();
function load(file, requireMock) {
  if (!compiled.has(file)) compiled.set(file, ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText);
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.get(file))(requireMock, module, module.exports);
  return module.exports;
}

function mockGlobal(context, name, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  context.after(() => {
    if (original) Object.defineProperty(globalThis, name, original);
    else delete globalThis[name];
  });
}

const content = '## 第一章\n\n### 注册准备\n\n#### 材料细节\n\n## 第二章\n\n### 开户步骤\n\n## 第三章';
const article = { id: 'toc-fixture', title: '目录测试', categoryId: 'broker', date: '2026-11-05', readTime: 5, summary: '目录摘要', content };

function nodes(tree, predicate) {
  const matches = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (predicate(node)) matches.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  return matches;
}

// Execute the article page and real Markdown renderer together. Unrelated UI
// children stay opaque; hooks retain state so scrollspy updates can be rendered.
function createHarness(context, tocDepth, articleId = article.id, articleContent = content) {
  const state = [];
  let cursor = 0;
  let effects = [];
  const measured = [];
  const scrolled = [];
  const headings = new Map();
  const positions = new Map();
  const frames = new Map();
  let frameId = 0;
  const listeners = new Map();
  const windowListeners = new Map();
  const readingContainer = {
    getBoundingClientRect: () => ({ top: 64 }),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
    querySelector: () => null,
    contains: () => false,
    scrollTo() {},
  };
  const jsx = (type, props) => ({ type, props });
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], update => { state[index] = typeof update === 'function' ? update(state[index]) : update; }];
    },
    useMemo: callback => callback(),
    useCallback: callback => callback,
    useEffect: callback => effects.push(callback),
    useRef: () => ({ current: null }),
  };
  const requireMock = name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'next/link') return { __esModule: true, default: 'a' };
    if (name === 'next/navigation') return { usePathname: () => '/articles/broker/fixture', useRouter: () => ({ refresh() {} }) };
    if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => `Icon.${String(key)}` });
    if (name === '@/lib/articles-data') return { articles: [], categories: [], subcategories: [] };
    if (name === '@/lib/utils') return { cn: (...values) => values.filter(Boolean).join(' ') };
    if (name === '@/lib/article-uid') return { genUid: id => id };
    if (name === '@/lib/article-registration') return load('lib/article-registration.ts', requireMock);
    if (name === '@/lib/article-renderer') return load('lib/article-renderer.tsx', requireMock);
    if (name === '@/lib/article-series') return { getArticleSeries: () => undefined, isTopicSeriesArticle: () => false };
    if (name === '@/lib/article-library') return { articleSeries: [] };
    if (name === '@/lib/article-vip-invitation') return { getArticleVipInvitation: () => null };
    if (name === '@/lib/article-reading-recommendations') return { getArticleReadingRecommendations: () => ({ introduction: '', articles: [] }) };
    if (name === '@/components/use-article-library-navigation') return { useArticleLibraryNavigation: () => ({ searchQuery: '', setSearchQuery() {}, filterTopic: '', sortOrder: '', onFiltersChange() {} }) };
    if (name === '@/components/content-access-gate') return { ProtectedContentLink: 'a', useContentAccessGate: () => ({ guardHref() {}, dialog: null }) };
    if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (name.startsWith('@/components/') || ['./article-directory', './article-library', './series-reader'].includes(name)) {
      return new Proxy({}, { get: (_, key) => `Component.${String(key)}` });
    }
    throw new Error(`Unexpected dependency: ${name}`);
  };
  const { ArticlesContent } = load('app/articles/articles-content.tsx', requireMock);
  mockGlobal(context, 'window', {
    location: { pathname: '/articles/broker/fixture', hash: '' },
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    removeEventListener: name => windowListeners.delete(name),
  });
  mockGlobal(context, 'document', { getElementById: id => headings.get(id) });
  mockGlobal(context, 'fetch', async () => ({ ok: true, json: async () => [] }));
  mockGlobal(context, 'requestAnimationFrame', callback => { frames.set(++frameId, callback); return frameId; });
  mockGlobal(context, 'cancelAnimationFrame', id => frames.delete(id));
  return {
    measured,
    scrolled,
    positions,
    render() {
      cursor = 0;
      effects = [];
      const selected = { ...article, id: articleId, content: articleContent, tocDepth };
      const tree = ArticlesContent({ initialArticle: selected, initialArticles: [selected], initialArticleId: selected.id });
      nodes(tree, node => node.type === 'section' && node.props['aria-label'] === '文章内容')[0].props.ref.current = readingContainer;
      for (const heading of nodes(tree, node => /^h[1-4]$/.test(node.type) && node.props.id)) {
        headings.set(heading.props.id, {
          id: heading.props.id, type: heading.type, text: heading.props.children,
          scrollIntoView: () => scrolled.push(heading.props.id),
          getBoundingClientRect: () => { measured.push(heading.props.id); return { top: positions.get(heading.props.id) ?? 500 }; },
        });
      }
      return tree;
    },
    runEffects: () => effects.map(callback => callback()).filter(Boolean),
    scroll: () => listeners.get('scroll')?.(),
    windowScroll: () => windowListeners.get('scroll')?.(),
    resize: () => windowListeners.get('resize')?.(),
    flushFrames() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); },
    get pendingFrames() { return frames.size; },
    get listenerCount() { return listeners.size + windowListeners.size; },
  };
}

const tocLinks = tree => nodes(nodes(tree, node => node.type === 'nav' && node.props['aria-label'] === '本页目录')[0], node => node.type === 'a');

test('frontmatter accepts only explicit depths 2, 3, 4 and preserves the default otherwise', () => {
  const values = [undefined, '2', '3', '4', '1', '5', '2x', '2.5', ''];
  const files = new Map(values.map((value, index) => [`fixture-${index}.md`, `---\nid: fixture-${index}\ntitle: Test\n${value === undefined ? '' : `tocDepth: ${value}\n`}---\n${content}`]));
  const virtualFs = {
    existsSync: () => true,
    readdirSync: () => [...files.keys()].map(name => ({ name, isDirectory: () => false, isFile: () => true })),
    readFileSync: file => files.get(path.basename(file)),
  };
  const { loadFsArticles } = load('lib/articles-fs.ts', name => {
    if (name === 'fs') return virtualFs;
    if (name === 'path') return path;
    throw new Error(`Unexpected dependency: ${name}`);
  });
  const loaded = new Map(loadFsArticles().map(item => [item.id, item]));
  assert.deepEqual(values.map((_, index) => loaded.get(`fixture-${index}`).tocDepth), [undefined, 2, 3, 4, undefined, undefined, undefined, undefined, undefined]);
});

test('condensed navigation keeps second and third chapter anchors aligned with rendered H2s', t => {
  const harness = createHarness(t, 2);
  const tree = harness.render();
  const links = tocLinks(tree);
  assert.deepEqual(links.map(link => [link.props.children[1], link.props.href]), [['第一章', '#h-0'], ['第二章', '#h-3'], ['第三章', '#h-5']]);
  assert.deepEqual(nodes(tree, node => /^h[1-4]$/.test(node.type) && node.props.id).map(node => [node.type, node.props.id]), [['h2', 'h-0'], ['h3', 'h-1'], ['h4', 'h-2'], ['h2', 'h-3'], ['h3', 'h-4'], ['h2', 'h-5']]);
  for (const link of links.slice(1)) link.props.onClick({ preventDefault() {} });
  assert.deepEqual(harness.scrolled, ['h-3', 'h-5']);
});

test('scrollspy follows fast jumps and backward scrolling using only visible navigation chapters', t => {
  const harness = createHarness(t, 2);
  harness.render();
  const cleanups = harness.runEffects();
  const active = () => tocLinks(harness.render()).filter(link => nodes(link, node => node.type === 'span').length > 0).map(link => link.props.href);
  assert.deepEqual(active(), ['#h-0'], 'the first chapter is active before reaching any heading');
  for (const [id, top] of [['h-0', -2000], ['h-3', -1000], ['h-5', 96]]) harness.positions.set(id, top);
  harness.scroll();
  harness.scroll();
  assert.equal(harness.pendingFrames, 1, 'scroll events share one animation frame');
  harness.flushFrames();
  assert.deepEqual(active(), ['#h-5'], 'jumping over intermediate headings activates the current chapter');
  harness.positions.set('h-3', 110);
  harness.positions.set('h-5', 1000);
  harness.scroll();
  harness.flushFrames();
  assert.deepEqual(active(), ['#h-3'], 'scrolling backward does not retain the later chapter');
  assert.deepEqual([...new Set(harness.measured)].sort(), ['h-0', 'h-3', 'h-5']);
  harness.positions.set('h-3', 500);
  harness.windowScroll();
  harness.flushFrames();
  assert.deepEqual(active(), ['#h-0'], 'window scrolling is handled alongside the desktop reading pane');
  harness.positions.set('h-3', 100);
  harness.resize();
  harness.flushFrames();
  assert.deepEqual(active(), ['#h-3']);
  cleanups.forEach(cleanup => cleanup());
  assert.equal(harness.listenerCount, 0);
  assert.equal(harness.pendingFrames, 0);
});

for (const [depth, expected] of [[undefined, [0, 1, 2, 3, 5]], [3, [0, 1, 3, 5]], [4, [0, 1, 2, 3, 5]]]) {
  test(`tocDepth ${depth ?? 'default'} retains allowed subheadings within the active chapter`, t => {
    const harness = createHarness(t, depth);
    assert.deepEqual(tocLinks(harness.render()).map(link => link.props.href), expected.map(index => `#h-${index}`));
  });
}

test('all articles expand only the active chapter while tracking collapsed subheadings in both directions', t => {
  const harness = createHarness(t, undefined);
  const links = () => tocLinks(harness.render());
  const hrefs = () => links().map(link => link.props.href);
  assert.deepEqual(hrefs(), ['#h-0', '#h-1', '#h-2', '#h-3', '#h-5']);
  const cleanups = harness.runEffects();

  // Scroll directly into a subsection that was initially absent from navigation.
  for (const [id, top] of [['h-0', -1000], ['h-1', -800], ['h-2', -600], ['h-3', -200], ['h-4', 100], ['h-5', 900]]) harness.positions.set(id, top);
  harness.scroll();
  harness.flushFrames();
  assert.deepEqual(hrefs(), ['#h-0', '#h-3', '#h-4', '#h-5']);
  assert.equal(links().find(link => link.props['aria-current'] === 'location').props.href, '#h-4');
  links().find(link => link.props.href === '#h-4').props.onClick({ preventDefault() {} });
  assert.deepEqual(harness.scrolled, ['h-4']);
  assert.ok(harness.measured.includes('h-4'), 'scrollspy still measures collapsed subheadings');

  harness.positions.set('h-5', 100);
  harness.scroll();
  harness.flushFrames();
  assert.deepEqual(hrefs(), ['#h-0', '#h-3', '#h-5']);

  for (const [id, top] of [['h-0', -200], ['h-1', 100], ['h-2', 300], ['h-3', 500], ['h-4', 700], ['h-5', 900]]) harness.positions.set(id, top);
  harness.scroll();
  harness.flushFrames();
  assert.deepEqual(hrefs(), ['#h-0', '#h-1', '#h-2', '#h-3', '#h-5']);
  assert.equal(links().find(link => link.props['aria-current'] === 'location').props.href, '#h-1');
  cleanups.forEach(cleanup => cleanup());
});

test('legacy articles with only smaller headings retain navigation and stable anchors', t => {
  const harness = createHarness(t, undefined, 'legacy', '### 准备\n\n#### 材料\n\n### 操作');
  assert.deepEqual(tocLinks(harness.render()).map(link => link.props.href), ['#h-0', '#h-1', '#h-2']);
});

test('chapter rules are deduplicated while in-section rules and mobile table regions remain', t => {
  const markdown = '## 第一章\n\n---\n\n## 第二章\n\n正文\n\n---\n\n补充\n\n| A | B | C |\n| --- | --- | --- |\n| 一 | 二 | 三 |';
  const tree = createHarness(t, undefined, 'formatting', markdown).render();
  assert.equal(nodes(tree, node => node.type === 'hr').length, 1);
  assert.deepEqual(nodes(tree, node => node.type === 'h2' && node.props.id).map(node => node.props.id), ['h-0', 'h-1']);
  const tableRegion = nodes(tree, node => node.props?.role === 'region' && node.props['aria-label'] === '可横向滑动的对比表');
  assert.equal(tableRegion.length, 1);
  assert.equal(tableRegion[0].props.tabIndex, 0);
});
