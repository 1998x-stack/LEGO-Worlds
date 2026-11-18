import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { COMPONENTS } from '../src/catalog.js';
import {
  LDRAW_MM_PER_LDU, LDRAW_PART_MAP, LDRAW_COLORS,
  mapLdrawPart, mapLdrawColor, parseLdrawLines, importLdraw
} from '../packages/ldraw-interop/index.mjs';

const fixture = name => readFileSync(
  fileURLToPath(new URL(`./fixtures/ldraw/${name}`, import.meta.url)), 'utf8');
const catalog = COMPONENTS;

test('LDU constants match the 8 mm stud pitch, 9.6 mm brick and 3.2 mm plate', () => {
  assert.equal(LDRAW_MM_PER_LDU, 0.4);
  assert.equal(20 * LDRAW_MM_PER_LDU, 8);
  assert.ok(Math.abs(24 * LDRAW_MM_PER_LDU - 9.6) < 1e-9);
  assert.ok(Math.abs(8 * LDRAW_MM_PER_LDU - 3.2) < 1e-9);
  assert.ok(Object.isFrozen(LDRAW_PART_MAP) && Object.isFrozen(LDRAW_COLORS));
});

test('part and colour mapping is explicit and never invents a catalog id', () => {
  assert.equal(mapLdrawPart('3005.dat'), 'brick-1x1');
  assert.equal(mapLdrawPart('3001.DAT'), 'brick-2x4');
  assert.equal(mapLdrawPart('99999.dat'), null);
  assert.equal(mapLdrawPart('../../etc/passwd'), null);
  assert.equal(mapLdrawColor(4), LDRAW_COLORS[4]);
  assert.equal(mapLdrawColor(9999), '#B4B4B4'); // documented default, not silent drop
});

test('imports a hand-authored .ldr into catalog-mapped components with LDU->mm conversion', () => {
  const result = importLdraw(fixture('basic.ldr'), catalog);
  assert.equal(result.status, 'ok', JSON.stringify(result.diagnostics, null, 1));
  assert.equal(result.model.components.length, 3);
  const [a, b, c] = result.model.components;
  assert.equal(a.ldrawPartId, '3005.dat');
  assert.equal(a.catalogId, 'brick-1x1');
  assert.equal(a.code, 'BW-BR-001');
  assert.deepEqual(a.posMm, [0, 0, 0]);
  assert.deepEqual(a.rotationEuler, [0, 0, 0]);
  assert.equal(a.colorCode, 4);
  assert.equal(a.colorHex, LDRAW_COLORS[4]);
  assert.equal(a.step, 1);
  // LDraw Y is down (24 LDU brick height) -> +9.6 mm up in the Y-up world
  assert.equal(b.catalogId, 'brick-2x4');
  assert.deepEqual(b.posMm, [0, 9.6, 0]);
  assert.equal(b.colorCode, 71);
  // 40 LDU -> 16 mm along +X
  assert.deepEqual(c.posMm, [16, 0, 0]);
  assert.equal(c.colorCode, 14);
  assert.equal(c.step, 2);
  assert.equal(result.stats.unmapped, 0);
});

test('converts an LDraw rotation matrix into a proper world rotation of the same angle', () => {
  // 90 degree rotation matrix (row-vector convention used by LDraw line type 1)
  const r = importLdraw('1 4 10 20 30 0 1 0 -1 0 0 0 0 1 3005.dat', catalog);
  assert.equal(r.status, 'ok', JSON.stringify(r.diagnostics));
  const part = r.model.components[0];
  assert.deepEqual(part.posMm, [4, -8, -12]);
  const m = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(part.rotationEuler[0], part.rotationEuler[1], part.rotationEuler[2], 'XYZ'));
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  const angle = 2 * Math.acos(Math.min(1, Math.abs(q.w)));
  assert.ok(Math.abs(angle - Math.PI / 2) < 1e-6, 'angle=' + angle);
  assert.ok(Math.abs(m.determinant() - 1) < 1e-6, 'must be a proper rotation');
});

test('imports a .mpd by expanding a named sub-model once, bounded', () => {
  const r = importLdraw(fixture('stack.mpd'), catalog, { model: 'bw-main.ldr' });
  assert.equal(r.status, 'ok', JSON.stringify(r.diagnostics));
  assert.equal(r.model.components.length, 4);
  assert.equal(r.stats.expandedSubmodels, 1);
});

test('reports unsupported LDraw parts instead of silently dropping them', () => {
  const r = importLdraw('1 4 0 0 0 1 0 0 0 1 0 0 0 1 99999.dat', catalog);
  assert.equal(r.status, 'needs_revision');
  assert.equal(r.model.components.length, 0);
  assert.ok(r.unsupported.some(u => u.partId === '99999.dat'));
  assert.ok(r.diagnostics.some(d => d.code === 'UNSUPPORTED_PART'));
});

test('rejects malformed, non-finite and path-traversal LDraw input', () => {
  for (const bad of [
    '1 4 0 0 0 1 0 0 0 1 0 0 0 1',                 // missing part reference
    '1 4 NaN 0 0 1 0 0 0 1 0 0 0 1 3005.dat',      // non-finite number
    '1 4 0 0 0 1 0 0 0 1 0 0 0 1 ../../etc/passwd',// path traversal
    '1 4 0 0 0 1 0 0 0 1 0 0 0 1 3005'             // not a mapped .dat part
  ]) {
    const r = importLdraw(bad, catalog);
    assert.equal(r.status, 'needs_revision', bad);
    assert.equal(r.model.components.length, 0, bad);
    assert.ok(r.diagnostics.length > 0, bad);
  }
  assert.throws(() => importLdraw('1 4 0 0 0 1 0 0 0 1 0 0 0 1 3005.dat', catalog, { maxLines: 0 }),
    /LDRAW_INPUT_INVALID/);
  assert.throws(() => importLdraw(42, catalog), /LDRAW_INPUT_INVALID/);
});

test('parse exposes STEP boundaries without executing anything', () => {
  const parsed = parseLdrawLines(fixture('basic.ldr'));
  assert.equal(parsed.stats.lines, 9);
  assert.equal(parsed.stats.references, 3);
  assert.equal(parsed.stats.stepCommands, 1);
  assert.ok(parsed.records.every(r => typeof r.type === 'number'));
});
