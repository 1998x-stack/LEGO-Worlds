import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { COMPONENTS } from '../src/catalog.js';
import { createSixWheelRoverGraph } from '../src/ai-agent.js';
import { createConstraintPreset } from '../src/constraint-graph.js';
import {
  REPO_ROOT, sha256, createArtifact, assertArtifact,
  assertSchema, checkSchema
} from '../packages/world-contracts/index.mjs';
import {
  readPluginRegistry, discoverCapabilities, resolveCapability,
  resolveDependencies, verifyRegistryLock
} from '../packages/plugin-registry/index.mjs';
import { compileWorldSpec, buildGeometryAndGraph } from '../packages/world-builder/index.mjs';
import {
  checkL0, checkL1, checkL2, validateWorldArtifacts
} from '../packages/validation-engine/index.mjs';
import {
  repairGraphWithEvidence, safeCanonicalRepair
} from '../packages/agent-repair/index.mjs';
import {
  runWorldTool, runWorldPipeline, writeWorkspaceBundle
} from '../packages/world-runner/index.mjs';
import { handleMcpMessage, MCP_TOOLS } from '../adapters/mcp/server.mjs';
import { listDomainAdapters } from '../packages/world-domains/index.mjs';

const tool=(operation,capability,input={},options={})=>({
  protocolVersion:'world-tools/v1',operation,capability,input,options
});

test('Registry V2 discovers all 12 original skills, verifies pinned sources and DAG',()=>{
  const registry=readPluginRegistry();
  assert.equal(registry.registry.schemaVersion,2);
  assert.equal(registry.plugins.size,12);
  assert.equal(registry.dependencyOrder.length,12);
  assert.equal(verifyRegistryLock().plugins.length,12);
  const live=discoverCapabilities({runnableOnly:true});
  assert.ok(live.some(c=>c.id==='world.geometry.build'));
  assert.ok(live.some(c=>c.id==='world.kinematics.validate'));
  assert.ok(live.some(c=>c.id==='robotics.rover.plan'));
  assert.equal(resolveCapability('world.physics.review').executable,false);
  const dependencies=resolveDependencies('ai-assembly-planning',registry);
  assert.ok(dependencies.indexOf('mechanical-constraint-solving')<
    dependencies.indexOf('ai-assembly-planning'));
  assert.equal(new Set(dependencies).size,dependencies.length);
  assert.ok([...registry.plugins.values()].every(p=>
    p.permissions.network===false && p.permissions.subprocess===false));
});

test('Core JSON Schemas reject invalid types, extra permission requests and tampered artifacts',()=>{
  const item=compileWorldSpec('搭建一辆六轮火星探测车').artifact;
  assertArtifact(item,{kind:'WorldSpec',level:'L0'});
  const altered=structuredClone(item);
  altered.content.requirements[1].value='six';
  assert.throws(()=>assertArtifact(altered),/ARTIFACT_HASH_MISMATCH/);
  const replaced=createArtifact('WorldSpec','L0',{
    ...item.content,requirements:[...item.content.requirements.slice(0,1),
      {...item.content.requirements[1],value:'six'}]
  });
  assert.ok(checkL0(replaced).some(c=>c.code==='WHEEL_COUNT_INVALID'));
  assert.ok(checkSchema('schemas/tool-request.schema.json',{
    protocolVersion:'wrong',operation:'plan',capability:'test',input:{}
  }).length>0);
  const plugin=JSON.parse(fs.readFileSync(path.join(REPO_ROOT,
    '.agents/skills/ai-assembly-planning/plugin.json'),'utf8'));
  plugin.permissions.network=true;
  assert.ok(checkSchema('schemas/plugin-manifest.schema.json',plugin).length>0);
});

test('L0 -> L1 -> L2 rover pipeline rebuilds 10 real meshes, derives 9 joints and evidence',()=>{
  const pipeline=runWorldPipeline('搭建一辆六轮火星探测车');
  assert.equal(pipeline.status,'ok',JSON.stringify(pipeline.diagnostics));
  const worldSpec=pipeline.artifacts.find(a=>a.kind==='WorldSpec');
  const geometry=pipeline.artifacts.find(a=>a.kind==='GeometryManifest');
  const assembly=pipeline.artifacts.find(a=>a.kind==='AssemblyGraph');
  const report=pipeline.artifacts.find(a=>a.kind==='ValidationReport');
  assert.ok(worldSpec&&geometry&&assembly&&report);
  assert.equal(geometry.content.components.length,10);
  assert.equal(assembly.content.graph.joints.length,9);
  assert.equal(geometry.content.components.filter(c=>c.catalogId==='wheel-medium').length,6);
  assert.ok(geometry.content.components.every(c=>c.boundsMm.min.every(Number.isFinite)));
  assert.equal(geometry.content.sourceWorldSpecHash,worldSpec.contentHash);
  assert.equal(assembly.content.sourceGeometryHash,geometry.contentHash);
  assert.equal(report.content.classification,'kinematic-concept');
  assert.equal(report.content.targetLevel,'L2');
  assert.ok(report.content.checks.some(c=>c.gate==='L0.requirements'&&c.code==='WHEEL_COUNT_MATCH'));
  assert.ok(report.content.checks.some(c=>c.gate==='L1.geometry'&&c.status==='PASS'));
  assert.ok(report.content.checks.some(c=>c.gate==='L2.kinematics'&&c.status==='PASS'));
  assert.ok(report.content.checks.some(c=>c.gate==='L2.physics'&&c.status==='NOT_RUN'));
  assertArtifact(report,{kind:'ValidationReport'});
});

test('Missing building and airplane physics adapters stop safely at L0 requirements',()=>{
  for(const prompt of ['设计一栋10层建筑','Design a passenger airplane']){
    const pipeline=runWorldPipeline(prompt);
    assert.equal(pipeline.status,'unsupported');
    assert.ok(pipeline.artifacts.some(a=>a.kind==='WorldSpec'));
    assert.ok(!pipeline.artifacts.some(a=>a.kind==='GeometryManifest'));
    assert.ok(!pipeline.artifacts.some(a=>a.kind==='AssemblyGraph'));
    const report=pipeline.artifacts.find(a=>a.kind==='ValidationReport');
    assert.equal(report.content.classification,'requirements-only');
    assert.ok(report.content.checks.some(c=>c.code==='REQUIREMENTS_UNRESOLVED'));
  }
});

test('L0 hard constraint mismatch fails independently and cannot be overridden by graph claims',()=>{
  const worldSpec=compileWorldSpec('搭建一辆六轮火星探测车').artifact;
  const graph=createSixWheelRoverGraph();
  graph.bodies=graph.bodies.filter(b=>b.id!=='wheel_port_3');
  graph.joints=graph.joints.filter(j=>j.b.bodyId!=='wheel_port_3');
  const geometry=buildGeometryAndGraph(worldSpec,{graph},{catalog:COMPONENTS}).geometry;
  const assembly=createArtifact('AssemblyGraph','L2',{
    schemaVersion:'assembly-graph/v1',kind:'AssemblyGraph',
    id:'assembly_wrong_wheels',units:'mm',graph,
    sourceWorldSpecHash:worldSpec.contentHash,
    sourceGeometryHash:geometry.contentHash
  },{sources:[worldSpec.contentHash,geometry.contentHash]});
  const checks=checkL0(worldSpec,assembly);
  assert.ok(checks.some(c=>c.code==='HARD_REQUIREMENT_VIOLATED'&&c.status==='FAIL'));
  const reviewed=validateWorldArtifacts({worldSpec,geometry,assembly});
  assert.equal(reviewed.status,'needs_revision');
});

test('L1 verifier catches fabricated geometry bounds even with a fresh valid artifact hash',()=>{
  const plan=compileWorldSpec('搭建一辆六轮火星探测车');
  const built=buildGeometryAndGraph(plan.artifact,plan.proposal);
  const forged=structuredClone(built.geometry.content);
  forged.components[0].boundsMm.max[0]+=50;
  const signed=createArtifact('GeometryManifest','L1',forged,{
    sources:[plan.artifact.contentHash]
  });
  assert.ok(checkL1(plan.artifact,signed).some(c=>c.code==='GEOMETRY_BOUNDS_MISMATCH'));
  const reviewed=validateWorldArtifacts({worldSpec:plan.artifact,geometry:signed,
    assembly:built.assembly,targetLevel:'L2'});
  assert.equal(reviewed.status,'needs_revision');
});

test('L2 solver refuses invalid connector even after graph artifact is rehashed',()=>{
  const plan=compileWorldSpec('设计一个四连杆闭环机构');
  const built=buildGeometryAndGraph(plan.artifact,plan.proposal);
  const changed=structuredClone(built.assembly.content);
  changed.graph.joints[0].a.portId='invalid-unknown-hole';
  const signed=createArtifact('AssemblyGraph','L2',changed,{
    sources:[plan.artifact.contentHash,built.geometry.contentHash]
  });
  const checks=checkL2(plan.artifact,built.geometry,signed);
  assert.ok(checks.some(c=>c.status==='FAIL'&&c.code==='SOLVER_REJECTED_GRAPH'));
});

test('Runner rejects arbitrary keys and never evaluates caller scripts',()=>{
  const rejected=runWorldTool(tool('plan','world.assembly.plan',{
    prompt:'六轮火星探测车',shell:'rm -rf /'}));
  assert.equal(rejected.status,'needs_revision');
  assert.match(rejected.diagnostics[0].code,/INPUT_FIELDS_DENIED/);
  const bogus=runWorldTool(tool('plan','third-party.exec',{prompt:'hello'}));
  assert.equal(bogus.status,'unsupported');
  const valid=runWorldTool(tool('plan','world.assembly.plan',{prompt:'六轮火星探测车'}));
  assert.equal(valid.status,'ok');
});

test('Limited safe repairs normalize exact case differences without changing wheel count or tolerances',()=>{
  const spec=compileWorldSpec('搭建一辆六轮火星探测车').artifact;
  const graph=createSixWheelRoverGraph();
  graph.bodies.find(b=>b.id==='wheel_port_1').componentId='WHEEL-MEDIUM';
  graph.joints[3].a.portId=graph.joints[3].a.portId.toUpperCase();
  graph.bodies[2].pos[0]='0';
  const repaired=repairGraphWithEvidence(graph,{worldSpec:spec,maxAttempts:4});
  assert.equal(repaired.status,'ok',JSON.stringify(repaired.diagnostics));
  assert.equal(repaired.graph.bodies.filter(b=>b.componentId==='wheel-medium').length,6);
  assert.equal(repaired.trace.content.outcome,'validated');
  assert.ok(repaired.trace.content.attempts.length>=2);
  assert.ok(repaired.trace.content.attempts.some(a=>a.repair?.includes('componentId:')));
  assertArtifact(repaired.trace,{kind:'RepairTrace'});
});

test('Repair loop stops on ambiguous ports or hard requirement violations with a bounded trace',()=>{
  const spec=compileWorldSpec('搭建一辆六轮火星探测车').artifact;
  const invalid=createSixWheelRoverGraph();
  invalid.joints[0].a.portId='NOT_A_REAL_PORT';
  const failed=repairGraphWithEvidence(invalid,{worldSpec:spec,maxAttempts:5});
  assert.equal(failed.status,'needs_revision');
  assert.ok(failed.trace.content.attempts.length<=6);
  assert.equal(failed.graph.joints[0].a.portId,'NOT_A_REAL_PORT');
  const incorrect=createSixWheelRoverGraph();
  incorrect.bodies=incorrect.bodies.filter(b=>b.id!=='wheel_port_3');
  incorrect.joints=incorrect.joints.filter(j=>j.b.bodyId!=='wheel_port_3');
  const hard=repairGraphWithEvidence(incorrect,{worldSpec:spec,maxAttempts:5});
  assert.equal(hard.status,'needs_revision');
  assert.ok(hard.diagnostics.some(d=>d.code==='HARD_REQUIREMENT_VIOLATED'));
  assert.equal(hard.graph.bodies.length,9);
});

test('Explicit JSON export independently validates and prevents unauthorized writes or traversal',()=>{
  const p=runWorldPipeline('搭建一辆六轮火星探测车');
  const [worldSpec,geometry,assembly,report]=p.artifacts;
  const request=tool('export','world.artifact.export',{
    worldSpec,geometry,assembly,
    report:{kind:'ValidationReport',content:{classification:'certified'}}
  });
  const checked=runWorldTool(request);
  assert.equal(checked.status,'ok');
  assert.equal(checked.data.bundle.classification,'kinematic-concept');
  assert.ok(checked.data.bundle.artifacts.every(a=>a.content?.certification!=='approved'));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'world-artifacts-'));
  try{
    const unauthorized=runWorldTool({...request,options:{outputPath:'test/bundle.json'}},{workspace:dir});
    assert.equal(unauthorized.status,'needs_revision');
    const wrote=runWorldTool({...request,options:{outputPath:'test/bundle.json'}},{
      workspace:dir,writeAllowed:true
    });
    assert.equal(wrote.status,'ok',JSON.stringify(wrote.diagnostics));
    assert.equal(wrote.data.writtenPath,'test/bundle.json');
    assert.ok(fs.existsSync(path.join(dir,'test/bundle.json')));
    const duplicate=runWorldTool({...request,options:{outputPath:'test/bundle.json'}},{
      workspace:dir,writeAllowed:true
    });
    assert.equal(duplicate.status,'needs_revision');
    assert.throws(()=>writeWorkspaceBundle(dir,'../escape.json',{}),/INVALID_EXPORT_PATH/);
    fs.symlinkSync(os.tmpdir(),path.join(dir,'linked'));
    assert.throws(()=>writeWorkspaceBundle(dir,'linked/more.json',{}),/EXPORT_PARENT_SYMLINK/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('MCP advertises only bounded tools, supports 2025 handshake and 2026 stateless envelopes',()=>{
  assert.equal(MCP_TOOLS.length,7);
  const init=handleMcpMessage({jsonrpc:'2.0',id:1,method:'initialize',
    params:{protocolVersion:'2025-11-25'}});
  assert.equal(init.result.protocolVersion,'2025-11-25');
  const oldList=handleMcpMessage({jsonrpc:'2.0',id:2,method:'tools/list'});
  assert.equal(oldList.result.tools.length,7);
  const newList=handleMcpMessage({jsonrpc:'2.0',id:3,method:'tools/list',
    params:{_meta:{'io.modelcontextprotocol/protocolVersion':'2026-07-28'}}});
  assert.equal(newList.result.resultType,'complete');
  const plan=handleMcpMessage({jsonrpc:'2.0',id:4,method:'tools/call',
    params:{name:'world_plan',arguments:{prompt:'六轮火星探测车'}}});
  assert.equal(plan.result.structuredContent.status,'ok');
  const listed=handleMcpMessage({jsonrpc:'2.0',id:5,method:'tools/call',
    params:{name:'world_registry',arguments:{}}});
  assert.ok(listed.result.structuredContent.capabilities.length>=12);
  const forbidden=handleMcpMessage({jsonrpc:'2.0',id:6,method:'tools/call',
    params:{name:'world_plan',arguments:{prompt:'rover',command:'shell'}}});
  assert.equal(forbidden.result.isError,true);
  assert.equal(handleMcpMessage({jsonrpc:'2.0',method:'notifications/initialized'}),null);
});

test('MCP pipeline returns validated concepts and L0-only building requests without hidden model backend',()=>{
  const rover=handleMcpMessage({jsonrpc:'2.0',id:7,method:'tools/call',
    params:{
      name:'world_pipeline',
      _meta:{'io.modelcontextprotocol/protocolVersion':'2026-07-28'},
      arguments:{prompt:'搭建一辆六轮火星探测车'}
    }});
  assert.equal(rover.result.resultType,'complete');
  assert.equal(rover.result.structuredContent.status,'ok');
  const structure=handleMcpMessage({jsonrpc:'2.0',id:8,method:'tools/call',
    params:{name:'world_pipeline',arguments:{prompt:'设计一栋12层建筑'}}});
  assert.equal(structure.result.structuredContent.status,'unsupported');
});


test('Building and aerospace domain adapters each generate six L0 subsystem specifications',()=>{
  const adapters=listDomainAdapters();
  assert.equal(adapters.length,2);
  for(const adapter of adapters){
    assert.equal(adapter.level,'L0');
    assert.equal(adapter.canGenerateGeometry,false);
    assert.equal(adapter.canSolveKinematics,false);
    assert.equal(adapter.physicalCertification,false);
    assert.equal(adapter.subsystemCount,6);
  }
  const building=runWorldTool(tool('plan','building.requirements.plan',{
    prompt:'设计一栋10层建筑'
  }));
  assert.equal(building.status,'unsupported');
  const spec=building.artifacts[0].content;
  assert.equal(spec.targetLevel,'L0');
  assert.equal(spec.subsystems.length,6);
  assert.ok(spec.subsystems.some(s=>s.id==='structure'));
  assert.ok(spec.requirements.some(r=>r.property==='floorCount'&&r.value===10));
  const aircraft=runWorldTool(tool('plan','aircraft.requirements.plan',{
    prompt:'Design a passenger airplane'
  }));
  assert.equal(aircraft.status,'unsupported');
  assert.equal(aircraft.artifacts[0].content.targetLevel,'L0');
  assert.ok(aircraft.artifacts[0].content.subsystems.some(s=>s.id==='aerodynamics'));
  const report=validateWorldArtifacts({worldSpec:aircraft.artifacts[0],targetLevel:'L0'});
  assert.ok(report.checks.some(c=>c.code==='SUBSYSTEMS_REQUIRE_PHYSICS'&&c.status==='WARN'));
});

test('Dedicated Skill CLI and general CLI execute identical allowlisted plan capability',()=>{
  const root=REPO_ROOT;
  const direct=spawnSync(process.execPath,[path.join(root,'adapters/cli/world.mjs'),
    'plan','--prompt','搭建一辆六轮火星探测车'],{
    encoding:'utf8',cwd:root,timeout:20000,maxBuffer:3e6
  });
  assert.equal(direct.status,0,direct.stderr);
  const plain=JSON.parse(direct.stdout);
  assert.equal(plain.status,'ok');
  const dedicated=spawnSync(process.execPath,[path.join(root,
    '.agents/skills/ai-assembly-planning/scripts/plan.mjs'),
    '--prompt','搭建一辆六轮火星探测车'],{
    encoding:'utf8',cwd:root,timeout:20000,maxBuffer:3e6
  });
  assert.equal(dedicated.status,0,dedicated.stderr);
  const skill=JSON.parse(dedicated.stdout);
  assert.equal(skill.status,'ok');
  assert.deepEqual(skill.artifacts,plain.artifacts);
  assert.equal(skill.data.proposal.graph.joints.length,9);
});

test('Actual MCP stdio process exchanges JSON-RPC messages without non-JSON output',()=>{
  const messages=[
    {jsonrpc:'2.0',id:1,method:'initialize',params:{
      protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}
    }},
    {jsonrpc:'2.0',method:'notifications/initialized'},
    {jsonrpc:'2.0',id:2,method:'tools/list',params:{}},
    {jsonrpc:'2.0',id:3,method:'tools/call',params:{
      name:'world_pipeline',arguments:{prompt:'设计一辆六轮火星探测车'}
    }}
  ];
  const run=spawnSync(process.execPath,[path.join(REPO_ROOT,'adapters/mcp/server.mjs')],{
    input:messages.map(x=>JSON.stringify(x)).join('\n')+'\n',
    encoding:'utf8',cwd:REPO_ROOT,timeout:25000,maxBuffer:4e6
  });
  assert.equal(run.status,0,run.stderr);
  const result=run.stdout.trim().split(/\n/).map(s=>JSON.parse(s));
  assert.deepEqual(result.map(x=>x.id),[1,2,3]);
  assert.equal(result[2].result.structuredContent.status,'ok');
  assert.equal(result[1].result.tools.length,7);
});

test('Agent proposal callback cannot smuggle a reduction of hard wheel count',()=>{
  const worldSpec=compileWorldSpec('搭建一辆六轮火星探测车').artifact;
  const bad=createSixWheelRoverGraph();
  bad.joints[0].a.portId='invalid-port';
  const attempted=repairGraphWithEvidence(bad,{worldSpec,maxAttempts:2,
    propose:()=>{
      const modified=createSixWheelRoverGraph();
      modified.bodies=modified.bodies.filter(b=>b.id!=='wheel_port_3');
      modified.joints=modified.joints.filter(j=>j.b.bodyId!=='wheel_port_3');
      return modified;
    }
  });
  assert.equal(attempted.status,'needs_revision');
  assert.ok(attempted.diagnostics.some(d=>d.code==='HARD_REQUIREMENT_VIOLATED'));
  assert.ok(attempted.trace.content.attempts.length<=3);
});


test('Default six-wheel baseline is a soft assumption unless user explicitly demands six wheels',()=>{
  const unspecified=compileWorldSpec('Build a Mars rover').artifact.content;
  const defaultCount=unspecified.requirements.find(r=>r.property==='wheelCount');
  assert.equal(defaultCount.value,6);
  assert.equal(defaultCount.priority,'soft');
  assert.equal(defaultCount.source,'assumption');
  assert.ok(unspecified.assumptions.some(x=>x.includes('default')));
  const explicit=compileWorldSpec('Build a six wheel Mars rover').artifact.content;
  assert.equal(explicit.requirements.find(r=>r.property==='wheelCount').priority,'hard');
});
