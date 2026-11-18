import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENTS } from '../src/catalog.js';
import {
  HIERARCHY_SCHEMA_VERSION, HIERARCHY_MAX_NODES, HIERARCHY_MAX_PARTS,
  HIERARCHY_PRESETS, createHierarchyPreset, validateHierarchy, resolveJointAngles,
  evaluateHierarchy, createAssemblySequence, assemblyFrame,
  exportHierarchyRecipe, importHierarchyRecipe
} from '../src/hierarchy-engine.js';

const near = (a,b,epsilon=1e-6) => Math.abs(a-b) <= epsilon;
const distance = (a,b) => Math.hypot(...a.map((v,i)=>v-b[i]));
const deep = value => structuredClone(value);

test('three hierarchical assemblies validate with non-overlapping unique IDs', () => {
  assert.equal(HIERARCHY_SCHEMA_VERSION,1);
  assert.equal(HIERARCHY_PRESETS.length,3);
  assert.equal(HIERARCHY_MAX_NODES,24);
  assert.equal(HIERARCHY_MAX_PARTS,96);
  for(const preset of HIERARCHY_PRESETS) {
    const document = createHierarchyPreset(preset.id);
    const checked = validateHierarchy(document,COMPONENTS);
    const world = evaluateHierarchy(document,COMPONENTS);
    assert.ok(checked.partCount >= 8);
    assert.equal(checked.partCount,world.parts.length);
    assert.equal(world.pivots.length,document.nodes.length-1);
    assert.ok(world.parts.every(p=>p.pos.every(Number.isFinite) && p.rotation.every(Number.isFinite)));
    assert.equal(new Set(world.parts.map(p=>p.instanceId)).size,world.parts.length);
  }
});

test('hinge parent and child anchor coincide in world space at all allowed angles', () => {
  const document=createHierarchyPreset('articulated-crane');
  for(const angles of [{boom:-40,wrist:50},{boom:0,wrist:0},{boom:75,wrist:-90}]) {
    const world=evaluateHierarchy(document,COMPONENTS,angles);
    const parentById=new Map(world.parts.map(p=>[p.instanceId,p]));
    const boom=parentById.get('boom_hinge');
    const base=parentById.get('foundation_hinge');
    assert.ok(distance(boom.pos,base.pos)<1e-6);
    const tip=parentById.get('boom_tip_hinge');
    const wrist=parentById.get('wrist_hinge');
    assert.ok(distance(tip.pos,wrist.pos)<1e-6);
  }
});

test('motion propagates to all descendants but keeps fixed foundation unchanged', () => {
  const document=createHierarchyPreset('articulated-crane');
  const a=evaluateHierarchy(document,COMPONENTS,{boom:10,wrist:0});
  const b=evaluateHierarchy(document,COMPONENTS,{boom:70,wrist:0});
  const get=(f,id)=>f.parts.find(p=>p.instanceId===id).pos;
  assert.ok(distance(get(a,'foundation_beam'),get(b,'foundation_beam'))<1e-7);
  assert.ok(distance(get(a,'wrist_tip'),get(b,'wrist_tip'))>12);
  assert.ok(distance(get(a,'boom_hinge'),get(b,'boom_hinge'))<1e-7);
});

test('couplings propagate signed, mirrored joint angles and disallow conflict', () => {
  for(const id of ['twin-drawbridge','solar-observatory']) {
    const document=createHierarchyPreset(id);
    const driver=id==='twin-drawbridge'?'left_deck':'left_wing';
    const follower=id==='twin-drawbridge'?'right_deck':'right_wing';
    const angles=resolveJointAngles(document,{[driver]:-40});
    assert.equal(angles[driver],-40);
    assert.equal(angles[follower],40);
    const frame=evaluateHierarchy(document,COMPONENTS,{[driver]:-40});
    assert.equal(frame.pivots.length,2);
  }
  const document=createHierarchyPreset('twin-drawbridge');
  const bad=deep(document);
  bad.couplings.push({id:'cycle',driver:'right_deck',driven:'left_deck',ratio:1,offsetDeg:0});
  assert.throws(()=>validateHierarchy(bad,COMPONENTS),/cycle/);
  const beyond=deep(document);
  beyond.couplings[0].ratio=4;
  assert.throws(()=>resolveJointAngles(beyond,{left_deck:-70}),/exceeds/);
});

test('joint motion respects angle limits for manual inputs and fixed joints', () => {
  const document=createHierarchyPreset('articulated-crane');
  const result=resolveJointAngles(document,{boom:150,wrist:-200});
  assert.equal(result.boom,88);
  assert.equal(result.wrist,-100);
  assert.throws(()=>resolveJointAngles(document,{boom:NaN}),/Invalid/);
  const bad=deep(document);
  bad.nodes[1].joint.limitsDeg=[80,-80];
  assert.throws(()=>validateHierarchy(bad,COMPONENTS),/limits/);
  const fixedDoc=deep(document);
  fixedDoc.nodes[2].joint.type='fixed';
  fixedDoc.nodes[2].joint.limitsDeg=[0,0];
  fixedDoc.nodes[2].joint.homeDeg=0;
  assert.equal(resolveJointAngles(fixedDoc,{wrist:25}).wrist,0);
});

test('hierarchy validator rejects missing components, duplicate parts, invalid refs and parent cycles', () => {
  const original=createHierarchyPreset('articulated-crane');
  const duplicate=deep(original);
  duplicate.nodes[1].parts[1].instanceId='foundation_beam';
  assert.throws(()=>validateHierarchy(duplicate,COMPONENTS),/Invalid part/);
  const invalidCatalog=deep(original);
  invalidCatalog.nodes[0].parts[0].componentId='not-in-catalog';
  assert.throws(()=>validateHierarchy(invalidCatalog,COMPONENTS),/Invalid part/);
  const invalidAnchor=deep(original);
  invalidAnchor.nodes[1].joint.parentAnchor.partId='missing_hinge';
  assert.throws(()=>validateHierarchy(invalidAnchor,COMPONENTS),/Missing joint/);
  const missingParent=deep(original);
  missingParent.nodes[1].parentId='not_found';
  assert.throws(()=>validateHierarchy(missingParent,COMPONENTS),/Unknown parent/);
  const cycled=deep(original);
  cycled.nodes[0].parentId='wrist';
  assert.throws(()=>validateHierarchy(cycled,COMPONENTS),/root|cycle/i);
});

test('assembly DAG is complete, deterministic and parent-before-child', () => {
  for(const id of HIERARCHY_PRESETS.map(p=>p.id)) {
    const document=createHierarchyPreset(id);
    const steps=createAssemblySequence(document,COMPONENTS);
    assert.equal(steps.length,document.nodes.reduce((n,node)=>n+node.parts.length,0));
    assert.deepEqual(steps,createAssemblySequence(document,COMPONENTS));
    const unique=new Set();
    for(const step of steps) {
      assert.ok(!unique.has(step.partId));
      unique.add(step.partId);
      assert.ok(step.dependsOn.every(dep=>dep>0&&dep<step.step));
      assert.ok(step.approachOffsetMm.every(Number.isFinite));
      assert.ok(step.componentName && step.componentZh && step.operationZh);
    }
    const first=steps.find(s=>s.nodeId!==document.nodes[0].id);
    assert.ok(first.dependsOn.length>=1);
  }
});

test('drawbridge and solar wings lift upward with mirrored hinge angles', () => {
  const bridge = createHierarchyPreset('twin-drawbridge');
  const folded = evaluateHierarchy(bridge, COMPONENTS, {left_deck: -40});
  const flat = evaluateHierarchy(bridge, COMPONENTS, {left_deck: 0});
  const B = (frame,id) => frame.parts.find(part => part.instanceId === id).pos[1];
  assert.ok(B(folded,'left_road') > B(flat,'left_road'));
  assert.ok(B(folded,'right_road') > B(flat,'right_road'));
  const solar = createHierarchyPreset('solar-observatory');
  const deployed = evaluateHierarchy(solar, COMPONENTS, {left_wing: -40});
  const neutral = evaluateHierarchy(solar, COMPONENTS, {left_wing: 0});
  assert.ok(B(deployed,'left_solar_panel') > B(neutral,'left_solar_panel'));
  assert.ok(B(deployed,'right_solar_panel') > B(neutral,'right_solar_panel'));
});

test('automatic assembly and disassembly share a reversible plan', () => {
  const document=createHierarchyPreset('articulated-crane');
  const empty=assemblyFrame(document,COMPONENTS,{},0);
  const complete=assemblyFrame(document,COMPONENTS,{},1);
  const half=assemblyFrame(document,COMPONENTS,{},0.5);
  assert.equal(empty.visible.filter(p=>p.visible).length,0);
  assert.equal(complete.visible.filter(p=>p.visible).length,complete.parts.length);
  assert.equal(half.steps.length,half.parts.length);
  assert.ok(half.visible.some(p=>p.visible)&&half.visible.some(p=>!p.visible));
  assert.ok(complete.visible.every((p,i)=>distance(p.pos,complete.parts[i].pos)<1e-6));
  assert.deepEqual(assemblyFrame(document,COMPONENTS,{},0.25).visible,
    assemblyFrame(document,COMPONENTS,{},0.25).visible);
});

test('hierarchy JSON recipe roundtrip verifies coupled motion and discards untrusted operation edits', () => {
  const document=createHierarchyPreset('twin-drawbridge');
  const written=exportHierarchyRecipe(document,{left_deck:-35});
  assert.equal(written.schemaVersion,1);
  assert.equal(written.anchorSchemaVersion,1);
  assert.equal(written.units,'mm');
  assert.equal(written.angles.right_deck,35);
  const tampered=deep(written);
  tampered.operations=[{nodeId:'malicious',componentId:'unknown',pos:[999,999,999]}];
  const restored=importHierarchyRecipe(tampered,COMPONENTS);
  assert.deepEqual(restored.angles,written.angles);
  assert.deepEqual(restored.document,document);
  const conflict=deep(written);
  conflict.angles.right_deck=45;
  assert.throws(()=>importHierarchyRecipe(conflict,COMPONENTS),/violates/);
  const invalid=deep(written);
  invalid.angles.injected=10;
  assert.throws(()=>importHierarchyRecipe(invalid,COMPONENTS),/Unknown or invalid/);
  const wrongVersion=deep(written);
  wrongVersion.schemaVersion=99;
  assert.throws(()=>importHierarchyRecipe(wrongVersion,COMPONENTS),/Unsupported/);
});
