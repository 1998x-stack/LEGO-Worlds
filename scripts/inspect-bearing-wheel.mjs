#!/usr/bin/env node
import { compileWorldSpec, buildGeometryAndGraph } from '../packages/world-builder/index.mjs';
import { runWorldTool } from '../packages/world-runner/index.mjs';

const blocked=process.argv.includes('--blocked');
if(process.argv.slice(2).some(s=>s!=='--blocked')){
  console.error('Usage: node scripts/inspect-bearing-wheel.mjs [--blocked]');
  process.exit(1);
}
const prompt='装配一个轴承衬套、转轴和轮组';
const plan=compileWorldSpec(prompt);
const built=buildGeometryAndGraph(plan.artifact,plan.proposal);
const request={
  protocolVersion:'world-tools/v1',
  operation:'validate',capability:'world.kinematics.validate',
  input:{worldSpec:plan.artifact,geometry:built.geometry,assembly:built.assembly},
  options:{targetLevel:'L2',clearance:{
    mesh:true,
    path:{
      movingBodyId:'axle',
      installedBodyIds:['support','sleeve'],
      fromOffsetMm:blocked?[4.5,0,35]:[0,0,35],
      samples:12
    }
  }}
};
const result=runWorldTool(request);
const report=result.artifacts[0]?.content;
process.stdout.write(JSON.stringify({
  example:'bearing-wheel',blockedExpected:blocked,
  status:result.status,
  components:built.geometry.content.components.length,
  joints:built.assembly.content.graph.joints.length,
  checks:report?.checks||[],summary:result.data.summary,
  diagnostics:result.diagnostics
},null,2)+'\n');
const expected=blocked?'needs_revision':'ok';
if(result.status!==expected)process.exitCode=1;
else if(blocked)process.exitCode=2;
