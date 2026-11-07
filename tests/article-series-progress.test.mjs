import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} }; modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    if (name.startsWith('@/')) return load(path.relative(root, path.join(root, `${name.slice(2)}.ts`)));
    return load(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)));
  }, module, module.exports);
  return module.exports;
}

const {
  parseSeriesReadIds,
  serializeSeriesReadIds,
  getSeriesProgressSnapshot,
  markSeriesArticleRead,
  isSeriesProgressDisabled,
  setSeriesProgressDisabled,
  clearSeriesProgress,
  SERIES_PROGRESS_STORAGE_KEY,
} = load('lib/article-series-progress.ts');

test('progress snapshot counts read / remaining / current lesson', () => {
  const snap = getSeriesProgressSnapshot(
    ['a', 'b', 'c', 'd'],
    new Set(['a', 'c']),
    'c',
    '课',
  );
  assert.equal(snap.total, 4);
  assert.equal(snap.readCount, 2);
  assert.equal(snap.remaining, 2);
  assert.equal(snap.currentLesson, 3);
  assert.equal(snap.percent, 50);
  assert.match(snap.label, /已读 2\/4/);
  assert.match(snap.label, /当前第 3 课/);
  assert.match(snap.label, /还剩 2 篇/);
});

test('storage helpers round-trip and can be disabled', () => {
  const store = new Map();
  const storage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: key => { store.delete(key); },
  };

  assert.equal(serializeSeriesReadIds(parseSeriesReadIds('["b","a"]')), '["a","b"]');
  let ids = markSeriesArticleRead('crypto-first-steps', storage);
  assert.equal(ids.has('crypto-first-steps'), true);
  assert.ok(store.get(SERIES_PROGRESS_STORAGE_KEY).includes('crypto-first-steps'));

  setSeriesProgressDisabled(true, storage);
  assert.equal(isSeriesProgressDisabled(storage), true);
  ids = markSeriesArticleRead('crypto-buying-platforms', storage);
  assert.equal(ids.has('crypto-buying-platforms'), false);

  setSeriesProgressDisabled(false, storage);
  clearSeriesProgress(storage);
  assert.equal(store.has(SERIES_PROGRESS_STORAGE_KEY), false);
});
