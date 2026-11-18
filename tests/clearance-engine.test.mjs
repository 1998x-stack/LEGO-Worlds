import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { COMPONENTS } from '../src/catalog.js';
import { createPart } from '../src/brick-system.js';
import { getPartAnchors } from '../src/connection-anchors.js';
import { createConstraintPreset, solveConstraintGraph } from '../src/constraint-graph.js';
import {
  CLEARANCE_ENGINE_VERSION, inspectMeshPair, inspectGraphMeshContacts,
  inspectInsertionPath, reviewNominalAxialInterfaces
} from '../packages/clearance-engine/index.mjs';

const catalog=COMPONENTS;
const part=id=>catalog.find(c=>c.id===id);
const graph=()=>createConstraintPreset('bearing-wheel');
const solve=g=>solveConstraintGraph(g,catalog);

test('modeled sleeve is genuinely hollow through Z and has independently named outer/bore anchors',()=>{
  assert.equal(CLEARANCE_ENGINE_VERSION,1);
  const bearing=part('bearing-sleeve-8mm');
  assert.ok(bearing);
  const anchors=getPartAnchors(bearing);
  assert.ok(anchors.some(a=>a.kind==='bearing-outer'));
  assert.ok(anchors.some(a=>a.kind==='bearing-bore'));
  const root=createPart(bearing);
  const center=new THREE.Raycaster(new THREE.Vector3(0,0,-20),new THREE.Vector3(0,0,1));
  const wall=new THREE.Raycaster(new THREE.Vector3(2.15,0,-20),new THREE.Vector3(0,0,1));
  const centerHits=center.intersectObjects(root.children,true);
  const wallHits=wall.intersectObjects(root.children,true);
  assert.equal(centerHits.length,0,'center Z channel must be open');
  assert.ok(wallHits.length>0,'bearing wall must be solid');
  root.traverse(obj=>{obj.geometry?.dispose();obj.material?.dispose();});
});

test('real modeled bearing/beam/shaft/wheel have valid finite nominal radial and axial engagements',()=>{
  const g=graph(),s=solve(g);
  assert.equal(s.valid,true);
  const fits=reviewNominalAxialInterfaces(g,s.poses,catalog);
  assert.equal(fits.length,3);
  assert.deepEqual(fits.map(f=>f.status),['PASS','PASS','PASS']);
  assert.ok(fits.every(f=>f.axialOverlapMm>1&&f.clearanceMm>=0));
  assert.ok(fits.every(f=>f.measuredFit===false));
  assert.ok(fits.some(f=>f.female==='bearing-bore'));
  assert.ok(fits.some(f=>f.female==='wheel-through-bore'));
});

test('nominal radial check rejects oversized sleeve and missing overlap without weakening tolerance',()=>{
  const g=graph();
  const badCatalog=catalog.map(c=>c.id==='bearing-sleeve-8mm'?
    {...c,size:[5.1,3.9,7.6]}:c);
  const solved=solveConstraintGraph(g,badCatalog);
  const fits=reviewNominalAxialInterfaces(g,solved.poses,badCatalog);
  assert.ok(fits.some(f=>f.jointId==='sleeve_mount'&&
    f.status==='FAIL'&&f.clearanceMm<0));
});

test('mesh narrow-phase clears conservative OBB false-positive for real axle in a beam bore',()=>{
  const g=graph(),solved=solve(g);
  assert.ok(solved.collisionPairs.some(p=>
    p.bodyA==='support'&&p.bodyB==='axle'));
  const report=inspectGraphMeshContacts(g,solved.poses,catalog);
  assert.equal(report.incomplete,false);
  assert.ok(report.broadPhaseCandidates>=1);
  assert.ok(report.clearedCandidates>=1);
  assert.ok(!report.contacts.some(p=>p.bodyA==='support'&&p.bodyB==='axle'),
    JSON.stringify(report.contacts));
});

test('triangle candidate check distinguishes separated parts from visibly intersecting solids',()=>{
  const box=part('brick-2x4');
  const identity={pos:[0,0,0],rotation:[0,0,0]};
  const separated=inspectMeshPair(box,identity,box,{pos:[100,0,0],rotation:[0,0,0]});
  assert.equal(separated.interference,false);
  const overlapping=inspectMeshPair(box,identity,box,{pos:[5,0,0],rotation:[0,0,0]});
  assert.equal(overlapping.interference,true,JSON.stringify(overlapping));
});

test('sampled straight insertion of axle clears installed beam and sleeve at nominal alignment',()=>{
  const g=graph(),solved=solve(g);
  const r=inspectInsertionPath(g,solved.poses,catalog,{
    movingBodyId:'axle',installedBodyIds:['support','sleeve'],
    fromOffsetMm:[0,0,35],samples:10
  });
  assert.equal(r.status,'sampled-clear',JSON.stringify(r));
  assert.equal(r.testedSamples,11);
});

test('off-axis axle insertion is blocked by beam material',()=>{
  const g=graph(),solved=solve(g);
  const r=inspectInsertionPath(g,solved.poses,catalog,{
    movingBodyId:'axle',installedBodyIds:['support','sleeve'],
    fromOffsetMm:[4.5,0,35],samples:12
  });
  assert.equal(r.status,'blocked',JSON.stringify(r));
  assert.ok(r.sampleIndex>=0);
  assert.ok(['support','sleeve'].includes(r.hitBodyId));
});

test('path scanner rejects unbounded or invalid body references',()=>{
  const g=graph(),solved=solve(g);
  for(const request of [
    {movingBodyId:'axle',installedBodyIds:['support'],fromOffsetMm:[0,0,20],samples:100},
    {movingBodyId:'axle',installedBodyIds:['unknown'],fromOffsetMm:[0,0,20],samples:12},
    {movingBodyId:'axle',installedBodyIds:['axle'],fromOffsetMm:[0,0,20],samples:12}
  ]){
    assert.throws(()=>inspectInsertionPath(g,solved.poses,catalog,request),
      /CLEARANCE_INPUT_INVALID/);
  }
});
