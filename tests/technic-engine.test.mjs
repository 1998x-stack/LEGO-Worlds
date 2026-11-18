import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { COMPONENTS } from '../src/catalog.js';
import { createPart } from '../src/brick-system.js';
import { getPartAnchors, checkAnchorCompatibility } from '../src/connection-anchors.js';
import {
  MECHANISM_SCHEMA_VERSION, MECHANISM_MAX_PARTS, createMechanism,
  createMechanismPreset, mountShaft, mountAccessory, availableHoles,
  meshedGearPairs, mechanismGraph, mechanismAngles,
  exportMechanism, replayMechanism
} from '../src/technic-engine.js';

const C = COMPONENTS;
const byId = id => C.find(x => x.id === id);
const close = (a,b) => Math.abs(a-b) < 1e-6;

test('Technic mechanism presets have valid joint graph and consistent IDs', () => {
  assert.equal(MECHANISM_SCHEMA_VERSION, 1);
  assert.equal(MECHANISM_MAX_PARTS, 32);
  for (const id of ['dual-gears','wheel-axle','pin-fixture']) {
    const state = createMechanismPreset(C, id);
    assert.ok(state.parts.length >= 3);
    assert.equal(new Set(state.parts.map(p=>p.instanceId)).size,state.parts.length);
    assert.equal(state.connections.length,state.steps.length);
    assert.ok(state.connections.every(e=>e.fromAnchor && e.toAnchor && e.joint));
    for (const p of state.parts) assert.ok(p.pos.every(Number.isFinite));
  }
});

test('five-hole beam inserts pins at exact 8 mm pitch and blocks occupied holes', () => {
  let state = createMechanism(C,'beam-5');
  assert.deepEqual(availableHoles(state).map(h=>h.position[0]),[-16,-8,0,8,16]);
  state=mountShaft(state,C,{componentId:'friction-pin',holeIndex:2,instanceId:'pin_1'});
  assert.deepEqual(state.parts.at(-1).pos,[0,0,0]);
  assert.equal(state.connections[0].kind,'pin-hole');
  assert.equal(state.connections[0].joint,'fixed');
  assert.equal(availableHoles(state)[2].occupied,true);
  assert.throws(()=>mountShaft(state,C,{componentId:'smooth-pin',holeIndex:2,instanceId:'pin_2'}),/already/);
  assert.throws(()=>mountShaft(state,C,{componentId:'smooth-pin',holeIndex:9,instanceId:'pin_2'}),/does not exist/);
});

test('beam/pin and beam/axle anchors remain physically coaxial and compatible', () => {
  const state = createMechanismPreset(C,'dual-gears');
  const beam = state.parts[0];
  const left = state.parts.find(x=>x.instanceId==='axle_left');
  const beamHole = getPartAnchors(beam).filter(a=>a.kind==='technic-hole')[1];
  const axleAnchor = getPartAnchors(left).find(a=>a.kind==='axle');
  assert.ok(close(beamHole.position[0],left.pos[0]));
  assert.ok(close(axleAnchor.position[2],0));
  assert.equal(checkAnchorCompatibility(
    { ...beamHole,instanceId:'beam' },
    { ...axleAnchor,instanceId:'axle_left' }
  ).compatible,true);
});

test('accessories must fit on a shaft and cannot overlap unrelated accessories', () => {
  let state=createMechanism(C);
  state=mountShaft(state,C,{componentId:'axle-3',holeIndex:1,instanceId:'left'});
  assert.throws(()=>mountAccessory(state,C,{
    componentId:'wheel-medium',shaftInstanceId:'left',instanceId:'wheel'
  }),/too short/);
  state=mountAccessory(state,C,{componentId:'gear-16t',shaftInstanceId:'left',instanceId:'gear'});
  assert.equal(state.connections.at(-1).kind,'keyed-mount');
  assert.equal(state.connections.at(-1).joint,'fixed');
  assert.throws(()=>mountAccessory(state,C,{
    componentId:'gear-8t',shaftInstanceId:'left',instanceId:'second'
  }),/already/);
  state=mountShaft(state,C,{componentId:'axle-5',holeIndex:2,instanceId:'middle'});
  assert.throws(()=>mountAccessory(state,C,{
    componentId:'wheel-compact',shaftInstanceId:'middle',instanceId:'intersect'
  }),/collides/);
});

test('dual gear drive produces a schematic 1:-1 counter-rotation ratio', () => {
  const state=createMechanismPreset(C,'dual-gears');
  const pairs=meshedGearPairs(state);
  assert.equal(pairs.length,1);
  assert.equal(pairs[0].ratio,-1);
  assert.ok(close(pairs[0].pitchCenterDistanceMm,16));
  const angles=mechanismAngles(state,Math.PI/3);
  assert.ok(close(angles.axle_left,Math.PI/3));
  assert.ok(close(angles.axle_right,-Math.PI/3));
  assert.ok(close(angles.drive_gear,Math.PI/3));
  assert.ok(close(angles.driven_gear,-Math.PI/3));
  assert.equal(mechanismGraph(state).length,5);
});

test('wheel-axle assembly preserves a keyed wheel and a revolute beam bearing', () => {
  const state=createMechanismPreset(C,'wheel-axle');
  assert.equal(state.parts.find(x=>x.instanceId==='wheel').type,'wheel');
  assert.equal(state.connections.find(x=>x.to==='drive_axle').joint,'revolute');
  const a=mechanismAngles(state,2.3);
  assert.ok(close(a.wheel,2.3));
  assert.ok(close(a.drive_axle,2.3));
});

test('mechanism export/import replays canonical operations, never trusting external transforms or edges', () => {
  const state=createMechanismPreset(C,'dual-gears');
  const exported=exportMechanism(state);
  assert.equal(exported.schemaVersion,1);
  assert.equal(exported.anchorSchemaVersion,1);
  assert.equal(exported.units,'mm');
  const modified=structuredClone(exported);
  modified.parts[1].pos=[999,999,999];
  modified.connections=[{kind:'fake',from:'unknown'}];
  const recovered=replayMechanism(C,modified);
  assert.deepEqual(recovered.parts.map(p=>p.pos),state.parts.map(p=>p.pos));
  assert.deepEqual(mechanismGraph(recovered),mechanismGraph(state));
});

test('mechanism input refuses unknown catalog parts, duplicate IDs and unsupported operations', () => {
  let state=createMechanism(C);
  assert.throws(()=>mountShaft(state,C,{
    componentId:'brick-2x4',holeIndex:0,instanceId:'invalid'
  }),/Select a supported/);
  state=mountShaft(state,C,{componentId:'axle-3',holeIndex:1,instanceId:'axle_1'});
  assert.throws(()=>mountShaft(state,C,{
    componentId:'smooth-pin',holeIndex:0,instanceId:'axle_1'
  }),/Duplicate/);
  const document=exportMechanism(state);
  assert.throws(()=>replayMechanism(C,{...document,schemaVersion:20}),/Invalid or unsupported/);
  assert.throws(()=>replayMechanism(C,{...document,steps:[{operation:'deleteEverything'}]}),/Unknown assembly/);
  assert.throws(()=>replayMechanism(C,{...document,steps:[{operation:'shaft',componentId:'axle-3',holeIndex:8,instanceId:'bad'}]}),/does not exist/);
  assert.throws(()=>replayMechanism(C,{...document,steps:Array.from({length:MECHANISM_MAX_PARTS},()=>document.steps[0])}),/Invalid or unsupported/);
});

test('gear and wheel models have actual unoccupied through-bores for visual axle insertion', () => {
  for(const componentId of ['gear-8t','gear-16t','gear-24t','wheel-compact','wheel-medium','wheel-hub']) {
    const object=createPart({...byId(componentId),pos:[0,0,0]});
    object.updateMatrixWorld(true);
    const raycaster=new THREE.Raycaster(new THREE.Vector3(0,0,40),new THREE.Vector3(0,0,-1));
    const hits=raycaster.intersectObject(object,true);
    assert.equal(hits.length,0,componentId+' must have open central bore');
    object.traverse(node=>{
      node.geometry?.dispose();
      const mats=node.material?(Array.isArray(node.material)?node.material:[node.material]):[];
      mats.forEach(mat=>mat.dispose());
    });
  }
});
