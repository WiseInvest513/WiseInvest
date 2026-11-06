import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const scripts = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')).scripts;

test('normal npm build stops before image indexing/build when article prerequisites fail', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wise-build-gate-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const directory of ['scripts/lib', 'lib', 'content/articles/index/example', 'public/images/articles/covers']) fs.mkdirSync(path.join(root, directory), { recursive: true });
  for (const file of ['scripts/validate-articles.mjs', 'scripts/lib/article-validation.mjs']) fs.copyFileSync(path.join(projectRoot, file), path.join(root, file));
  fs.symlinkSync(path.join(projectRoot, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ private: true, scripts: {
    prebuild: scripts.prebuild,
    'article:validate': scripts['article:validate'],
    'article:images': 'node probe.mjs images',
    'calendar:validate': 'node probe.mjs calendar',
    build: 'node probe.mjs build',
  } }));
  fs.writeFileSync(path.join(root, 'probe.mjs'), "import fs from 'node:fs'; fs.appendFileSync('stages.txt', process.argv[2] + '\\n');");
  fs.writeFileSync(path.join(root, 'lib/articles-data.ts'), 'export const categories = [{id:"index"}]; export const subcategories = [];');
  fs.writeFileSync(path.join(root, 'lib/article-covers.ts'), 'export const articleCovers = {example: {src:"/images/articles/covers/example.webp",alt:"费用原理示意"}};');
  fs.writeFileSync(path.join(root, 'lib/article-registration.ts'), 'export function parseRegistrationCallout(){ return undefined; }');
  fs.writeFileSync(path.join(root, 'lib/registration-brands.ts'), 'export function getRegistrationBrand(){ return undefined; }');
  fs.copyFileSync(path.join(projectRoot, 'public/images/articles/covers/galaxy-etf-guide.webp'), path.join(root, 'public/images/articles/covers/example.webp'));
  const fields = {
    id: 'example', title: '怎样核对费用记录', categoryId: 'index', date: '2026-11-06', readTime: '5', authoringVersion: '1',
    summary: '从自己的费用记录出发，分清计算项目与实际扣费。',
    guideAudience: '需要读懂自己的费用记录而不是比较开户奖励的读者',
    guideOutcomes: '了解每项记录的含义，并把计算过程与实际记录逐项对照',
    guidePrepare: '准备一份脱敏的费用记录，阅读本文不需要提前开户或投入资金。',
    guideStatus: '这里只解释记录与计算方法，示例不代表某个平台当前的实际报价。',
  };
  const file = path.join(root, 'content/articles/index/example/article.md');
  const write = (meta, heading = '## 一、先看记录') => fs.writeFileSync(file, `---\n${Object.entries(meta).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n\n${heading}\n\n先核对订单日期、成交金额与收费项目，再把实际记录与自己的计算过程逐项比较。\n`);
  const build = () => spawnSync('npm', ['run', 'build'], {
    cwd: root, encoding: 'utf8', timeout: 30000,
    env: { ...process.env, npm_config_update_notifier: 'false', npm_config_audit: 'false' },
  });
  const incomplete = { ...fields };
  delete incomplete.guidePrepare;
  write(incomplete);
  const blocked = build();
  assert.equal(blocked.status, 1, blocked.stderr);
  assert.match(blocked.stdout, /guide\.required/);
  assert(!fs.existsSync(path.join(root, 'stages.txt')), 'incomplete articles must stop before all later stages');

  write(fields, '## 一个未编号的新稿章节');
  const malformed = build();
  assert.equal(malformed.status, 1, malformed.stderr);
  assert.match(malformed.stdout, /body\.headingSequence/);
  assert(!fs.existsSync(path.join(root, 'stages.txt')), 'new authored articles stay strict after entering the formal tree');

  write(fields);
  const complete = build();
  assert.equal(complete.status, 0, complete.stdout + complete.stderr);
  assert.deepEqual(fs.readFileSync(path.join(root, 'stages.txt'), 'utf8').trim().split('\n'), ['images', 'calendar', 'build']);
});
