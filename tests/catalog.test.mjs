import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SERIES, COMPONENTS, MODELS } from '../src/catalog.js';
import { buildAssembly, createPart, SYSTEM_DIMENSIONS } from '../src/brick-system.js';

const supportedTypes = new Set(["brick","sphere","cylinder","plate","tile","jumper","slope","inverted-slope","curved-slope","curved-tile","arch","dome","cone","wedge","bracket","clip","bar","hinge","connector","corner","beam","bearing","angle-beam","frame","pin","axle","bushing","gear","worm-gear","rack-gear","bevel-gear","turntable","differential","wheel","track","panel","window","door","leaf","flower","tree-trunk","rock","ring","spring","transparent-shell","light-brick","grille"]);

test('publishes exactly three core series and an independent creative lab', () => {
  assert.equal(SERIES.length, 3);
  for (const series of SERIES) {
    assert.ok(MODELS.some(model => model.series === series.id), 'missing builds for ' + series.id);
  }
  assert.ok(MODELS.some(model => model.series === 'creative-lab'));
});

test('every build and part has a stable unique identifier', () => {
  const modelIds = MODELS.map(model => model.id);
  assert.equal(new Set(modelIds).size, modelIds.length);
  for (const model of MODELS) {
    const ids = model.parts.map(part => part.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate part id in ' + model.id);
    assert.ok(model.steps.length > 0, 'missing assembly steps in ' + model.id);
  }
});

test('all part manifests use supported geometry, finite transforms and valid steps', () => {
  for (const model of MODELS) {
    for (const part of model.parts) {
      assert.ok(supportedTypes.has(part.type), model.id + ' uses unsupported type ' + part.type);
      assert.equal(part.pos.length, 3);
      assert.ok(part.pos.every(Number.isFinite), 'non-finite position in ' + part.id);
      assert.ok(Number.isInteger(part.step) && part.step >= 1 && part.step <= model.steps.length, 'invalid step in ' + part.id);
      assert.match(part.color, /^#[0-9a-f]{6}$/i);
    }
  }
});

test('component library contains 101 coded reusable components', () => {
  assert.equal(COMPONENTS.length, 101);
  assert.equal(new Set(COMPONENTS.map(component => component.id)).size, 101);
  assert.equal(new Set(COMPONENTS.map(component => component.code)).size, 101);
  for (const component of COMPONENTS) {
    assert.ok(supportedTypes.has(component.type), 'unsupported component ' + component.id);
    assert.ok(component.name && component.description && component.dimensions && component.connectionProfile);
    assert.ok(component.code.startsWith('BW-'));
  }
});

const CANONICAL_FAMILIES = [
  'Bricks', 'Plates & Tiles', 'Slopes & Curves', 'Connectors & SNOT',
  'Technic Structure', 'Gears & Transmission', 'Wheels & Motion',
  'Architecture', 'Nature', 'Special'
];

test('component families follow the canonical ten-family taxonomy', () => {
  const families = [...new Set(COMPONENTS.map(component => component.family))].sort();
  assert.deepEqual(families, [...CANONICAL_FAMILIES].sort());
  const technic = COMPONENTS.filter(component => component.code.startsWith('BW-TC-'));
  assert.ok(technic.length > 0, 'expected Technic-coded components');
  assert.ok(technic.every(component => component.family === 'Technic Structure'),
    'every BW-TC-* component must share the single "Technic Structure" family');
});

test('every published assembly produces finite, non-empty Three.js bounds', () => {
  for (const model of MODELS) {
    const { root, parts } = buildAssembly(model);
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    assert.equal(parts.length, model.parts.length);
    assert.ok(Number.isFinite(size.length()) && size.length() > 0, 'empty geometry in ' + model.id);
    root.traverse(node => {
      if (node.geometry?.attributes?.position) {
        const values = node.geometry.attributes.position.array;
        assert.ok(values.every(Number.isFinite), 'non-finite vertex in ' + model.id + '/' + node.name);
      }
      node.geometry?.dispose();
      if (node.material) {
        (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => material.dispose());
      }
    });
  }
});

test('nominal grid dimensions preserve the 3:1 brick-to-plate relationship', () => {
  assert.equal(SYSTEM_DIMENSIONS.studPitchMm, 8);
  assert.equal(SYSTEM_DIMENSIONS.brickBodyHeightMm, 9.6);
  assert.equal(SYSTEM_DIMENSIONS.plateBodyHeightMm, 3.2);
  assert.ok(Math.abs(SYSTEM_DIMENSIONS.brickBodyHeightMm / SYSTEM_DIMENSIONS.plateBodyHeightMm - 3) < 1e-12);
});


test('all 101 component previews create finite, non-empty procedural geometry', () => {
  for (const component of COMPONENTS) {
    const object = createPart({
      id: component.id, name: component.name, type: component.type,
      size: component.size, color: component.color, transparent: component.transparent,
      pos: [0,0,0], step: 1
    });
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    assert.ok(Number.isFinite(size.length()) && size.length() > 0, 'empty geometry for ' + component.id);
    object.traverse(node => {
      if (node.geometry?.attributes?.position) {
        assert.ok([...node.geometry.attributes.position.array].every(Number.isFinite), 'non-finite vertex for ' + component.id);
      }
      node.geometry?.dispose();
      if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => material.dispose());
    });
  }
});
