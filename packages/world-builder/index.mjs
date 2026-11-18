import * as THREE from 'three';
import { COMPONENTS } from '../../src/catalog.js';
import { createPart } from '../../src/brick-system.js';
import { graphPorts, solveConstraintGraph, validateConstraintGraph } from '../../src/constraint-graph.js';
import { interpretBuildRequest, createAssemblyPlan } from '../../src/ai-agent.js';
import { createArtifact, assertArtifact, sha256 } from '../world-contracts/index.mjs';
import { domainL0Systems } from '../world-domains/index.mjs';

function diagnosticPrompt(prompt) {
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>600)
    throw new Error('INVALID_PROMPT: enter 1–600 characters');
  return prompt.trim().replace(/\s+/g,' ');
}

export function compileWorldSpec(raw,{targetLevel='L2'}={}) {
  const prompt=diagnosticPrompt(raw);
  const request=interpretBuildRequest(prompt);
  const requirements=[{
    id:'REQ_design',property:'designIntent',operator:'describe',
    value:prompt,unit:'text',priority:'hard',source:'user'
  }];
  if(request.intent==='mars-rover') requirements.push({
    id:'REQ_wheels',property:'wheelCount',operator:'eq',
    value:request.constraints.wheelCount,unit:'count',priority:'hard',source:'user'
  });
  if(request.domain==='built-environment') {
    const match=prompt.match(/([1-9][0-9]{0,3})\s*(?:层|[- ]?storey|[- ]?story|[- ]?floor)/i);
    if(match) requirements.push({
      id:'REQ_floors',property:'floorCount',operator:'eq',
      value:Number(match[1]),unit:'count',priority:'hard',source:'user'
    });
  }
  const unresolved=request.domain==='aerospace'
    ? ['Aircraft operating envelope and purpose','Loads, materials, control and aerodynamics evidence','Qualified airworthiness review']
    : request.domain==='built-environment'
      ? ['Site jurisdiction, occupancy and material specifications','Structural, seismic/wind and fire/egress studies','Qualified code and safety review']
      : request.mode==='template-grounded'
        ? ['Physical mating tolerances and mechanical load ratings','Motion-envelope CCD, dynamics and material properties']
        : ['Unrecognized design grammar: choose a supported plugin or clarify requirements'];
  const assumptions=request.intent==='mars-rover'
    ? ['Wheel joints are virtual bearing datums, not functional axles or suspension']
    : [];
  const domain=domainL0Systems(request.domain);
  for(const required of domain.unresolved)if(!unresolved.includes(required))unresolved.push(required);
  const effectiveLevel=request.mode==='template-grounded'?targetLevel:'L0';
  const worldSpec={
    schemaVersion:'world-spec/v1',kind:'WorldSpec',id:'spec_'+sha256(prompt).slice(7,19),
    domain:request.domain,prompt,targetLevel:effectiveLevel,
    requirements,assumptions,unresolved,subsystems:domain.subsystems,
    provenance:{generator:'deterministic-local-planner',source:'user'}
  };
  const artifact=createArtifact('WorldSpec','L0',worldSpec,{
    capability:'world.assembly.plan',pluginVersion:'1.0.0'
  });
  let proposal=null;
  if(request.mode==='template-grounded')proposal=createAssemblyPlan(prompt,COMPONENTS);
  return {artifact,proposal,request};
}

function disposePart(root) {
  root.traverse(node=>{
    node.geometry?.dispose();
    if(node.material){
      const materials=Array.isArray(node.material)?node.material:[node.material];
      for(const material of materials)material.dispose();
    }
  });
}

export function buildGeometryAndGraph(worldSpecArtifact,proposal,{catalog=COMPONENTS}={}) {
  assertArtifact(worldSpecArtifact,{kind:'WorldSpec',level:'L0'});
  if(!proposal?.graph)throw new Error('UNSUPPORTED_GEOMETRY: request has no checked assembly proposal');
  const graph=structuredClone(proposal.graph);
  validateConstraintGraph(graph,catalog);
  const solved=solveConstraintGraph(graph,catalog);
  if(!solved.valid)throw new Error('LOOP_NOT_CLOSED: '+solved.closureErrorMm.toFixed(4)+' weighted mm');
  const byId=new Map(catalog.map(component=>[component.id,component]));
  const components=[];
  for(const body of graph.bodies){
    const component=byId.get(body.componentId);
    if(!component)throw new Error('COMPONENT_NOT_FOUND: '+body.componentId);
    const mesh=createPart({...component,pos:[0,0,0],rotation:[0,0,0]});
    try {
      const bounds=new THREE.Box3().setFromObject(mesh);
      if(bounds.isEmpty()||[...bounds.min,...bounds.max].some(n=>!Number.isFinite(n)))
        throw new Error('GEOMETRY_INVALID: '+body.componentId+' has no finite nonempty bounds');
      const geometryRef='catalog://'+body.componentId;
      const pose=solved.poses[body.id];
      const anchorIds=graphPorts(body,catalog).map(port=>port.id);
      components.push({
        instanceId:body.id,catalogId:body.componentId,geometryRef,
        pose:{pos:[...pose.pos],rotation:[...pose.rotation]},
        boundsMm:{min:bounds.min.toArray(),max:bounds.max.toArray()},
        anchorIds,fidelity:'procedural-reference'
      });
    } finally {disposePart(mesh);}
  }
  const geometryManifest={
    schemaVersion:'geometry-manifest/v1',kind:'GeometryManifest',
    id:'geometry_'+graph.id,units:'mm',coordinateFrame:'right-handed-y-up',
    components,sourceWorldSpecHash:worldSpecArtifact.contentHash,
    fidelity:'procedural-reference'
  };
  const geometry=createArtifact('GeometryManifest','L1',geometryManifest,{
    sources:[worldSpecArtifact.contentHash],
    capability:'world.geometry.build',pluginVersion:'1.0.0'
  });
  const assemblyGraph={
    schemaVersion:'assembly-graph/v1',kind:'AssemblyGraph',
    id:'assembly_'+graph.id,units:'mm',graph,
    sourceWorldSpecHash:worldSpecArtifact.contentHash,
    sourceGeometryHash:geometry.contentHash
  };
  const assembly=createArtifact('AssemblyGraph','L2',assemblyGraph,{
    sources:[worldSpecArtifact.contentHash,geometry.contentHash],
    capability:'world.kinematics.validate',pluginVersion:'1.0.0'
  });
  return {geometry,assembly,solverPreview:{
    closureErrorMm:solved.closureErrorMm,
    collisionPairs:solved.collisionPairs,
    cycleCount:solved.cycleCount
  }};
}
