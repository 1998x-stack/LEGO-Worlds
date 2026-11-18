import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { COMPONENTS } from '../src/catalog.js';
import { getPartAnchors, checkAnchorCompatibility } from '../src/connection-anchors.js';
import {
  BUILDER_SCHEMA_VERSION, BUILDER_MAX_PARTS, isBuilderComponent,
  bodyBounds, bodyCollision, solveAnchorAlignment, findSnapCandidate,
  worldAnchor, collectConnections, serializeBuild, parseBuild
} from '../src/snap-engine.js';

const lookup = new Map(COMPONENTS.map(part => [part.id, part]));
function part(componentId, instanceId, pos, rotation = [0,0,0]) {
  const c = lookup.get(componentId);
  assert.ok(c);
  return {
    id: c.id, componentId: c.id, instanceId, name: c.name,
    type: c.type, size: [...c.size], color: c.color,
    pos: [...pos], rotation: [...rotation]
  };
}
const base = () => part('plate-2x6', 'foundation', [0, 1.6, 0]);
const newBrick = () => part('brick-2x4', 'brick_1', [0, 8, 0]);
const near = (a,b,epsilon=1e-6) => Math.abs(a-b) <= epsilon;

test('snap builder exposes only supported stud-grid geometry', () => {
  assert.equal(BUILDER_SCHEMA_VERSION, 1);
  assert.equal(BUILDER_MAX_PARTS, 64);
  assert.ok(isBuilderComponent(lookup.get('brick-2x4')));
  assert.ok(isBuilderComponent(lookup.get('jumper-1x2')));
  assert.ok(isBuilderComponent(lookup.get('tile-2x2')));
  assert.equal(isBuilderComponent(lookup.get('beam-5')), false);
  assert.equal(isBuilderComponent(lookup.get('gear-8t')), false);
});

test('snap solver seats studs into the underside socket without a 1.7 mm gap', () => {
  const fixed = base();
  const moving = newBrick();
  const result = findSnapCandidate(moving, [fixed]);
  assert.equal(result.status, 'ready');
  assert.ok(near(result.candidate.transform.pos[1], 8));
  const seated = { ...moving, ...result.candidate.transform };
  assert.equal(bodyCollision(seated, fixed), false);
  assert.equal(collectConnections([fixed, seated]).length, 8);
});

test('snap alignment rotates opposed face normals into a compatible frame', () => {
  const moving = part('brick-1x2', 'moving', [0, 10, 0], [Math.PI, 0, 0]);
  const fixed = base();
  const top = getPartAnchors(fixed).find(a=>a.kind==='stud');
  const socket = getPartAnchors(moving).find(a=>a.kind==='stud-socket');
  const aligned = solveAnchorAlignment(
    socket,
    worldAnchor(top, fixed, fixed.instanceId),
    moving
  );
  assert.ok(aligned);
  const out = worldAnchor(socket, aligned, moving.instanceId);
  const target = worldAnchor(top, fixed, fixed.instanceId);
  assert.equal(checkAnchorCompatibility(out, target).compatible, true);
  assert.ok(near(new THREE.Vector3(...out.position).distanceTo(
    new THREE.Vector3(...target.position).addScaledVector(new THREE.Vector3(...target.normal), -1.7)
  ), 0));
});

test('same-level body overlaps are blocked, stacked bodies are not', () => {
  const a = part('brick-2x4', 'a', [0, 4.8, 0]);
  const b = part('brick-1x2', 'b', [0, 4.8, 0]);
  assert.equal(bodyCollision(a,b), true);
  assert.equal(bodyCollision(a, { ...b, pos: [0, 14.4, 0] }), false);
  assert.ok(bodyBounds(a).max.y > bodyBounds(b).min.y);
});

test('blocked candidate reports colliding instance, without committing it', () => {
  const foundation = base();
  const occupying = newBrick();
  const ghost = part('brick-2x4', 'brick_2', [0,8,0]);
  const result = findSnapCandidate(ghost, [foundation, occupying], { maxDistanceMm: 3 });
  assert.equal(result.status,'blocked');
  assert.ok(result.candidate.collidesWith.includes('brick_1'));
});

test('a mating solution below the build floor is rejected', () => {
  const below = part('brick-1x1','below',[-4,-4.8,-20]);
  const result = findSnapCandidate(below,[base()],{ maxDistanceMm: 2 });
  assert.equal(result.status,'blocked');
  assert.ok(result.candidate.collidesWith.includes('ground'));
});

test('snap threshold rejects distant parts', () => {
  const result = findSnapCandidate(part('brick-2x4','far',[400,8,200]),[base()]);
  assert.equal(result.status,'none');
  assert.equal(result.candidate,null);
});

test('rotated quarter-turn body bounds remain finite and correct', () => {
  const a = part('brick-2x4','a',[0,8,0],[0,Math.PI/2,0]);
  const bounds = bodyBounds(a).getSize(new THREE.Vector3());
  assert.ok(near(bounds.x,31.78));
  assert.ok(near(bounds.z,15.78));
});

test('JSON export/import retains positions and recomputes untrusted edges', () => {
  const foundation=base();
  const moving=newBrick();
  const snap=findSnapCandidate(moving,[foundation]);
  const placed=[foundation,{ ...moving,...snap.candidate.transform }];
  const encoded=serializeBuild(placed);
  assert.equal(encoded.schemaVersion,1);
  assert.equal(encoded.anchorSchemaVersion,1);
  assert.equal(encoded.units,'mm');
  assert.equal(encoded.parts.length,2);
  assert.equal(encoded.connections.length,8);
  const restored=parseBuild({ ...encoded, connections:[{ from:'fake' }] },COMPONENTS);
  assert.deepEqual(restored.map(p=>p.pos),placed.map(p=>p.pos));
  assert.equal(collectConnections(restored).length,8);
});

test('import rejects unknown IDs, collisions, unbounded coordinates and unsupported versions', () => {
  const foundation=base();
  const moving=newBrick();
  const valid=serializeBuild([foundation,moving]);
  assert.throws(()=>parseBuild({ ...valid, schemaVersion:999 },COMPONENTS));
  assert.throws(()=>parseBuild({ ...valid, parts:[...valid.parts,{...valid.parts[1]}] },COMPONENTS));
  assert.throws(()=>parseBuild({ ...valid, parts:[{...valid.parts[0],componentId:'unknown'}] },COMPONENTS));
  assert.throws(()=>parseBuild({ ...valid, parts:[{...valid.parts[0],pos:[Infinity,0,0]}] },COMPONENTS));
  const clashing=serializeBuild([
    foundation,part('brick-2x4','overlap_1',[0,8,0]),part('brick-1x2','overlap_2',[0,8,0])
  ]);
  assert.throws(()=>parseBuild(clashing,COMPONENTS),/collide/);
});
