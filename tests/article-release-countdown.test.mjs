import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../components/article-release-countdown.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const endsAt = '2026-09-14T00:00:00+08:00';
const deadline = Date.parse(endsAt);

function createHarness(overrides = {}) {
  let elapsed = 0;
  let wallElapsed = 0;
  let expiredCalls = 0;
  let resumeCalls = 0;
  let effect;
  let state;
  let timerId = 0;
  const timers = new Map();
  const listeners = new Map();
  const events = {
    visibilityState: 'visible',
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  };
  const module = { exports: {} };
  const requireMock = (name) => {
    if (name === 'react') return {
      useState: (initial) => {
        if (state === undefined) state = initial();
        return [state, (value) => { state = value; }];
      },
      useEffect: (callback) => { effect = callback; },
    };
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name === 'next/link') return { default: 'a' };
    if (name === 'lucide-react') return { ArrowRight: 'arrow-icon', Clock: 'clock-icon' };
    throw new Error(`Unexpected module: ${name}`);
  };
  class LocalDate extends Date {
    static now() { return 1900000000000 + wallElapsed; }
  }
  new Function('require', 'module', 'exports', 'performance', 'setTimeout', 'clearTimeout', 'window', 'document', 'Date', compiled)(
    requireMock,
    module,
    module.exports,
    { now: () => elapsed },
    (callback, delay) => { const id = ++timerId; timers.set(id, { callback, at: elapsed + delay }); return id; },
    (id) => timers.delete(id),
    events,
    events,
    LocalDate,
  );
  const props = {
    endsAt,
    serverNow: deadline - 2500,
    expired: false,
    canReadAfterExpiry: false,
    onExpire: () => { expiredCalls++; },
    onResume: () => { resumeCalls++; },
    ...overrides,
  };
  const render = () => module.exports.ArticleReleaseCountdown(props);
  const initial = render();
  const cleanup = effect();
  return {
    initial,
    render,
    cleanup,
    timers,
    listeners,
    expiredCalls: () => expiredCalls,
    resumeCalls: () => resumeCalls,
    advance: (duration, runTimers = true) => {
      const target = elapsed + duration;
      const initialElapsed = elapsed;
      const initialWallElapsed = wallElapsed;
      if (runTimers) {
        let next;
        while ((next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]) && next[1].at <= target) {
          elapsed = next[1].at;
          wallElapsed = initialWallElapsed + elapsed - initialElapsed;
          timers.delete(next[0]);
          next[1].callback();
        }
      }
      elapsed = target;
      wallElapsed = initialWallElapsed + duration;
    },
    advanceWallOnly: (duration) => { wallElapsed += duration; },
    fire: (name) => listeners.get(name)?.(),
  };
}

function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  if (typeof node === 'object') return text(node.props.children);
  return String(node);
}

test('SSR countdown uses the supplied server time and displays the exact Beijing cutoff', () => {
  const view = createHarness();
  assert.match(text(view.initial), /限时公开阅读/);
  assert.match(text(view.initial), /北京时间 2026年9月13日 24:00/);
  assert.match(text(view.initial), /00天00:00:03/);
  assert.match(text(view.initial), /前 30%/);
  view.cleanup();
});

test('countdown expires on the millisecond boundary and notifies the article only once', () => {
  const view = createHarness();
  view.advance(2000);
  assert.match(text(view.render()), /00天00:00:01/);
  assert.equal(view.expiredCalls(), 0);
  view.advance(499);
  assert.equal(view.expiredCalls(), 0);
  view.advance(1);
  assert.equal(view.expiredCalls(), 1);
  assert.match(text(view.render()), /限时公开已结束/);
  assert.match(text(view.render()), /剩余内容仅限 Wise VIP 阅读/);
  view.fire('focus');
  view.fire('pageshow');
  assert.equal(view.expiredCalls(), 1);
  assert.equal(view.timers.size, 0);
  view.cleanup();
});

test('resuming a throttled page immediately catches an elapsed deadline', () => {
  for (const event of ['focus', 'pageshow', 'visibilitychange']) {
    const view = createHarness();
    view.advance(5000, false);
    view.fire(event);
    assert.equal(view.expiredCalls(), 1, event);
    assert.match(text(view.render()), /现可免费阅读本文前 30%/);
    view.cleanup();
    assert.equal(view.listeners.size, 0);
    assert.equal(view.timers.size, 0);
  }
});

test('already-expired SSR stays closed without refreshing in a loop', () => {
  const view = createHarness({ expired: true, serverNow: deadline + 1 });
  assert.match(text(view.initial), /限时公开已结束/);
  assert.equal(view.expiredCalls(), 0);
  assert.equal(view.timers.size, 0);
});

test('device sleep cannot extend the public window when the monotonic clock pauses', () => {
  const view = createHarness();
  view.advanceWallOnly(5000);
  view.fire('visibilitychange');
  assert.equal(view.expiredCalls(), 1);
  assert.match(text(view.render()), /现可免费阅读本文前 30%/);
  assert.equal(view.resumeCalls(), 0, 'expiry already triggers the server resync');
  view.cleanup();
});

test('resuming before the deadline requests a fresh server baseline', () => {
  const view = createHarness();
  view.fire('focus');
  assert.equal(view.resumeCalls(), 1);
  assert.equal(view.expiredCalls(), 0);
  view.cleanup();
});

test('VIP readers retain the full-reading message after expiry', () => {
  const view = createHarness({ expired: true, canReadAfterExpiry: true, serverNow: deadline + 1 });
  assert.match(text(view.initial), /您的 VIP 权限可继续阅读完整文章/);
  assert.doesNotMatch(text(view.initial), /了解如何加入 Wise VIP/);
});
