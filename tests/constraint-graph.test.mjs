import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { COMPONENTS } from '../src/catalog.js';
import {
  CONSTRAINT_GRAPH_VERSION, GRAPH_MAX_BODIES, GRAPH_MAX_JOINTS, GRAPH_MAX_FREE_JOINTS,
  GRAPH_PRESETS, GRAPH_CATALOG_IDS, graphPorts, portById,
  validateConstraintGraph, solveConstraintGraph, appendGraphBody,
  appendGraphJoint, removeGraphJoint, exportConstraintGraph,
  importConstraintGraph, createConstraintPreset
} from '../src/constraint-graph.js';

const catalog = COMPONENTS;
const nearly = (a,b,tol=1e-4) => Math.abs(a-b)<tol;
const copy = v => structuredClone(v);

test('all four general graph presets have finite poses and meaningful links', () => {
  assert.equal(CONSTRAINT_GRAPH_VERSION,1);
  assert.equal(GRAPH_MAX_BODIES,20);
  assert.equal(GRAPH_MAX_JOINTS,32);
  assert.equal(GRAPH_PRESETS.length,4);
  for(const {id} of GRAPH_PRESETS){
    const graph = create(id);
    validateConstraintGraph(graph,catalog);
    const solved=solveConstraintGraph(graph,catalog);
    assert.equal(solved.valid,true,id+' closure error='+solved.closureErrorMm);
    assert.equal(solved.status,'valid',id+' collision='+JSON.stringify(solved.collisionPairs));
    assert.equal(Object.keys(solved.poses).length,graph.bodies.length);
    for(const pose of Object.values(solved.poses)) {
      assert.ok(pose.pos.every(Number.isFinite) && pose.rotation.every(Number.isFinite));
    }
  }
});

test('four-bar linkage is a real cyclic multi-constraint graph, not an open tree', () => {
  const graph=create('four-bar');
  const atHome=solveConstraintGraph(graph,catalog);
  assert.equal(atHome.cycleCount,1);
  assert.ok(atHome.closureErrorMm<1e-5);
  assert.deepEqual(atHome.connectedGroups.map(group=>group.length),[4]);
  assert.equal(graph.joints.filter(j=>j.controlled).length,1);
  for(const input of [80,100,65,120]){
    const solved=solveConstraintGraph(graph,catalog,{values:{drive:input},maxIterations:90});
    assert.equal(solved.valid,true,'motor='+input+' closure='+solved.closureErrorMm);
    assert.ok(Math.abs(solved.values.upper_left + input)<5,'coupler follows input');
    assert.ok(Math.abs(solved.values.right_ground - input)<5,'rocker follows input');
    assert.equal(solved.cycleCount,1);
  }
});

test('linear slider moves a rigid carriage along the local X guide while preserving platform offset', () => {
  const graph=create('linear-carriage');
  const at0=solveConstraintGraph(graph,catalog,{values:{slide:0}});
  const at24=solveConstraintGraph(graph,catalog,{values:{slide:24}});
  assert.equal(at0.valid,true);
  assert.equal(at24.valid,true);
  assert.ok(nearly(at24.poses.carriage.pos[0]-at0.poses.carriage.pos[0],24));
  assert.ok(nearly(at24.poses.platform.pos[0]-at0.poses.platform.pos[0],24));
  assert.ok(nearly(at24.poses.platform.pos[1]-at24.poses.carriage.pos[1],6.4));
  assert.equal(at24.cycleCount,0);
});

test('shaft joint rotates the wheel and gear rigid subassembly about the Z axis', () => {
  const graph=create('shaft-drive');
  const initial=solveConstraintGraph(graph,catalog,{values:{motor:0}});
  const quarter=solveConstraintGraph(graph,catalog,{values:{motor:90}});
  assert.equal(quarter.valid,true);
  assert.ok(nearly(quarter.poses.wheel.pos[0],initial.poses.wheel.pos[0]));
  assert.ok(nearly(quarter.poses.wheel.pos[2],initial.poses.wheel.pos[2]));
  const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(...initial.poses.wheel.rotation,'XYZ'));
  const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(...quarter.poses.wheel.rotation,'XYZ'));
  const difference=q0.invert().multiply(q1);
  assert.ok(nearly(Math.abs(difference.angleTo(new THREE.Quaternion())),Math.PI/2,1e-4));
});

test('graph editor adds independent bodies and arbitrary hinge/shaft/slider/fixed constraints', () => {
  let graph=create('linear-carriage');
  graph=appendGraphBody(graph,'beam-3',catalog);
  const added=graph.bodies.at(-1);
  assert.ok(added.id.startsWith('part_'));
  assert.equal(solveConstraintGraph(graph,catalog).valid,true);
  graph=appendGraphJoint(graph,{
    bodyA:'platform',portA:'right-z',bodyB:added.id,portB:'left-z',
    kind:'hinge',value:0,controlled:true
  },catalog);
  assert.equal(graph.joints.at(-1).kind,'hinge');
  assert.equal(solveConstraintGraph(graph,catalog).valid,true);
  graph=removeGraphJoint(graph,graph.joints.at(-1).id,catalog);
  assert.equal(graph.joints.length,2);
  assert.equal(solveConstraintGraph(graph,catalog).valid,true);
});

test('closed-loop authoring refuses contradictory extra edges with no feasible free DOF', () => {
  const graph=create('shaft-drive');
  assert.throws(()=>appendGraphJoint(graph,{
    bodyA:'support',portA:'center-z',
    bodyB:'wheel',portB:'center-z',kind:'fixed'
  },catalog),/closed-loop/);
});

test('oriented-box collision diagnostics detect unconnected solid overlaps without claiming mesh precision', () => {
  const graph=create('shaft-drive');
  graph.bodies.push({
    id:'overlap_block',componentId:'brick-2x4',grounded:true,
    pos:[0,0,0],rotation:[0,0,0]
  });
  const solved=solveConstraintGraph(graph,catalog);
  assert.equal(solved.valid,true);
  assert.equal(solved.status,'collision-warning');
  assert.ok(solved.collisionPairs.some(p=>p.bodyA==='overlap_block'||p.bodyB==='overlap_block'));
  assert.ok(solved.collisionPairs.every(p=>p.method==='oriented-box-proxy'));
});

test('native connection-anchor ports expose Technic holes, gear axis and consistent virtual frames', () => {
  const beam={id:'beam',componentId:'beam-5'};
  const ports=graphPorts(beam,catalog);
  assert.equal(ports.filter(p=>p.id.startsWith('technic-hole:')).length,5);
  assert.deepEqual(portById(beam,'technic-hole:0',catalog).position,[-16,0,0]);
  assert.ok(nearly(portById(beam,'center-x',catalog).rotation[1],Math.PI/2));
  const gear={id:'gear',componentId:'gear-16t'};
  assert.ok(graphPorts(gear,catalog).some(p=>p.id==='gear-axis:0'));
  assert.ok(GRAPH_CATALOG_IDS.includes('wheel-medium'));
});

test('input validation rejects missing refs, duplicate joints, bad limits and excessive graphs', () => {
  const graph=create('four-bar');
  const unknown=copy(graph);
  unknown.joints[0].a.portId='never-seen';
  assert.throws(()=>validateConstraintGraph(unknown,catalog),/Unknown port/);
  const duplicate=copy(graph);
  duplicate.joints.push({...duplicate.joints[0],id:'another'});
  assert.throws(()=>validateConstraintGraph(duplicate,catalog),/Duplicate connection/);
  const bad=copy(graph);
  bad.joints[0].limits=[90,-90];
  assert.throws(()=>validateConstraintGraph(bad,catalog),/Invalid joint/);
  const overloaded=copy(graph);
  while(overloaded.bodies.length<=GRAPH_MAX_BODIES) overloaded.bodies.push({
    id:'extra'+overloaded.bodies.length,componentId:'beam-3',pos:[0,0,0],rotation:[0,0,0]
  });
  assert.throws(()=>validateConstraintGraph(overloaded,catalog),/capacity/);
});

test('solver bounds untrusted closed-loop free DoFs to avoid expensive searches', () => {
  const graph=create('four-bar');
  for (let i=0;i<GRAPH_MAX_FREE_JOINTS-2;i++) {
    graph.joints.push({
      id:'extra_'+i,
      kind:'hinge',
      a:{bodyId:'crank',portId:'technic-hole:'+(i%5)},
      b:{bodyId:'coupler',portId:'technic-hole:'+(Math.floor(i/5)+2)},
      value:0,limits:[-170,170],controlled:false
    });
  }
  assert.equal(graph.joints.length,4+GRAPH_MAX_FREE_JOINTS-2);
  assert.throws(()=>solveConstraintGraph(graph,catalog),/at most 12 free joint/);
});

test('versioned JSON import roundtrips graph while rejecting invalid and overconstrained data', () => {
  const graph=create('four-bar');
  const exported=exportConstraintGraph(graph,catalog);
  assert.equal(exported.schemaVersion,1);
  assert.equal(exported.units,'mm');
  assert.deepEqual(importConstraintGraph(exported,catalog),graph);
  assert.throws(()=>importConstraintGraph({...exported,schemaVersion:8},catalog),/unsupported/);
  const tampered=copy(exported);
  tampered.graph.bodies[0].componentId='not-in-catalog';
  assert.throws(()=>importConstraintGraph(tampered,catalog),/Invalid or duplicate/);
  const graphWithInfeasible=copy(exported);
  graphWithInfeasible.graph.joints.forEach(j=>j.controlled=true);
  graphWithInfeasible.graph.joints[3].value=-90;
  assert.throws(()=>importConstraintGraph(graphWithInfeasible,catalog),/closed-loop/);
});

function create(id){
  // Delayed import is avoided in tests; this helper uses an imported factory.
  return createConstraintPreset(id);
}
