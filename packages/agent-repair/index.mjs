import { COMPONENTS } from '../../src/catalog.js';
import { graphPorts, validateConstraintGraph, solveConstraintGraph } from '../../src/constraint-graph.js';
import { createArtifact, sha256 } from '../world-contracts/index.mjs';

const MAX_ATTEMPTS=5;
const editableKinds=new Set(['fixed','hinge','shaft','slider']);

function checkHardRequirements(graph,worldSpec,catalog) {
  const errors=[];
  if(!worldSpec)return errors;
  for(const req of worldSpec.content.requirements){
    if(req.priority!=='hard')continue;
    if(req.property==='wheelCount'){
      const wheels=graph.bodies.filter(b=>catalog.find(c=>c.id===b.componentId)?.type==='wheel').length;
      if(wheels!==req.value)errors.push({code:'HARD_REQUIREMENT_VIOLATED',
        message:'wheelCount='+wheels+', required '+req.value});
    }
  }
  return errors;
}

export function diagnoseGraph(graph,catalog=COMPONENTS,worldSpec=null) {
  try{
    validateConstraintGraph(graph,catalog);
    const hard=checkHardRequirements(graph,worldSpec,catalog);
    if(hard.length)return {valid:false,diagnostics:hard};
    const result=solveConstraintGraph(graph,catalog);
    const diagnostics=[];
    if(!result.valid)diagnostics.push({
      code:'LOOP_NOT_CLOSED',
      message:'Weighted closure residual '+result.closureErrorMm.toFixed(4)+' mm-equivalent'
    });
    for(const collision of result.collisionPairs)diagnostics.push({
      code:'OBB_OVERLAP_WARNING',
      message:collision.bodyA+' may overlap '+collision.bodyB+' (proxy only)'
    });
    return {valid:result.valid,diagnostics,solved:result};
  }catch(error){
    const message=String(error.message||error).slice(0,300);
    const code=/Unknown port/.test(message)?'JOINT_PORT_NOT_FOUND':
      /component/i.test(message)?'COMPONENT_NOT_FOUND':
      /Duplicate connection/.test(message)?'JOINT_DUPLICATE':
      /capacity|limit/i.test(message)?'GRAPH_RESOURCE_LIMIT':
      /Invalid joint/.test(message)?'JOINT_INVALID':
      /Invalid.*body/.test(message)?'BODY_INVALID':'CONSTRAINT_REJECTED';
    return {valid:false,diagnostics:[{code,message}]};
  }
}

// These repairs preserve physical meaning: they only normalize *unambiguous*
// identifiers or numeric serialization, never change counts, dimensions,
// topology, limits, tolerances or solver settings.
export function safeCanonicalRepair(graph,catalog=COMPONENTS) {
  const candidate=structuredClone(graph);
  const changes=[];
  const catalogByLower=new Map(catalog.map(c=>[c.id.toLowerCase(),c.id]));
  for(const body of candidate.bodies||[]) {
    if(typeof body.componentId==='string' &&
       !catalog.some(c=>c.id===body.componentId)) {
      const corrected=catalogByLower.get(body.componentId.toLowerCase());
      if(corrected && corrected!==body.componentId){
        changes.push('componentId:'+body.componentId+'→'+corrected);
        body.componentId=corrected;
      }
    }
    for(const field of ['pos','rotation']){
      if(Array.isArray(body[field])) body[field]=body[field].map(value=>{
        if(typeof value==='string' && value.trim()!=='' &&
           /^-?(?:[0-9]+)(?:\.[0-9]+)?$/.test(value.trim()) &&
           Number.isFinite(Number(value))) {
          changes.push('numeric-encoding:'+body.id+'.'+field);
          return Number(value);
        }
        return value;
      });
    }
  }
  const byId=new Map((candidate.bodies||[]).map(b=>[b.id,b]));
  for(const joint of candidate.joints||[]) {
    if(typeof joint.kind==='string' && !editableKinds.has(joint.kind) &&
       editableKinds.has(joint.kind.toLowerCase())){
      changes.push('joint-kind:'+joint.id);
      joint.kind=joint.kind.toLowerCase();
    }
    for(const endpoint of [joint.a,joint.b]){
      if(!endpoint||typeof endpoint.portId!=='string')continue;
      const body=byId.get(endpoint.bodyId);
      if(!body || !catalog.some(c=>c.id===body.componentId))continue;
      const all=graphPorts(body,catalog).map(p=>p.id);
      if(all.includes(endpoint.portId))continue;
      const matches=all.filter(id=>id.toLowerCase()===endpoint.portId.toLowerCase());
      if(matches.length===1){
        changes.push('port:'+endpoint.bodyId+'/'+endpoint.portId+'→'+matches[0]);
        endpoint.portId=matches[0];
      }
    }
  }
  return {candidate,changes};
}

export function repairGraphWithEvidence(graph,{worldSpec=null,catalog=COMPONENTS,maxAttempts=4,propose}={}) {
  if(!Number.isInteger(maxAttempts)||maxAttempts<0||maxAttempts>MAX_ATTEMPTS)
    throw new Error('INVALID_REPAIR_BUDGET: allowed 0–5 attempts');
  if(!graph || typeof graph!=='object'||Array.isArray(graph))
    throw new Error('INVALID_GRAPH_PROPOSAL');
  const initialHash=sha256(graph);
  let candidate=structuredClone(graph);
  const attempts=[];
  let final;
  for(let attempt=0;attempt<=maxAttempts;attempt++){
    const inspected=diagnoseGraph(candidate,catalog,worldSpec);
    attempts.push({
      attempt,inputHash:sha256(candidate),
      status:inspected.valid?'valid':'invalid',
      diagnostics:inspected.diagnostics.map(d=>({code:d.code,message:d.message}))
    });
    final=inspected;
    if(inspected.valid)break;
    if(attempt===maxAttempts)break;
    let update;
    if(propose){
      // Agents can propose data but may not mutate the validation code;
      // every proposal is rechecked in the next iteration.
      update=propose({attempt,graph:structuredClone(candidate),
        diagnostics:structuredClone(inspected.diagnostics)});
      if(update && typeof update.then==='function')
        throw new Error('ASYNC_PROPOSAL_UNSUPPORTED: use a synchronous proposal callback');
      if(update && typeof update==='object')update={candidate:update,changes:['agent-proposal']};
    }
    if(!update)update=safeCanonicalRepair(candidate,catalog);
    if(!update.changes?.length||sha256(update.candidate)===sha256(candidate))break;
    attempts[attempt].repair=update.changes.join(', ').slice(0,280);
    candidate=structuredClone(update.candidate);
  }
  const outcome=final.valid?'validated':'needs_revision';
  const trace={
    schemaVersion:'repair-trace/v1',kind:'RepairTrace',
    id:'repair_'+initialHash.slice(7,21),initialGraphHash:initialHash,
    finalGraphHash:sha256(candidate),outcome,attempts
  };
  const artifact=createArtifact('RepairTrace','L2',trace,{
    capability:'world.assembly.repair',pluginVersion:'1.0.0'
  });
  return {status:final.valid?'ok':'needs_revision',graph:candidate,
    diagnostics:final.diagnostics,trace:artifact,
    attempts:attempts.length-1,
    solver:final.solved?{
      closureErrorMm:final.solved.closureErrorMm,
      collisionPairs:final.solved.collisionPairs
    }:null};
}
