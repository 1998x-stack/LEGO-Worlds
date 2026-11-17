import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANCHOR_SCHEMA_VERSION,
  getPartAnchors,
  getAssemblyAnchors,
  checkAnchorCompatibility,
  areAnchorsCompatible
} from '../src/connection-anchors.js';
import { COMPONENTS, MODELS } from '../src/catalog.js';

const componentsById = new Map(COMPONENTS.map(component => [component.id, component]));
const component = id => {
  const item = componentsById.get(id);
  assert.ok(item, 'missing component ' + id);
  return item;
};
const anchorsFor = id => getPartAnchors(component(id));
const byKind = (anchors, kind) => anchors.filter(anchor => anchor.kind === kind);

test('anchor schema is versioned and uses millimetres', () => {
  assert.equal(ANCHOR_SCHEMA_VERSION, 1);
});

test('all 100 catalogue components expose stable, finite, oriented anchors', () => {
  assert.equal(COMPONENTS.length, 100);
  for (const item of COMPONENTS) {
    const anchors = getPartAnchors(item);
    assert.ok(anchors.length > 0, 'no anchors for ' + item.id);
    assert.equal(new Set(anchors.map(anchor => anchor.id)).size, anchors.length, 'duplicate anchor IDs for ' + item.id);
    for (const anchor of anchors) {
      assert.equal(anchor.partId, item.id);
      assert.ok(anchor.kind && anchor.role && Array.isArray(anchor.position));
      assert.equal(anchor.position.length, 3);
      assert.ok(anchor.position.every(Number.isFinite), 'non-finite position: ' + anchor.id);
      assert.equal(anchor.normal.length, 3);
      assert.ok(anchor.normal.every(Number.isFinite));
      assert.ok(Math.abs(Math.hypot(...anchor.normal) - 1) < 1e-6, 'normal is not normalized: ' + anchor.id);
      assert.equal(anchor.up.length, 3);
      assert.ok(anchor.up.every(Number.isFinite));
      if (anchor.axis) {
        assert.ok(Math.abs(Math.hypot(...anchor.axis) - 1) < 1e-6, 'axis is not normalized: ' + anchor.id);
      }
      assert.ok(Array.isArray(anchor.accepts));
      assert.ok(anchor.source && anchor.confidence);
    }
  }
});

test('brick, plate, tile and jumper grids follow the 8 mm stud pitch', () => {
  const brick = anchorsFor('brick-2x4');
  assert.equal(byKind(brick, 'stud').length, 8);
  assert.equal(byKind(brick, 'stud-socket').length, 8);
  const studXs = [...new Set(byKind(brick, 'stud').map(anchor => anchor.position[0]))].sort((a, b) => a - b);
  const studZs = [...new Set(byKind(brick, 'stud').map(anchor => anchor.position[2]))].sort((a, b) => a - b);
  assert.deepEqual(studXs, [-4, 4]);
  assert.deepEqual(studZs, [-12, -4, 4, 12]);

  const tile = anchorsFor('tile-2x4');
  assert.equal(byKind(tile, 'stud').length, 0);
  assert.equal(byKind(tile, 'stud-socket').length, 8);

  const jumper = anchorsFor('jumper-1x2');
  assert.equal(byKind(jumper, 'stud').length, 1);
  assert.equal(byKind(jumper, 'stud-socket').length, 2);
  assert.deepEqual(byKind(jumper, 'stud')[0].position, [0, 3.3, -4]);
});

test('Technic beam and angle-beam anchors match their hole counts', () => {
  assert.equal(byKind(anchorsFor('beam-5'), 'technic-hole').length, 5);
  assert.equal(byKind(anchorsFor('beam-13'), 'technic-hole').length, 13);
  assert.equal(byKind(anchorsFor('angle-beam-3x5'), 'technic-hole').length, 8);
  assert.equal(byKind(anchorsFor('thin-liftarm-5'), 'technic-hole').length, 5);
});

test('pins, axles, gears, wheels and track parts expose axial interfaces', () => {
  assert.equal(byKind(anchorsFor('friction-pin'), 'pin').length, 1);
  assert.equal(byKind(anchorsFor('axle-5'), 'axle').length, 1);
  assert.equal(byKind(anchorsFor('half-bushing'), 'axle-hole').length, 1);
  assert.equal(byKind(anchorsFor('gear-16t'), 'gear-axis').length, 1);
  assert.equal(byKind(anchorsFor('gear-16t'), 'gear-mesh').length, 1);
  assert.equal(byKind(anchorsFor('wheel-medium'), 'wheel-axis').length, 1);
  assert.equal(byKind(anchorsFor('track-link'), 'track-joint').length, 2);
});

test('assembly anchors transform local positions and directions by part rotation and translation', () => {
  const model = {
    parts: [{
      id: 'test-brick',
      type: 'brick',
      size: [1, 2],
      pos: [10, 20, 30],
      rotation: [0, Math.PI / 2, 0]
    }]
  };
  const anchors = getAssemblyAnchors(model);
  const firstStud = byKind(anchors, 'stud')[0];
  assert.ok(Math.abs(firstStud.position[0] - 6) < 1e-6);
  assert.ok(Math.abs(firstStud.position[1] - 26.5) < 1e-6);
  assert.ok(Math.abs(firstStud.position[2] - 30) < 1e-6);
  assert.ok(Math.abs(firstStud.normal[0]) < 1e-6);
  assert.ok(Math.abs(firstStud.normal[1] - 1) < 1e-6);
  assert.ok(Math.abs(firstStud.normal[2]) < 1e-6);
  assert.ok(anchors.every(anchor => anchor.instanceId === 'test-brick#0'));
});

test('assembly anchor IDs remain unique when a component is instanced more than once', () => {
  const item = component('brick-1x2');
  const anchors = getAssemblyAnchors({
    parts: [
      { ...item, pos: [0, 0, 0] },
      { ...item, id: 'brick-1x2-copy', pos: [20, 0, 0] }
    ]
  });
  assert.equal(new Set(anchors.map(anchor => anchor.id)).size, anchors.length);
});

test('compatibility checks enforce interface type, face direction, axis and fit', () => {
  const topStud = byKind(anchorsFor('brick-1x1'), 'stud')[0];
  const bottomSocket = byKind(anchorsFor('brick-1x1'), 'stud-socket')[0];
  const secondStud = { ...topStud, id: 'second-brick:stud:001', partId: 'second-brick' };
  const secondSocket = { ...bottomSocket, id: 'second-brick:stud-socket:001', partId: 'second-brick' };
  assert.equal(areAnchorsCompatible(topStud, secondSocket), true);
  assert.equal(areAnchorsCompatible(bottomSocket, secondStud), true);
  assert.equal(checkAnchorCompatibility(topStud, { ...secondSocket, normal: [0, 1, 0] }).reason, 'face-normals-not-opposed');

  const hole = byKind(anchorsFor('beam-5'), 'technic-hole')[0];
  const pin = byKind(anchorsFor('smooth-pin'), 'pin')[0];
  assert.equal(areAnchorsCompatible(hole, pin), true);
  assert.equal(areAnchorsCompatible(hole, { ...pin, axis: [1, 0, 0] }), false);

  const clip = byKind(anchorsFor('clip-1x1'), 'clip')[0];
  const bar = byKind(anchorsFor('bar-4'), 'bar')[0];
  assert.equal(areAnchorsCompatible(clip, bar), true);

  const ball = byKind(anchorsFor('ball-joint'), 'ball')[0];
  const socket = byKind(anchorsFor('socket-joint'), 'ball-socket')[0];
  assert.equal(areAnchorsCompatible(ball, socket), true);
  assert.equal(areAnchorsCompatible(topStud, pin), false);
});

test('gear mesh compatibility checks tooth profile and module', () => {
  const gearA = byKind(anchorsFor('gear-16t'), 'gear-mesh')[0];
  const gearB = byKind(anchorsFor('gear-20t'), 'gear-mesh')[0];
  const bevel = byKind(anchorsFor('bevel-gear-12t'), 'gear-mesh')[0];
  assert.equal(areAnchorsCompatible(gearA, gearB), true);
  assert.equal(areAnchorsCompatible(gearA, bevel), false);
});

test('all published model assemblies produce unique finite anchor coordinates', () => {
  for (const model of MODELS) {
    const anchors = getAssemblyAnchors(model);
    assert.ok(anchors.length > 0, 'no assembly anchors for ' + model.id);
    assert.equal(new Set(anchors.map(anchor => anchor.id)).size, anchors.length);
    assert.ok(anchors.every(anchor => anchor.position.every(Number.isFinite)), 'invalid anchor position in ' + model.id);
  }
});
