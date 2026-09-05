import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { nodeFileTrace } = require('next/dist/compiled/@vercel/nft');
const root = fileURLToPath(new URL('../', import.meta.url));
const entry = path.join(root, 'lib/articles-fs.ts');
const source = await readFile(entry, 'utf8');

test('article loader traces Markdown, not the static image library', async () => {
  // Trace the real loader with the same tracer used by this Next.js version.
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  }).outputText;
  const { fileList } = await nodeFileTrace([entry], {
    base: root,
    processCwd: root,
    mixedModules: true,
    readFile: file => path.resolve(file) === entry ? compiled : readFile(file, 'utf8'),
  });
  const files = [...fileList].map(file => file.split(path.sep).join('/'));
  assert.deepEqual(files.filter(file => file.startsWith('public/')), [],
    'Static assets must not be bundled into article/admin server functions');
  assert.ok(files.includes('content/articles/VIP/001.md'),
    'VIP Markdown must remain available to the server at runtime');
});

test('VIP article images use static URLs without changing article metadata', () => {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
  const articles = module.exports.loadFsArticles();
  const intro = articles.find(article => article.id === 'VIP');
  const journal = articles.find(article => article.id === 'VIP001');
  assert.ok(intro?.content.includes('/content/articles/VIP/0.png'));
  assert.ok(articles.every(article => !article.content.includes('/api/content/articles/')));
  assert.equal(journal?.categoryId, 'VIP');
  assert.ok(journal.content.includes('真正做成一个属于自己的丰收之年'));
});
