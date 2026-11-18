import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENTS } from '../src/catalog.js';
import {
  AGENT_PLAN_SCHEMA_VERSION, AGENT_GENERATOR, AGENT_EXAMPLES,
  interpretBuildRequest, createSixWheelRoverGraph, createAssemblyPlan,
  validateAgentGraph, validateGeneratedPlan, validateExternalGraphProposal
} from '../src/ai-agent.js';
import { graphPorts, solveConstraintGraph } from '../src/constraint-graph.js';

test('natural language intent routing handles Chinese/English rover and exact six-wheel request', () => {
  assert.equal(interpretBuildRequest('搭建一辆六轮火星探测车').intent,'mars-rover');
  assert.equal(interpretBuildRequest('Build a six wheel Mars rover').constraints.wheelCount,6);
  assert.equal(interpretBuildRequest('设计一个四连杆机构').intent,'four-bar');
  assert.equal(interpretBuildRequest('移动滑轨平台').intent,'linear-carriage');
  assert.equal(interpretBuildRequest('轮轴转动装配').intent,'shaft-drive');
  assert.equal(interpretBuildRequest('轴承衬套与轮组').intent,'bearing-wheel');
  assert.equal(interpretBuildRequest('设计一栋建筑').mode,'requirements-only');
  assert.equal(interpretBuildRequest('Build a passenger aircraft').mode,'requirements-only');
  assert.throws(()=>interpretBuildRequest(''),/1–600/);
  assert.throws(()=>interpretBuildRequest('a'.repeat(601)),/1–600/);
  assert.throws(()=>createAssemblyPlan('四轮火星探测车',COMPONENTS),/exactly six wheels/);
});

test('six-wheel Mars rover compiles 10 real component instances and 9 graph constraints', () => {
  const plan=createAssemblyPlan('搭建一辆六轮火星探测车',COMPONENTS);
  assert.equal(plan.schemaVersion,AGENT_PLAN_SCHEMA_VERSION);
  assert.equal(plan.generator,AGENT_GENERATOR);
  assert.equal(plan.status,'kinematic-validated-concept');
  assert.equal(plan.graph.bodies.length,10);
  assert.equal(plan.graph.joints.length,9);
  assert.equal(plan.graph.bodies.filter(b=>b.componentId==='wheel-medium').length,6);
  assert.equal(plan.graph.bodies.filter(b=>b.componentId==='beam-13').length,2);
  assert.equal(plan.graph.bodies.filter(b=>b.componentId==='dome-2x2').length,1);
  assert.equal(plan.graph.bodies.filter(b=>b.grounded).length,1);
  assert.equal(plan.bom.reduce((sum,line)=>sum+line.quantity,0),10);
  assert.equal(plan.verification.solverValid,true);
  assert.deepEqual(plan.verification.collisionPairs,[]);
  assert.equal(plan.verification.connectedComponents,1);
  assert.equal(plan.verification.cycleCount,0);
  assert.equal(plan.assemblySteps.length,10);
});

test('beam mounting face ports align wheel centers outside longitudinal rails', () => {
  const graph=createSixWheelRoverGraph();
  const beam=graph.bodies.find(body=>body.id==='port_rail');
  const ports=graphPorts(beam,COMPONENTS);
  assert.equal(ports.filter(port=>port.id.startsWith('front-hole:')).length,13);
  assert.equal(ports.filter(port=>port.id.startsWith('back-hole:')).length,13);
  const solution=solveConstraintGraph(graph,COMPONENTS);
  assert.equal(solution.valid,true);
  assert.equal(solution.collisionPairs.length,0);
  for(const side of ['port','starboard']){
    for(let n=1;n<=3;n++){
      const wheel=solution.poses['wheel_'+side+'_'+n];
      const rail=solution.poses[side+'_rail'];
      assert.ok(Math.abs(wheel.pos[2])>Math.abs(rail.pos[2])+3);
    }
  }
  assert.ok(Math.abs(solution.poses.wheel_port_2.pos[0])<1e-8);
  assert.ok(Math.abs(solution.poses.wheel_starboard_2.pos[0])<1e-8);
});

test('assembly steps are deterministic, unique and each connection follows its parent', () => {
  const a=createAssemblyPlan('六轮火星探测车',COMPONENTS);
  const b=createAssemblyPlan('六轮火星探测车',COMPONENTS);
  assert.deepEqual(a.graph,b.graph);
  assert.deepEqual(a.assemblySteps,b.assemblySteps);
  assert.equal(new Set(a.assemblySteps.map(s=>s.bodyId)).size,a.assemblySteps.length);
  for(const step of a.assemblySteps){
    assert.ok(step.dependsOn.every(i=>i<step.step));
    assert.ok(step.componentName && step.componentId);
  }
  assert.equal(a.assemblySteps[0].bodyId,'chassis');
});

test('all supported sample prompts yield validated and bounded graphs', () => {
  for(const {prompt} of AGENT_EXAMPLES){
    const result=createAssemblyPlan(prompt,COMPONENTS);
    assert.ok(result.status.includes('concept') || result.status.includes('warnings'));
    assert.ok(result.verification.solverValid);
    assert.ok(result.graph.bodies.length<=20);
    assert.ok(result.graph.joints.length<=32);
    assert.equal(result.bom.reduce((sum,b)=>sum+b.quantity,0),result.graph.bodies.length);
  }
});

test('aircraft/building prompts do not claim structural or flight-safety verification', () => {
  for(const prompt of ['设计一栋200层建筑物','设计可以载客的飞机']){
    const result=createAssemblyPlan(prompt,COMPONENTS);
    assert.equal(result.status,'requirements-only');
    assert.equal(result.graph,null);
    assert.equal(result.verification,null);
    assert.ok(result.nextActions.length>0);
  }
});

test('untrusted generated plan is revalidated with derived BOM and steps', () => {
  const base=createAssemblyPlan('搭建一辆六轮火星探测车',COMPONENTS);
  const adversarial=structuredClone(base);
  adversarial.bom=[];
  adversarial.assemblySteps=[{bodyId:'imposter',operation:'certified'}];
  adversarial.verification={solverValid:true,collisionPairs:[]};
  const safe=validateGeneratedPlan(adversarial,COMPONENTS);
  assert.equal(safe.bom.reduce((sum,b)=>sum+b.quantity,0),10);
  assert.equal(safe.assemblySteps.length,10);
  assert.ok(safe.assemblySteps.every(step=>step.operation!=='certified'));
  const altered=structuredClone(base);
  altered.graph.joints[0].a.bodyId='unknown';
  assert.throws(()=>validateGeneratedPlan(altered,COMPONENTS),/Invalid joint/);
  const obsolete=structuredClone(base);
  obsolete.schemaVersion=99;
  assert.throws(()=>validateGeneratedPlan(obsolete,COMPONENTS),/Invalid agent plan/);
});

test('verification separates closure, nominal fit, broad-phase proxy and NOT_RUN gates', () => {
  const result=validateAgentGraph(createSixWheelRoverGraph(),COMPONENTS);
  assert.deepEqual(result.checklist.map(c=>c.id),[
    'schema','kinematics','nominal-axial-fit','broad-phase-proxy',
    'mesh-contact','insertion-path','manufacturing-fit','dynamics'
  ]);
  const byId=id=>result.checklist.find(c=>c.id===id);
  assert.equal(byId('schema').status,'PASS');
  assert.equal(byId('kinematics').status,'PASS');
  // the rover has no declared coaxial shaft/bore fits -> NOT_APPLICABLE, never a PASS claim
  assert.equal(byId('nominal-axial-fit').status,'NOT_APPLICABLE');
  assert.equal(byId('broad-phase-proxy').status,'PASS');
  // unexecuted engineering gates must stay NOT_RUN
  for(const id of ['mesh-contact','insertion-path','manufacturing-fit','dynamics'])
    assert.equal(byId(id).status,'NOT_RUN',id);
  assert.equal(result.collisionSemantics.authoritative,false);
  assert.equal(result.collisionSemantics.kind,'broad-phase-obb-proxy');
});

test('valid bearing nominal fit is reported as PASS, and the OBB proxy is not a collision', () => {
  const plan=createAssemblyPlan('装配一个轴承衬套、转轴和轮组',COMPONENTS);
  const v=plan.verification;
  assert.equal(v.nominalFit.status,'PASS');
  assert.equal(v.nominalFit.failures.length,0);
  assert.ok(v.nominalFit.interfaces.filter(f=>f.status==='PASS').length>=3);
  // an OBB proxy pair exists, but it is explicitly non-authoritative and never called a collision
  assert.ok(v.collisionPairs.length>=1);
  assert.equal(v.collisionSemantics.authoritative,false);
  assert.equal(plan.capability.collisionAuthoritative,false);
  assert.equal(plan.status,'kinematic-with-proxy-warnings');
  const proxy=v.checklist.find(c=>c.id==='broad-phase-proxy');
  assert.equal(proxy.status,'WARN');
  assert.match(proxy.detail,/broad-phase|coarse/i);
  assert.doesNotMatch(proxy.detail,/interference\b/i);
  assert.ok(v.warnings.some(w=>/broad-phase OBB proxy/i.test(w)));
});

test('an oversized sleeve produces a nominal-fit FAIL that is not hidden', () => {
  const badCatalog=COMPONENTS.map(c=>c.id==='bearing-sleeve-8mm'?{...c,size:[5.1,3.9,7.6]}:c);
  const plan=createAssemblyPlan('装配一个轴承衬套、转轴和轮组',badCatalog);
  assert.equal(plan.verification.nominalFit.status,'FAIL');
  assert.ok(plan.verification.nominalFit.failures.length>=1);
  assert.equal(plan.status,'nominal-fit-interference');
  assert.ok(plan.verification.warnings.some(w=>/Nominal coaxial fit interference/.test(w)));
  assert.equal(plan.verification.checklist.find(c=>c.id==='nominal-axial-fit').status,'FAIL');
});

test('a hole-to-hole hinge linkage declares no shaft fit (NOT_APPLICABLE, never FAIL)', () => {
  const plan=createAssemblyPlan('设计一个能运动的四连杆闭环机构',COMPONENTS);
  const gate=plan.verification.checklist.find(c=>c.id==='nominal-axial-fit');
  assert.equal(gate.status,'NOT_APPLICABLE');
  assert.equal(plan.verification.nominalFit.failures.length,0);
  assert.ok(!plan.status.includes('interference'));
});

test('future model proposal boundary ignores fabricated certification and revalidates graph', () => {
  const source=createAssemblyPlan('六轮火星探测车',COMPONENTS);
  const proposed={
    prompt:'A proposed six-wheel rover',
    graph:source.graph,
    verification:{solverValid:true,manufacturing:'certified'},
    capability:{manufacturing:'certified',flightSafety:true}
  };
  const normalized=validateExternalGraphProposal(proposed,COMPONENTS);
  assert.equal(normalized.generator,'external-json-proposal-revalidated');
  assert.equal(normalized.verification.solverValid,true);
  assert.equal(normalized.capability.manufacturing,'not-certified');
  assert.equal(normalized.verification.checklist.find(c=>c.id==='manufacturing-fit').passed,false);
  const broken=structuredClone(proposed);
  broken.graph.joints[0].b.portId='missing_port';
  assert.throws(()=>validateExternalGraphProposal(broken,COMPONENTS),/Unknown port/);
});
