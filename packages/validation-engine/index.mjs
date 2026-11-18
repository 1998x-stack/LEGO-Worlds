import * as THREE from 'three';
import { COMPONENTS } from '../../src/catalog.js';
import { createPart } from '../../src/brick-system.js';
import { graphPorts, solveConstraintGraph, validateConstraintGraph } from '../../src/constraint-graph.js';
import { assertArtifact, createArtifact, sha256 } from '../world-contracts/index.mjs';
import { reviewNominalAxialInterfaces, inspectGraphMeshContacts, inspectInsertionPath } from '../clearance-engine/index.mjs';

export const GATE_STATUSES=Object.freeze(['PASS','WARN','FAIL','NOT_RUN','NOT_APPLICABLE']);
const result=(gate,status,code,message,measurements)=>({
  gate,status,code,message,...(measurements?{measurements}:{})
});
const failure=(gate,code,message)=>result(gate,'FAIL',code,message);

function dispose(root) {
  root.traverse(node=>{
    node.geometry?.dispose();
    if(node.material)
      for(const m of (Array.isArray(node.material)?node.material:[node.material]))m.dispose();
  });
}

export function checkL0(worldSpec,assembly=null,catalog=COMPONENTS) {
  const checks=[];
  try{assertArtifact(worldSpec,{kind:'WorldSpec',level:'L0'});}
  catch(error){return [failure('L0.schema','WORLD_SPEC_INVALID',error.message)];}
  const spec=worldSpec.content;
  const requirementIds=new Set();
  for(const req of spec.requirements){
    if(requirementIds.has(req.id))
      checks.push(failure('L0.requirements','DUPLICATE_REQUIREMENT',req.id));
    requirementIds.add(req.id);
    if(req.priority!=='hard')continue;
    if(req.property==='wheelCount'){
      if(!Number.isInteger(req.value)||req.value<1||req.value>64){
        checks.push(failure('L0.requirements','WHEEL_COUNT_INVALID','Wheel count must be positive integer <=64'));
      }else if(assembly) {
        const wheels=assembly.content.graph.bodies.filter(body=>
          catalog.find(c=>c.id===body.componentId)?.type==='wheel').length;
        checks.push(result('L0.requirements',wheels===req.value?'PASS':'FAIL',
          wheels===req.value?'WHEEL_COUNT_MATCH':'HARD_REQUIREMENT_VIOLATED',
          'Expected '+req.value+' wheel components; actual '+wheels,
          {expected:req.value,actual:wheels}));
      }else checks.push(result('L0.requirements','NOT_RUN','WHEEL_COUNT_PENDING','Wheel count cannot be confirmed without assembly'));
    }else if(req.property==='designIntent'){
      checks.push(result('L0.requirements',
        req.value===spec.prompt?'PASS':'FAIL',
        'DESIGN_INTENT_TRACE',req.value===spec.prompt?'Original request retained':'Hard request was rewritten'));
    }else if(req.property==='floorCount'){
      checks.push(result('L0.requirements','WARN','FLOOR_COUNT_UNVERIFIED',
        'Floor count is captured, but no building geometry/structural solver exists'));
    }else checks.push(result('L0.requirements','WARN','HARD_REQUIREMENT_UNSUPPORTED',
      'No independent verifier for hard property '+req.property));
  }
  if(spec.subsystems?.length) {
    const ids=spec.subsystems.map(system=>system.id);
    if(new Set(ids).size!==ids.length)
      checks.push(failure('L0.subsystems','DUPLICATE_SUBSYSTEM_ID',
        'All building/aircraft systems require distinct IDs'));
    else checks.push(result('L0.subsystems','WARN','SUBSYSTEMS_REQUIRE_PHYSICS',
      spec.subsystems.length+' domain subsystems captured at L0 only; no L1/L2 engineering solver',
      {subsystems:spec.subsystems.length}));
  }
  if(spec.unresolved.length)checks.push(result('L0.requirements','WARN','REQUIREMENTS_UNRESOLVED',
    spec.unresolved.length+' open engineering assumptions or missing checks',
    {unresolvedCount:spec.unresolved.length}));
  checks.unshift(result('L0.schema','PASS','WORLD_SPEC_SCHEMA_VALID',
    'Schema version, source and typed requirements are well formed'));
  return checks;
}

export function checkL1(worldSpec,geometry,catalog=COMPONENTS) {
  const checks=[];
  try{
    assertArtifact(worldSpec,{kind:'WorldSpec'});
    assertArtifact(geometry,{kind:'GeometryManifest',level:'L1'});
  }catch(error){return [failure('L1.schema','GEOMETRY_MANIFEST_INVALID',error.message)];}
  if(geometry.content.sourceWorldSpecHash!==worldSpec.contentHash ||
     !geometry.sourceArtifacts.includes(worldSpec.contentHash))
    return [failure('L1.provenance','GEOMETRY_PROVENANCE_MISMATCH',
      'Geometry source does not match validated WorldSpec')];
  const ids=new Set();
  for(const item of geometry.content.components) {
    if(ids.has(item.instanceId)){
      checks.push(failure('L1.geometry','DUPLICATE_GEOMETRY_INSTANCE',item.instanceId));continue;
    }
    ids.add(item.instanceId);
    const component=catalog.find(c=>c.id===item.catalogId);
    if(!component){
      checks.push(failure('L1.geometry','COMPONENT_NOT_FOUND',item.catalogId));continue;
    }
    if(item.geometryRef!=='catalog://'+item.catalogId){
      checks.push(failure('L1.geometry','GEOMETRY_REF_MISMATCH',item.instanceId));continue;
    }
    const node=createPart({...component,pos:[0,0,0],rotation:[0,0,0]});
    try{
      const bounds=new THREE.Box3().setFromObject(node);
      const actual=[...bounds.min.toArray(),...bounds.max.toArray()];
      const claim=[...item.boundsMm.min,...item.boundsMm.max];
      if(bounds.isEmpty()||actual.some(n=>!Number.isFinite(n)) ||
         claim.some((n,index)=>Math.abs(n-actual[index])>0.02))
        checks.push(failure('L1.geometry','GEOMETRY_BOUNDS_MISMATCH',
          item.instanceId+' bounds differ from rebuilt procedural mesh'));
      const expected=graphPorts({id:item.instanceId,componentId:item.catalogId},catalog)
        .map(p=>p.id).sort();
      if(JSON.stringify([...item.anchorIds].sort())!==JSON.stringify(expected))
        checks.push(failure('L1.anchors','ANCHOR_REFERENCE_MISMATCH',
          item.instanceId+' anchor list differs from catalog'));
    }catch(error){checks.push(failure('L1.geometry','GEOMETRY_FACTORY_FAILED',error.message));}
    finally{dispose(node);}
  }
  if(!checks.some(c=>c.status==='FAIL'))
    checks.push(result('L1.geometry','PASS','GEOMETRY_REBUILT_AND_CHECKED',
      'All '+ids.size+' catalog geometry instances reproduced and their local bounds/ports matched',
      {components:ids.size}));
  checks.push(result('L1.manufacturing','NOT_RUN','FIT_NOT_TESTED',
    'No real mechanical tolerances, wall thickness or manufacturing validation'));
  checks.push(result('L1.rendering','NOT_RUN','GPU_RENDER_NOT_TESTED',
    'Node geometry checks do not prove cross-browser WebGL or exported GLB behavior'));
  return checks;
}

export function checkL2(worldSpec,geometry,assembly,catalog=COMPONENTS,options={}) {
  try{
    assertArtifact(worldSpec,{kind:'WorldSpec'});
    assertArtifact(geometry,{kind:'GeometryManifest'});
    assertArtifact(assembly,{kind:'AssemblyGraph',level:'L2'});
  }catch(error){return [failure('L2.schema','ASSEMBLY_GRAPH_INVALID',error.message)];}
  const a=assembly.content;
  if(a.sourceWorldSpecHash!==worldSpec.contentHash ||
    a.sourceGeometryHash!==geometry.contentHash ||
    !assembly.sourceArtifacts.includes(worldSpec.contentHash) ||
    !assembly.sourceArtifacts.includes(geometry.contentHash))
    return [failure('L2.provenance','ASSEMBLY_PROVENANCE_MISMATCH',
      'Assembly graph does not reference the exact checked L0 and L1 artifacts')];
  const geo=new Map(geometry.content.components.map(part=>[part.instanceId,part.catalogId]));
  if(a.graph.bodies.length!==geo.size || a.graph.bodies.some(body=>geo.get(body.id)!==body.componentId))
    return [failure('L2.components','ASSEMBLY_GEOMETRY_MISMATCH',
      'Assembly body instances and L1 geometry instances are inconsistent')];
  try{
    validateConstraintGraph(a.graph,catalog);
    const solved=solveConstraintGraph(a.graph,catalog,{
      maxIterations:Math.min(90,Math.max(0,Number(options.maxIterations??55)))
    });
    const checks=[
      result('L2.connections','PASS','CONNECTOR_REFS_VALID',
        'All graph joints, component IDs, ports and limits passed typed validation'),
      result('L2.kinematics',solved.valid?'PASS':'FAIL',
        solved.valid?'KINEMATIC_CLOSURE_PASS':'LOOP_NOT_CLOSED',
        'Weighted closure residual '+solved.closureErrorMm.toFixed(5)+' mm-equivalent',
        {weightedClosureErrorMm:solved.closureErrorMm,loops:solved.cycleCount,
          iterations:solved.iterations,checkedConfigurations:1}),
      result('L2.collision-proxy',solved.collisionPairs.length?'WARN':'PASS',
        solved.collisionPairs.length?'OBB_OVERLAP_WARNING':'OBB_NO_OVERLAP_DETECTED',
        'Oriented-box check: '+solved.collisionPairs.length+
          ' nonadjacent overlap pairs; directly connected components excluded',
        {pairs:solved.collisionPairs.length}),
      result('L2.motion-envelope','NOT_RUN','SWEPT_COLLISION_NOT_IMPLEMENTED',
        'Only initial configuration checked; no continuous collision/path clearance'),
      result('L2.physics','NOT_RUN','DYNAMICS_NOT_IMPLEMENTED',
        'No mass, force, motor torque, bearing friction, structural or aero validation')
    ];
    const fits=reviewNominalAxialInterfaces(a.graph,solved.poses,catalog);
    if(fits.length) {
      const blockers=fits.filter(f=>f.status==='FAIL');
      checks.push(result('L2.axial-fit',blockers.length?'FAIL':'PASS',
        blockers.length?'NOMINAL_INTERFACE_INTERFERENCE':'NOMINAL_COAXIAL_FITS_CHECKED',
        blockers.length ?
          blockers.map(f=>f.jointId+' '+f.code).join('; ') :
          fits.length+' nominal shaft/bearing/bore interfaces meet radial and axial bounds',
        {interfaces:fits,checkedCount:fits.length,failedCount:blockers.length}));
      checks.push(result('L2.physical-fit','NOT_RUN','MEASURED_FIT_NOT_VERIFIED',
        'Nominal radial clearance does not establish measured tolerances, fit under load or manufacturing strength'));
    } else {
      checks.push(result('L2.axial-fit','NOT_RUN','NO_TYPED_AXIAL_FITS',
        'No physically typed coaxial fitting pairs available in this graph'));
    }
    const clearance=options.clearance;
    if(clearance!==undefined) {
      if(!clearance||typeof clearance!=='object'||Array.isArray(clearance)||
         Object.keys(clearance).some(key=>!['mesh','path'].includes(key))||
         (clearance.mesh!==undefined&&clearance.mesh!==true&&clearance.mesh!==false))
        throw new Error('CLEARANCE_INPUT_INVALID: clearance accepts mesh boolean and path only');
    }
    if(clearance?.mesh===true) {
      const mesh=inspectGraphMeshContacts(a.graph,solved.poses,catalog);
      if(mesh.incomplete)checks.push(failure('L2.mesh-resource','MESH_VALIDATION_INCOMPLETE',
        'Explicit mesh clearance request exceeded the bounded triangle/pair budget'));
      checks.push(result('L2.mesh-surface',mesh.incomplete?'NOT_RUN':
        mesh.contacts.length?'WARN':'PASS',
        mesh.incomplete?'MESH_BUDGET_INCOMPLETE':
          mesh.contacts.length?'MESH_CONTACT_CANDIDATE':'MESH_SURFACE_SAMPLE_CLEAR',
        'Bounded mesh triangle checks: '+mesh.contacts.length+
          ' contact candidates, '+mesh.clearedCandidates+' OBB candidates cleared; '+
          (mesh.incomplete?'resource limit reached':'static configuration only'),
        {contacts:mesh.contacts,clearedCandidates:mesh.clearedCandidates,
          broadPhaseCandidates:mesh.broadPhaseCandidates,incomplete:mesh.incomplete}));
    } else {
      checks.push(result('L2.mesh-surface','NOT_RUN','MESH_NARROW_PHASE_NOT_RUN',
        'Opt in via options.clearance.mesh=true for a bounded static mesh candidate scan'));
    }
    if(clearance?.path) {
      const path=inspectInsertionPath(a.graph,solved.poses,catalog,clearance.path);
      if(path.status==='incomplete')checks.push(failure('L2.insertion-resource',
        'PATH_VALIDATION_INCOMPLETE','Requested insertion scan stopped before all samples were checked'));
      checks.push(result('L2.insertion-path',path.status==='blocked'?'FAIL':
        path.status==='incomplete'?'NOT_RUN':'WARN',
        path.status==='blocked'?'ASSEMBLY_PATH_BLOCKED':
          path.status==='incomplete'?'ASSEMBLY_PATH_INCOMPLETE':'SAMPLED_PATH_CLEAR',
        path.status==='blocked'?
          'A triangle contact/containment candidate blocks the requested insertion':
          'Sampled assembly path checked; clearance between samples is not proven',
        {path}));
    }else {
      checks.push(result('L2.insertion-path','NOT_RUN','INSERTION_PATH_NOT_RUN',
        'No explicit moving body, installed-body stage or approach vector supplied'));
    }
    return checks;
  }catch(error){
    return [failure('L2.kinematics','SOLVER_REJECTED_GRAPH',error.message)];
  }
}

export function validateWorldArtifacts({worldSpec,geometry,assembly,targetLevel='L2',
 catalog=COMPONENTS,maxIterations=55,clearance}={}) {
  if(!['L0','L1','L2'].includes(targetLevel))
    throw new Error('INVALID_VALIDATION_LEVEL');
  const subjects=[worldSpec,geometry,assembly].filter(Boolean).map(a=>a.contentHash);
  if(!worldSpec || !subjects.length)throw new Error('MISSING_WORLD_SPEC');
  const checks=[...checkL0(worldSpec,assembly,catalog)];
  if(['L1','L2'].includes(targetLevel)){
    if(!geometry)checks.push(failure('L1.schema','GEOMETRY_MISSING','L1 geometry manifest required'));
    else checks.push(...checkL1(worldSpec,geometry,catalog));
  }
  if(targetLevel==='L2'){
    if(!geometry || !assembly)
      checks.push(failure('L2.schema','ASSEMBLY_MISSING','L2 geometry and graph are required'));
    else checks.push(...checkL2(worldSpec,geometry,assembly,catalog,{maxIterations,clearance}));
  }
  const failed=checks.some(c=>c.status==='FAIL');
  // NOT_RUN is never counted as passing; pending L3+/physics readiness is explicit.
  const classification=failed?'needs-revision':
    targetLevel==='L0'?'requirements-only':
      targetLevel==='L1'?'geometry-preview':'kinematic-concept';
  const report={
    schemaVersion:'validation-report/v1',kind:'ValidationReport',
    id:'validation_'+sha256({subjects,targetLevel,checks}).slice(7,21),
    targetLevel,subjectHashes:subjects,
    checks,classification,validator:'independent-world-validation-engine-v1'
  };
  const artifact=createArtifact('ValidationReport',targetLevel,report,{
    sources:subjects,capability:'world.kinematics.validate',pluginVersion:'1.0.0'
  });
  return {
    status:failed?'needs_revision':'ok',artifact,checks,
    summary:{
      pass:checks.filter(c=>c.status==='PASS').length,
      warn:checks.filter(c=>c.status==='WARN').length,
      fail:checks.filter(c=>c.status==='FAIL').length,
      notRun:checks.filter(c=>c.status==='NOT_RUN').length,
      classification
    }
  };
}
