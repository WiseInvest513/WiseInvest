import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const jsx = (type, props) => ({ type, props });
const compile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const categoryModule = { exports: {} };
new Function('module', 'exports', compile('lib/articles-data.ts'))(categoryModule, categoryModule.exports);
const { categories } = categoryModule.exports;

// Exercise component render output and its own state/callbacks without a browser.
// Focus trapping and Escape dispatch remain owned by the real Radix Dialog.
function createHarness() {
  let state;
  let effects = [];
  let id = 0;
  let refCursor = 0;
  const desktopRef = { current: null };
  const otherRefs = [];
  const module = { exports: {} };
  const requireMock = name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'react') return {
      useState: initial => {
        if (state === undefined) state = typeof initial === 'function' ? initial() : initial;
        return [state, update => { state = typeof update === 'function' ? update(state) : update; }];
      },
      useEffect: callback => effects.push(callback),
      useId: () => `directory-${id++}`,
      useRef: initial => {
        const index = refCursor++;
        if (index === 0) return desktopRef;
        return otherRefs[index] ??= { current: initial };
      },
    };
    if (name === 'next/link') return { __esModule: true, default: 'a' };
    if (name === 'next/image') return { __esModule: true, default: 'img' };
    if (name === '@/components/content-access-gate') return { ProtectedContentLink: 'a' };
    if (name === '@radix-ui/react-dialog') return Object.fromEntries(['Root', 'Portal', 'Overlay', 'Content', 'Title', 'Close'].map(key => [key, `Dialog.${key}`]));
    if (name === '@radix-ui/react-tabs') return Object.fromEntries(['Root', 'List', 'Trigger', 'Content'].map(key => [key, `Tabs.${key}`]));
    if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => `Icon.${String(key)}` });
    if (name === '@/lib/articles-data') return { categories };
    const seriesModules = {
      '@/lib/article-icons': 'lib/article-icons.ts',
      '@/lib/article-series': 'lib/article-series.ts', './article-series': 'lib/article-series.ts',
      './article-library': 'lib/article-library.ts', './article-uid': 'lib/article-uid.ts',
      '@/lib/article-covers': 'lib/article-covers.ts', '@/lib/series-recommendations': 'lib/series-recommendations.ts',
      './series-article-entry': 'app/articles/series-article-entry.tsx', './series-recommendations': 'app/articles/series-recommendations.tsx',
      './series-favorite-button': 'app/articles/series-favorite-button.tsx',
    };
    if (seriesModules[name]) {
      const dependency = { exports: {} };
      new Function('require', 'module', 'exports', compile(seriesModules[name]))(requireMock, dependency, dependency.exports);
      return dependency.exports;
    }
    if (name === './series-reader') {
      const reader = { exports: {} };
      new Function('require', 'module', 'exports', compile('app/articles/series-reader.tsx'))(requireMock, reader, reader.exports);
      return reader.exports;
    }
    if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', compile('app/articles/article-directory.tsx'))(requireMock, module, module.exports);
  return {
    ...module.exports,
    desktopRef,
    render(props = {}) {
      effects = [];
      refCursor = 0;
      return module.exports.ArticleDirectory({ categoryCounts: {}, activeView: 'recommended', mobileOpen: false, onMobileClose() {}, ...props });
    },
    runEffects: () => effects.map(effect => effect()).filter(Boolean),
  };
}

function nodes(tree, predicate) {
  const matches = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (typeof node.type === 'function') return visit(node.type(node.props));
    if (predicate(node)) matches.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  return matches;
}

const first = (tree, type) => nodes(tree, node => node.type === type)[0];
const desktop = tree => first(tree, 'aside');
const groupButtons = tree => nodes(desktop(tree), node => node.type === 'button');
const buttonText = button => button.props.children[1].props.children;

function mockGlobal(context, name, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  context.after(() => {
    if (original) Object.defineProperty(globalThis, name, original);
    else delete globalThis[name];
  });
}

test('five topic groups include every category exactly once, with transfers under accounts', () => {
  const { articleTopicGroups } = createHarness();
  assert.deepEqual(articleTopicGroups.map(group => group.name), ['投资与市场', '加密与 Web3', '开户与资金', '工具与出海', 'Wise 指南']);
  const mapped = articleTopicGroups.flatMap(group => group.categoryIds);
  assert.equal(mapped.length, categories.length);
  assert.equal(new Set(mapped).size, categories.length);
  assert.ok(articleTopicGroups.find(group => group.id === 'accounts').categoryIds.includes('transfers'));
  assert.deepEqual([...mapped].sort(), categories.map(category => category.id).sort());
});

test('desktop and mobile directories use the existing custom artwork for every category and entry', () => {
  const tree = createHarness().render({ activeCategoryId: 'domestic', mobileOpen: true });
  for (const category of categories) {
    const links = nodes(tree, node => node.type === 'a' && node.props.href === `/articles/${category.id}`);
    assert.equal(links.length, 2, `${category.id}: desktop and mobile`);
    for (const link of links) {
      const icons = nodes(link, node => node.type === 'img');
      assert.equal(icons.length, 1);
      assert.equal(icons[0].props.src, `/images/articles/category-icons/${category.id}-ivory.webp`);
      assert.equal(icons[0].props.alt, '');
      assert.equal(icons[0].props.width, icons[0].props.height);
      assert.ok(fs.existsSync(path.join(root, 'public', icons[0].props.src)));
    }
  }
  for (const [href, icon] of [['/articles', 'reading'], ['/articles?view=series', 'series'], ['/articles?view=all', 'all']]) {
    const link = nodes(desktop(tree), node => node.type === 'a' && node.props.href === href)[0];
    assert.equal(nodes(link, node => node.type === 'img')[0].props.src, `/images/articles/category-icons/${icon}-ivory.webp`);
  }
  for (const button of groupButtons(tree)) {
    assert.equal(nodes(button, node => node.type === 'img').length, 1);
    assert.equal(nodes(button, node => node.type === 'Icon.ChevronRight').length, 1);
  }
});

test('series context replaces category navigation with persistent chapters on desktop and mobile', () => {
  const harness = createHarness();
  let closes = 0;
  const seriesContext = {
    series: { id: 'sample', title: 'Sample series', chapters: [{ title: 'One' }, { title: 'Two' }] },
    articleId: 'one',
    reading: { publishedCount: 1, chapters: [
      { title: 'One', articleId: 'one', index: 0, href: '/articles/outside/12345678?series=sample' },
      { title: 'Two', index: 1 },
    ] },
  };
  const tree = harness.render({ seriesContext, mobileOpen: true, onMobileClose: () => closes++ });
  const desktopNav = desktop(tree);
  assert.equal(nodes(desktopNav, node => node.props?.['aria-label'] === '系列章节').length, 1);
  assert.equal(nodes(desktopNav, node => node.props?.['aria-label'] === '文章目录').length, 0);
  const current = nodes(desktopNav, node => node.props?.['aria-current'] === 'page');
  assert.equal(current.length, 1);
  assert.equal(current[0].props.href, '/articles/outside/12345678?series=sample');
  const planning = nodes(desktopNav, node => node.type === 'details');
  assert.equal(planning.length, 1);
  assert.ok(!planning[0].props.open, 'unpublished chapters are collapsed initially');
  assert.equal(nodes(planning[0], node => node.type === 'a').length, 0, 'unpublished chapters cannot be opened as articles');
  const mobileLink = nodes(first(tree, 'Dialog.Content'), node => node.type === 'a' && node.props.href.includes('?series='))[0];
  mobileLink.props.onClick();
  assert.equal(closes, 1);
});

test('navigation preserves the three entry routes and every category URL without nesting articles', () => {
  const harness = createHarness();
  const links = nodes(desktop(harness.render()), node => node.type === 'a');
  assert.deepEqual(links.slice(0, 3).map(link => link.props.href), ['/articles', '/articles?view=series', '/articles?view=all']);
  assert.deepEqual(links.filter(link => link.props.className === 'categoryLink').map(link => link.props.href).sort(), categories.map(category => `/articles/${category.id}`).sort());
  assert.equal(links.length, 3 + categories.length + 1);
  assert.equal(links.at(-1).props.href, 'https://www.wise-hold.com/');
  assert.equal(links.at(-1).props.rel, 'noopener noreferrer');
});

test('crypto is initially expanded and an active category opens its containing group', () => {
  const harness = createHarness();
  const buttons = groupButtons(harness.render({ activeView: null, activeCategoryId: 'bank' }));
  assert.deepEqual(buttons.filter(button => button.props['aria-expanded']).map(buttonText), ['加密与 Web3', '开户与资金']);
  assert.deepEqual(buttons.filter(button => button.props['data-active']).map(buttonText), ['开户与资金']);
  const activeLinks = nodes(desktop(harness.render({ activeCategoryId: 'bank' })), node => node.props['aria-current'] === 'page');
  assert.deepEqual(activeLinks.map(link => link.props.href), ['/articles/bank']);
});

test('group controls toggle and reopen the newly active category group after navigation', () => {
  const harness = createHarness();
  groupButtons(harness.render()).find(button => buttonText(button) === '加密与 Web3').props.onClick();
  assert.equal(groupButtons(harness.render()).find(button => buttonText(button) === '加密与 Web3').props['aria-expanded'], false);
  harness.render({ activeCategoryId: 'VIP' });
  harness.runEffects();
  assert.equal(groupButtons(harness.render({ activeCategoryId: 'VIP' })).find(button => buttonText(button) === 'Wise 指南').props['aria-expanded'], true);
});

test('each accordion controls its own panel and desktop/mobile IDs stay unique', () => {
  const harness = createHarness();
  const tree = harness.render({ mobileOpen: true });
  const buttons = nodes(tree, node => node.type === 'button');
  const panels = nodes(tree, node => node.type === 'ul');
  assert.equal(new Set(buttons.map(button => button.props['aria-controls'])).size, 10);
  // Capture each navigation render together because useId is scoped per instance.
  const nav = tree.props.children[0].props.children[1];
  const rendered = nav.type(nav.props);
  for (const button of nodes(rendered, node => node.type === 'button')) {
    const panel = nodes(rendered, node => node.type === 'ul').find(panel => panel.props.id === button.props['aria-controls']);
    assert.ok(panel);
    assert.equal(panel.props.hidden, !button.props['aria-expanded']);
  }
  assert.equal(panels.length, 10);
});

test('mobile navigation and Radix close callbacks all close the controlled drawer', () => {
  const harness = createHarness();
  let closed = 0;
  const tree = harness.render({ mobileOpen: true, onMobileClose: () => closed++ });
  const dialog = first(tree, 'Dialog.Root');
  assert.equal(dialog.props.open, true);
  dialog.props.onOpenChange(true);
  assert.equal(closed, 0);
  dialog.props.onOpenChange(false); // Radix sends false for Escape, outside click and Close.
  assert.equal(closed, 1);
  const content = first(tree, 'Dialog.Content');
  assert.equal(content.props.id, 'article-directory-drawer');
  assert.equal(first(content, 'Dialog.Close').props['aria-label'], '关闭文章目录');
  nodes(content, node => node.type === 'a')[0].props.onClick();
  assert.equal(closed, 2);
});

test('resize listener exists only for an open drawer and unregisters cleanly', t => {
  const harness = createHarness();
  let closed = 0;
  let handler;
  let removed;
  const query = { matches: false, addEventListener(event, callback) { assert.equal(event, 'change'); handler = callback; }, removeEventListener(event, callback) { assert.equal(event, 'change'); removed = callback; } };
  mockGlobal(t, 'window', { matchMedia: expression => { assert.equal(expression, '(min-width: 768px)'); return query; } });
  harness.render({ onMobileClose: () => closed++ });
  assert.deepEqual(harness.runEffects(), []);
  assert.equal(handler, undefined);
  harness.render({ mobileOpen: true, onMobileClose: () => closed++ });
  const cleanups = harness.runEffects();
  assert.equal(closed, 0);
  query.matches = true;
  handler();
  assert.equal(closed, 1);
  cleanups.forEach(cleanup => cleanup());
  assert.equal(removed, handler);
  harness.render({ mobileOpen: true, onMobileClose: () => closed++ });
  harness.runEffects().forEach(cleanup => cleanup());
  assert.equal(closed, 2, 'opening at a desktop width closes immediately');
});

test('closing restores focus to a visible trigger or the desktop current entry after resize', t => {
  const harness = createHarness();
  const focused = [];
  let triggerVisible = true;
  const trigger = { getClientRects: () => triggerVisible ? [{}] : [], focus: options => focused.push(['trigger', options]) };
  const active = { getClientRects: () => [{}], focus: options => focused.push(['active', options]) };
  harness.desktopRef.current = { querySelector: () => active };
  mockGlobal(t, 'document', { getElementById: id => { assert.equal(id, 'article-directory-trigger'); return trigger; } });
  const content = first(harness.render({ mobileOpen: true }), 'Dialog.Content');
  let prevented = 0;
  const event = { preventDefault: () => prevented++ };
  content.props.onCloseAutoFocus(event);
  triggerVisible = false;
  content.props.onCloseAutoFocus(event);
  assert.deepEqual(focused, [['trigger', { preventScroll: true }], ['active', { preventScroll: true }]]);
  assert.equal(prevented, 2);
});

test('styles retain small icons, keyboard focus, dark mode and reduced motion', () => {
  const css = fs.readFileSync(path.join(root, 'app/articles/article-directory.module.css'), 'utf8');
  assert.match(css, /\.icon\s*\{[^}]*width: 16px;[^}]*height: 16px;/s);
  assert.match(css, /\.categoryList\[hidden\]\s*\{\s*display: none;/);
  assert.match(css, /\.navigationLink:focus-visible/);
  assert.match(css, /:global\(\.dark\) \.drawer/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation: none !important/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*min-height: 44px;/);
});

test('article drawer reuses supplied accessible anchors and keeps category navigation in a separate tab', () => {
  const tree = createHarness().render({ mobileOpen: true, articleToc: {
    title: '预览文章', activeId: 'h-3', activeChapterId: 'h-3', isPreview: true,
    items: [{ id: 'h-0', text: '第一章', level: 2 }, { id: 'h-3', text: '第二章', level: 2 }],
  } });
  const content = first(tree, 'Dialog.Content');
  assert.deepEqual(nodes(content, node => node.type === 'Tabs.Trigger').map(node => node.props.children), ['本篇目录', '文章分类']);
  const toc = nodes(content, node => node.type === 'nav' && node.props['aria-label'] === '本篇目录')[0];
  assert.deepEqual(nodes(toc, node => node.type === 'a').map(node => [node.props.href, node.props['aria-current']]), [['#h-0', undefined], ['#h-3', 'location']]);
  assert.ok(nodes(content, node => node.type === 'p').some(node => node.props.children === '仅显示当前可阅读的章节'));
});

test('mobile chapter navigation waits for drawer close then focuses the heading without resetting scroll', t => {
  const calls = [];
  const heading = {
    setAttribute: (...args) => calls.push(['attribute', ...args]),
    focus: options => calls.push(['focus', options]),
    getBoundingClientRect: () => ({ top: 980 }),
  };
  const trigger = { closest: () => ({ getBoundingClientRect: () => ({ bottom: 120 }) }) };
  mockGlobal(t, 'document', { getElementById: id => id === 'h-3' ? heading : trigger });
  mockGlobal(t, 'window', { scrollBy: options => calls.push(['scroll', options]), history: { state: {}, replaceState: (_state, _unused, hash) => calls.push(['hash', hash]) } });
  let frame;
  mockGlobal(t, 'requestAnimationFrame', callback => { frame = callback; });
  let closed = 0;
  const tree = createHarness().render({ mobileOpen: true, onMobileClose: () => closed++, articleToc: { title: '测试', activeId: 'h-0', items: [{ id: 'h-3', text: '第二章', level: 2 }] } });
  const content = first(tree, 'Dialog.Content');
  nodes(content, node => node.type === 'a' && node.props.href === '#h-3')[0].props.onClick({ preventDefault() {} });
  assert.equal(closed, 1);
  assert.deepEqual(calls, []);
  let prevented = false;
  content.props.onCloseAutoFocus({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(calls, []);
  frame();
  assert.deepEqual(calls, [['attribute', 'tabindex', '-1'], ['focus', { preventScroll: true }], ['scroll', { top: 844, behavior: 'instant' }], ['hash', '#h-3']]);
});
