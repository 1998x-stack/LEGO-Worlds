import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COMPONENTS } from '../src/catalog.js';

const root = new URL('../', import.meta.url);
const read = relative => readFileSync(fileURLToPath(new URL(relative, root)), 'utf8');

// These tests guard public documentation against silently drifting away from the
// catalog truth. They intentionally assert the *current* count so that any future
// catalog change forces an explicit, reviewed documentation update.
test('public documentation component counts match the catalog', () => {
  const n = COMPONENTS.length;
  assert.match(read('README.md'), new RegExp(`\\b${n}-piece Component Library\\b`));
  assert.match(read('README.md'), new RegExp(`\\b${n} coded, parameterized component definitions\\b`));
  assert.match(read('README.zh-CN.md'), new RegExp(`\\b${n} 种组件完整目录`));
  assert.match(read('AGENTS.md'), new RegExp(`\\b${n} procedural component definitions\\b`));
  assert.match(read('docs/component-system.md'), new RegExp(`\\*\\*${n} distinct component definitions\\*\\*`));
  assert.match(read('docs/parts-index.md'), new RegExp(`— ${n} reusable parts\\b`));
});

test('public documentation contains no stale 100-component or 46-factory claims', () => {
  const files = ['README.md', 'README.zh-CN.md', 'AGENTS.md',
    'docs/roadmap.md', 'docs/component-system.md', 'docs/parts-index.md'];
  const staleCount = /(^|[^0-9])100\s+(coded|procedural|distinct|catalogue|component|reusable)/i;
  const staleFactory = /(^|[^0-9])46\s+(procedural\s+)?geometry/i;
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, staleCount, file + ' contains a stale 100-component claim');
    assert.doesNotMatch(text, staleFactory, file + ' contains a stale 46-factory claim');
  }
});

test('documented family taxonomy matches the catalog', () => {
  const families = new Set(COMPONENTS.map(component => component.family));
  assert.equal(families.size, 10, 'catalog must expose exactly ten families');
  const docs = read('docs/component-system.md');
  assert.match(docs, /Ten reusable families/);
  assert.match(docs, /\*\*Total\*\* \| \*\*101\*\*/);
});

test('index.html ships a favicon so the page issues no empty icon request', () => {
  const html = read('index.html');
  assert.match(html, /rel="icon"/, 'index.html must declare a favicon');
});

test('installation is reproducible: a lockfile exists and CI uses npm ci', () => {
  const lock = JSON.parse(read('package-lock.json'));
  assert.ok(lock.lockfileVersion >= 3, 'expected npm lockfileVersion >= 3');
  assert.equal(lock.name, 'lego-worlds');
  assert.ok(Object.keys(lock.packages).length > 1, 'lockfile must pin the dependency tree');
  const workflow = read('.github/workflows/pages.yml');
  assert.match(workflow, /run: npm ci\b/, 'CI must install with npm ci');
  assert.doesNotMatch(workflow, /run: npm install\b/, 'CI must not use npm install');
});
