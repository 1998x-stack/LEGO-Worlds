import fs from 'node:fs';
import path from 'node:path';
import { COMPONENTS } from '../../src/catalog.js';
import { compileWorldSpec, buildGeometryAndGraph } from '../world-builder/index.mjs';
import { validateWorldArtifacts } from '../validation-engine/index.mjs';
import { repairGraphWithEvidence } from '../agent-repair/index.mjs';
import { resolveCapability, verifyRegistryLock } from '../plugin-registry/index.mjs';
import { assertArtifact, assertSchema, normalizeDiagnostics, sha256, CONTRACT_VERSION } from '../world-contracts/index.mjs';

const allow={
  plan:['prompt'],
  build:['worldSpec','proposal'],
  validate:['worldSpec','geometry','assembly'],
  repair:['graph','worldSpec'],
  export:['worldSpec','geometry','assembly','report']
};
const optionsAllowed={
  plan:['targetLevel'],
  build:[],
  validate:['targetLevel','maxIterations'],
  repair:['maxAttempts'],
  export:['targetLevel','outputPath']
};
const handlers={
  'world.assembly.plan':'plan',
  'world.requirements.plan':'plan',
  'robotics.rover.plan':'plan',
  'building.requirements.plan':'plan',
  'aircraft.requirements.plan':'plan',
  'world.geometry.build':'build',
  'world.kinematics.validate':'validate',
  'world.assembly.repair':'repair',
  'world.artifact.export':'export'
};

function result(capability,status,artifacts=[],data={},diagnostics=[],runId) {
  const response={
    protocolVersion:CONTRACT_VERSION,
    ...(runId?{runId}:{}),capability,status,artifacts,
    diagnostics:normalizeDiagnostics(diagnostics),
    data
  };
  assertSchema('schemas/tool-result.schema.json',response);
  return response;
}

function fail(capability,error,runId) {
  const message=String(error?.message||error).slice(0,300);
  const code=/^([A-Z][A-Z0-9_]+):/.exec(message)?.[1]||'RUNNER_EXECUTION_FAILED';
  return result(capability,'needs_revision',[],{},[{
    code,severity:'error',message,repairable:/PORT|GEOMETRY|JOINT|GRAPH|REQUIREMENT/.test(code)
  }],runId);
}

function rejectExtra(fields,allowed,type) {
  for(const key of Object.keys(fields||{}))
    if(!allowed.includes(key))throw new Error('INPUT_FIELDS_DENIED: '+type+'.'+key);
}

export function runWorldTool(request,{workspace=null,writeAllowed=false,catalog=COMPONENTS}={}) {
  const cap=request?.capability||'unknown';
  const runId=request?.runId;
  try {
    assertSchema('schemas/tool-request.schema.json',request);
    if(!handlers[cap] || handlers[cap]!==request.operation)
      throw new Error('CAPABILITY_NOT_EXECUTABLE: '+cap+' for '+request.operation);
    verifyRegistryLock();
    const resolved=resolveCapability(cap);
    if(!resolved.executable||resolved.plugin.execution.mode!=='builtin')
      return result(cap,'unsupported',[],{},[{
        code:'CAPABILITY_GUIDANCE_ONLY',severity:'error',
        message:'This Skill describes a workflow but has no authorized execution adapter'
      }],runId);
    rejectExtra(request.input,allow[request.operation],request.operation);
    rejectExtra(request.options||{},optionsAllowed[request.operation],request.operation);
    const input=request.input,options=request.options||{};
    if(request.operation==='plan'){
      const text=input.prompt;
      const {artifact,proposal,request:parsed}=compileWorldSpec(text,{
        targetLevel:parsedLevel(options.targetLevel,parsedFallbackLevel(text))
      });
      const domains={
        'robotics.rover.plan':'robotics',
        'building.requirements.plan':'built-environment',
        'aircraft.requirements.plan':'aerospace'
      };
      if(domains[cap] && domains[cap]!==parsed.domain)
        return result(cap,'unsupported',[artifact],{request:parsed},[{
          code:'CAPABILITY_DOMAIN_MISMATCH',severity:'error',
          message:'Selected planner is for '+domains[cap]+' not '+parsed.domain
        }],runId);
      const pending=parsed.mode!=='template-grounded';
      const diagnostics=pending?[{
        code:'DOMAIN_ENGINE_UNAVAILABLE',severity:'warning',
        message:'L0 requirements captured; no reviewed geometry/kinematic blueprint for this domain'
      }]:[];
      return result(cap,pending?'unsupported':'ok',[artifact],{
        request:parsed,proposal,requiredLevel:artifact.content.targetLevel
      },diagnostics,runId);
    }
    if(request.operation==='build'){
      const worldSpec=assertArtifact(input.worldSpec,{kind:'WorldSpec'});
      const built=buildGeometryAndGraph(worldSpec,input.proposal,{catalog});
      return result(cap,'ok',[built.geometry,built.assembly],{
        solverPreview:built.solverPreview,
        warning:'Geometry built from procedural references; L2 candidate has not yet passed independent validation'
      },[],runId);
    }
    if(request.operation==='validate'){
      const worldSpec=assertArtifact(input.worldSpec,{kind:'WorldSpec'});
      const level=parsedLevel(options.targetLevel,worldSpec.content.targetLevel);
      const reviewed=validateWorldArtifacts({
        worldSpec,geometry:input.geometry,assembly:input.assembly,
        targetLevel:level,catalog,maxIterations:options.maxIterations
      });
      return result(cap,reviewed.status,[reviewed.artifact],{
        summary:reviewed.summary
      },reviewed.checks.filter(c=>c.status==='FAIL').map(c=>({
        code:c.code,severity:'error',message:c.message,repairable:true
      })),runId);
    }
    if(request.operation==='repair'){
      const worldSpec=input.worldSpec
        ? assertArtifact(input.worldSpec,{kind:'WorldSpec'}):null;
      const repaired=repairGraphWithEvidence(input.graph,{
        worldSpec,catalog,maxAttempts:options.maxAttempts??4
      });
      return result(cap,repaired.status,[repaired.trace],{
        graph:repaired.graph,solver:repaired.solver,attempts:repaired.attempts
      },repaired.diagnostics.map(d=>({
        code:d.code,severity:d.code==='OBB_OVERLAP_WARNING'?'warning':'error',
        message:d.message,repairable:d.code!=='HARD_REQUIREMENT_VIOLATED'
      })),runId);
    }
    if(request.operation==='export'){
      const worldSpec=assertArtifact(input.worldSpec,{kind:'WorldSpec'});
      const level=parsedLevel(options.targetLevel,
        input.assembly?'L2':input.geometry?'L1':'L0');
      // Ignore all user-supplied 'report' claims, recompute the report.
      const verified=validateWorldArtifacts({
        worldSpec,geometry:input.geometry,assembly:input.assembly,
        targetLevel:level,catalog
      });
      if(verified.status!=='ok')
        return result(cap,'needs_revision',[verified.artifact],{
          summary:verified.summary
        },verified.checks.filter(c=>c.status==='FAIL').map(c=>({
          code:c.code,severity:'error',message:c.message
        })),runId);
      const artifacts=[worldSpec,...[input.geometry,input.assembly].filter(Boolean),verified.artifact];
      const bundle={
        format:'world-bundle/v1',
        classification:verified.summary.classification,
        artifacts,
        bundleHash:sha256(artifacts.map(a=>a.contentHash))
      };
      let location=null;
      if(options.outputPath){
        if(!writeAllowed||!workspace)
          throw new Error('FILE_WRITE_NOT_AUTHORIZED: require explicit workspace and --allow-write');
        location=writeWorkspaceBundle(workspace,options.outputPath,bundle);
      }
      return result(cap,'ok',[verified.artifact],{
        bundle, ...(location?{writtenPath:location}:{})
      },verified.checks.filter(c=>c.status==='WARN').map(c=>({
        code:c.code,severity:'warning',message:c.message
      })),runId);
    }
    throw new Error('OPERATION_NOT_SUPPORTED');
  }catch(error){return fail(cap,error,runId);}
}

function parsedFallbackLevel(prompt) {
  // A supported request can target L2; buildings/aircraft are explicitly L0-only.
  const value=String(prompt||'');
  return /(?:建筑|大楼|楼房|楼宇|飞机|客机|飞行器|building|aircraft|airplane)/i.test(value)
    ?'L0':'L2';
}
function parsedLevel(input,fallback){
  const level=input===undefined?fallback:input;
  if(!['L0','L1','L2'].includes(level))throw new Error('INVALID_TARGET_LEVEL');
  return level;
}

export function writeWorkspaceBundle(workspace,outputPath,bundle) {
  if(typeof outputPath!=='string'||outputPath.length>160 ||
      path.isAbsolute(outputPath)||outputPath.includes('\\') ||
      outputPath.split('/').some(part=>part==='..'||part===''||part==='.') ||
      !/^[a-zA-Z0-9/_-]+\.json$/.test(outputPath))
    throw new Error('INVALID_EXPORT_PATH: relative .json within an existing workspace only');
  const canonicalRoot=fs.realpathSync(workspace);
  const destination=path.resolve(canonicalRoot,outputPath);
  if(!destination.startsWith(canonicalRoot+path.sep))
    throw new Error('EXPORT_PATH_TRAVERSAL');
  // Caller creates the workspace. Refuse symlinked parents and overwrites.
  let cursor=path.dirname(destination);
  const pending=[];
  while(cursor!==canonicalRoot&&!fs.existsSync(cursor)){
    pending.push(cursor);cursor=path.dirname(cursor);
  }
  if(cursor!==canonicalRoot){
    const stat=fs.lstatSync(cursor);
    if(stat.isSymbolicLink()||!stat.isDirectory())
      throw new Error('EXPORT_PARENT_UNSAFE');
  }
  for(const dir of pending.reverse())fs.mkdirSync(dir,{mode:0o700});
  cursor=path.dirname(destination);
  while(cursor!==canonicalRoot){
    const stat=fs.lstatSync(cursor);
    if(stat.isSymbolicLink())throw new Error('EXPORT_PARENT_SYMLINK');
    cursor=path.dirname(cursor);
  }
  if(fs.existsSync(destination))throw new Error('EXPORT_NO_OVERWRITE');
  fs.writeFileSync(destination,JSON.stringify(bundle,null,2)+'\n',{flag:'wx',mode:0o600});
  return path.relative(canonicalRoot,destination);
}

export function runWorldPipeline(prompt,{catalog=COMPONENTS,targetLevel='L2'}={}) {
  const plan=runWorldTool({
    protocolVersion:CONTRACT_VERSION,operation:'plan',capability:'world.assembly.plan',
    input:{prompt},options:{targetLevel}
  },{catalog});
  const worldSpec=plan.artifacts.find(a=>a.kind==='WorldSpec');
  if(!worldSpec)return {status:plan.status,steps:{plan},artifacts:[],diagnostics:plan.diagnostics};
  if(!plan.data.proposal?.graph){
    const validation=runWorldTool({
      protocolVersion:CONTRACT_VERSION,operation:'validate',capability:'world.kinematics.validate',
      input:{worldSpec},options:{targetLevel:'L0'}
    },{catalog});
    return {status:'unsupported',steps:{plan,validation},
      artifacts:[worldSpec,...validation.artifacts],
      diagnostics:[...plan.diagnostics,...validation.diagnostics]};
  }
  const build=runWorldTool({
    protocolVersion:CONTRACT_VERSION,operation:'build',capability:'world.geometry.build',
    input:{worldSpec,proposal:plan.data.proposal}
  },{catalog});
  if(build.status!=='ok')return {status:build.status,steps:{plan,build},
    artifacts:[worldSpec],diagnostics:build.diagnostics};
  const geometry=build.artifacts.find(a=>a.kind==='GeometryManifest');
  const assembly=build.artifacts.find(a=>a.kind==='AssemblyGraph');
  const validation=runWorldTool({
    protocolVersion:CONTRACT_VERSION,operation:'validate',capability:'world.kinematics.validate',
    input:{worldSpec,geometry,assembly},options:{targetLevel}
  },{catalog});
  return {
    status:validation.status,steps:{plan,build,validation},
    artifacts:[worldSpec,geometry,assembly,...validation.artifacts],
    diagnostics:validation.diagnostics,
    summary:validation.data.summary
  };
}
