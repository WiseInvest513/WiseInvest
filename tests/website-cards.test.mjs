import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../app/website/page.tsx', import.meta.url), 'utf8');
const jsx = (type, props) => ({ type, props });
const Image = () => null;
const icon = () => null;
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)((name) => {
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
  if (name === 'next/image') return { __esModule: true, default: Image };
  if (name === 'lucide-react') return { ArrowUpRight: icon, Globe2: icon };
  throw new Error(`Unexpected dependency: ${name}`);
}, module, module.exports);

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

const page = module.exports.default();
const cards = nodes(page)
  .filter(node => typeof node.type === 'function' && node.props.site)
  .map(node => node.type(node.props));

test('all eight website cards are direct links with VIP first', () => {
  assert.equal(cards.length, 8);
  const destinations = [
    'https://vip.wise-invest.org/join', 'https://www.wise-etf.com/',
    'https://www.wise-ipo.com/', 'https://chain.wise-invest.org/',
    'https://crypto.wise-invest.org/', 'https://www.wise-sim.org/',
    'https://www.wise-witness.com/', 'https://www.wise-hold.com/',
  ];
  cards.forEach((card, index) => {
    assert.equal(card.type, 'a');
    assert.equal(card.props.href, destinations[index]);
    assert.equal(card.props.target, '_blank');
    assert.equal(card.props.rel, 'noopener noreferrer');
    assert.match(card.props['aria-label'], /^访问 Wise /);
  });
});

test('each card shows one visible product cover and title immediately', () => {
  cards.forEach((card, index) => {
    const content = nodes(card);
    const images = content.filter(node => node.type === Image);
    assert.equal(images.length, 1);
    assert.match(images[0].props.src, /-silver\.webp$/);
    assert.equal(images[0].props.priority, index === 0);
    assert.ok(images[0].props.sizes);
    assert.equal(content.filter(node => node.type === 'h2').length, 1);
    assert.equal(content.filter(node => node.type === 'p').length, 1);
    assert.equal(content.some(node => node.props?.['aria-hidden'] === 'true' && node.props?.children?.type === Image), false);
  });
});

test('website cards have no flip, float, hover rotation or timer', () => {
  assert.doesNotMatch(source, /@keyframes|rotate[XYZ]?\(|rotate-|animate-|animation|perspective|preserve-3d|setInterval|setTimeout|RotateCcw/);
  assert.equal(nodes(page).some(node => node.type === 'style'), false);
  for (const card of cards) {
    assert.equal(nodes(card).some(node => node.props?.style?.transform), false);
    assert.equal(nodes(card).some(node => node.props?.style?.backfaceVisibility), false);
  }
});
