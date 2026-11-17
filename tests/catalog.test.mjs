import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SERIES, COMPONENTS, MODELS } from '../src/catalog.js';
import { buildAssembly, SYSTEM_DIMENSIONS } from '../src/brick-system.js';

const supportedTypes = new Set([
  'brick', 'plate', 'tile', 'jumper', 'slope', 'beam', 'pin', 'axle',
  'gear', 'wheel', 'panel', 'window', 'door', 'leaf', 'dome', 'ring',
  'cylinder', 'sphere'
]);

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

test('component library entries map to supported geometry factories', () => {
  assert.ok(COMPONENTS.length >= 16);
  for (const component of COMPONENTS) {
    assert.ok(supportedTypes.has(component.type), 'unsupported component ' + component.id);
    assert.ok(component.name && component.description && component.dimensions);
  }
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
  assert.equal(SYSTEM_DIMENSIONS.brickBodyHeightMm / SYSTEM_DIMENSIONS.plateBodyHeightMm, 3);
});
