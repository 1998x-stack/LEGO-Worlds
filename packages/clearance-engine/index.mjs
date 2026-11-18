import * as THREE from 'three';
import { COMPONENTS } from '../../src/catalog.js';
import { createPart } from '../../src/brick-system.js';
import { getPartAnchors } from '../../src/connection-anchors.js';

export const CLEARANCE_ENGINE_VERSION = 1;
const TRIANGLE_BUDGET = 6000;
const PAIR_BUDGET = 60;
const TRIANGLE_COMPARISON_BUDGET = 500000;
const PATH_SAMPLE_MAX = 32;
const DEFAULT_CONTACT_EPSILON_MM = 0.02;
const EPS = 1e-10;
const rayDirection = new THREE.Vector3(0.717,0.463,0.520).normalize();

const v3 = p => new THREE.Vector3(...p);
const finite3 = p => Array.isArray(p)&&p.length===3&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<1e5);
function fail(message){throw new Error('CLEARANCE_INPUT_INVALID: '+message);}
function poseValue(pose){
  if(!pose || !finite3(pose.pos) || !finite3(pose.rotation))fail('Pose must use finite mm XYZ and radians');
  return pose;
}
function createCollider(spec,pose){
  poseValue(pose);
  const root=createPart({...spec,pos:pose.pos,rotation:pose.rotation});
  root.updateMatrixWorld(true);
  const meshes=[];
  root.traverse(node=>{if(node.isMesh && node.geometry?.getAttribute('position'))meshes.push(node);});
  if(meshes.length>80)fail('Too many separate geometry meshes');
  const box=new THREE.Box3().setFromObject(root);
  return {root,meshes,box};
}
function dispose(collider){
  collider.root.traverse(node=>{
    node.geometry?.dispose();
    for(const material of (Array.isArray(node.material)?node.material:node.material?[node.material]:[]))
      material.dispose();
  });
}
function triangleList(collider,maxTriangles=TRIANGLE_BUDGET){
  const triangles=[];
  for(const mesh of collider.meshes){
    const positions=mesh.geometry.getAttribute('position');
    const index=mesh.geometry.getIndex();
    const count=index?index.count:positions.count;
    const triangleCount=Math.floor(count/3);
    if(triangles.length+triangleCount>maxTriangles)
      return {triangles,limited:true};
    const point=n=>{
      const vertex=index?index.getX(n):n;
      return new THREE.Vector3().fromBufferAttribute(positions,vertex)
        .applyMatrix4(mesh.matrixWorld);
    };
    for(let t=0;t<triangleCount;t++){
      const a=point(t*3),b=point(t*3+1),c=point(t*3+2);
      const min=new THREE.Vector3(Math.min(a.x,b.x,c.x),Math.min(a.y,b.y,c.y),Math.min(a.z,b.z,c.z));
      const max=new THREE.Vector3(Math.max(a.x,b.x,c.x),Math.max(a.y,b.y,c.y),Math.max(a.z,b.z,c.z));
      triangles.push({a,b,c,min,max});
    }
  }
  return {triangles,limited:false};
}
function trianglesClose(a,b,epsilon){
  return !(a.max.x < b.min.x-epsilon || b.max.x < a.min.x-epsilon ||
    a.max.y < b.min.y-epsilon || b.max.y < a.min.y-epsilon ||
    a.max.z < b.min.z-epsilon || b.max.z < a.min.z-epsilon);
}
function separatingProjection(axis,a,b,epsilon){
  if(axis.lengthSq()<EPS)return false;
  const proj=t=>[t.a.dot(axis),t.b.dot(axis),t.c.dot(axis)];
  const pa=proj(a),pb=proj(b);
  const allowance=epsilon*Math.sqrt(axis.lengthSq());
  return Math.max(...pa)<Math.min(...pb)-allowance ||
    Math.max(...pb)<Math.min(...pa)-allowance;
}
// Triangle SAT detects sampled surface intersection, including near-coplanar
// contact. It is not a complete solid CSG/CCD proof.
function surfaceTrianglesContact(a,b,epsilon=DEFAULT_CONTACT_EPSILON_MM){
  if(!trianglesClose(a,b,epsilon))return false;
  const ea=[
    a.b.clone().sub(a.a),a.c.clone().sub(a.b),a.a.clone().sub(a.c)
  ],eb=[
    b.b.clone().sub(b.a),b.c.clone().sub(b.b),b.a.clone().sub(b.c)
  ];
  const normalA=ea[0].clone().cross(ea[1]);
  const normalB=eb[0].clone().cross(eb[1]);
  if(normalA.lengthSq()<EPS||normalB.lengthSq()<EPS)return false;
  const axes=[normalA,normalB];
  for(const v of ea)axes.push(normalA.clone().cross(v));
  for(const v of eb)axes.push(normalB.clone().cross(v));
  for(const u of ea)for(const v of eb)axes.push(u.clone().cross(v));
  return axes.every(axis=>!separatingProjection(axis,a,b,epsilon));
}

function uniqueDistances(hits){
  const distances=[];
  for(const hit of hits){
    if(!Number.isFinite(hit.distance)||hit.distance<1e-4)continue;
    if(!distances.some(d=>Math.abs(d-hit.distance)<1e-4))distances.push(hit.distance);
  }
  return distances;
}
function pointInsideMesh(point,mesh){
  // Treat each closed, independently meshed solid separately; not union/CSG.
  const oldSide=mesh.material?.side;
  if(mesh.material)mesh.material.side=THREE.DoubleSide;
  try {
    const ray=new THREE.Raycaster(point,rayDirection,1e-4,1e6);
    const count=uniqueDistances(ray.intersectObject(mesh,false)).length;
    return count>0&&count%2===1;
  }finally{if(mesh.material)mesh.material.side=oldSide;}
}
function detectContainment(left,right,probes=16){
  const geometry=triangleList(left,TRIANGLE_BUDGET);
  if(geometry.limited)return {inside:false,limited:true};
  const stride=Math.max(1,Math.floor(geometry.triangles.length/probes));
  let observed=0;
  for(let i=0;i<geometry.triangles.length && observed<probes;i+=stride,observed++){
    const p=geometry.triangles[i].a;
    for(const mesh of right.meshes){
      if(pointInsideMesh(p,mesh))return {inside:true,limited:false};
    }
  }
  return {inside:false,limited:false};
}

function collisionOfColliders(a,b,{epsilonMm=DEFAULT_CONTACT_EPSILON_MM,maxTriangles=TRIANGLE_BUDGET,
  maxTriangleComparisons=TRIANGLE_COMPARISON_BUDGET}={}){
  if(!a.box.intersectsBox(b.box))
    return {interference:false,status:'clear',method:'mesh-triangle-surface',candidates:0};
  const left=triangleList(a,maxTriangles),right=triangleList(b,maxTriangles);
  if(left.limited||right.limited)
    return {interference:false,status:'incomplete',method:'mesh-triangle-surface',reason:'triangle-budget-exceeded'};
  let candidates=0,comparisons=0;
  const boundedComparisons=Math.min(TRIANGLE_COMPARISON_BUDGET,
    Math.max(0,Math.floor(Number(maxTriangleComparisons)||0)));
  for(const x of left.triangles){
    for(const y of right.triangles){
      if(++comparisons>boundedComparisons)
        return {interference:false,status:'incomplete',method:'mesh-triangle-surface',
          reason:'triangle-comparison-budget-exceeded',comparisons};
      if(!trianglesClose(x,y,epsilonMm))continue;
      candidates++;
      if(surfaceTrianglesContact(x,y,epsilonMm)){
        return {interference:true,status:'contact-candidate',method:'mesh-triangle-surface',
          candidates,reason:'overlapping-or-touching-triangle-surfaces'};
      }
    }
  }
  // Vertex parity checks can catch fully contained solids whose surfaces do
  // not intersect. These are samples, not a full volumetric guarantee.
  const innerA=detectContainment(a,b);
  const innerB=detectContainment(b,a);
  if(innerA.limited||innerB.limited)
    return {interference:false,status:'incomplete',method:'sampled-closed-mesh-parity',reason:'triangle-budget-exceeded'};
  if(innerA.inside||innerB.inside)
    return {interference:true,status:'containment-candidate',method:'sampled-closed-mesh-parity',candidates};
  return {interference:false,status:'clear-sampled',method:'mesh-surface-and-parity',candidates};
}

export function inspectMeshPair(specA,poseA,specB,poseB,options={}){
  const a=createCollider(specA,poseA),b=createCollider(specB,poseB);
  try{return collisionOfColliders(a,b,options);}
  finally{dispose(a);dispose(b);}
}

const catalogById=(catalog,id)=>{
  const entry=catalog.find(c=>c.id===id);
  if(!entry)fail('Unknown catalog part '+id);
  return entry;
};

export function inspectGraphMeshContacts(graph,poses,catalog=COMPONENTS,options={}){
  if(!graph||!Array.isArray(graph.bodies)||graph.bodies.length>20)fail('Expected bounded graph');
  const adjacent=new Set(graph.joints.map(j=>[j.a.bodyId,j.b.bodyId].sort().join(':')));
  const objects=new Map();
  for(const body of graph.bodies)
    objects.set(body.id,createCollider(catalogById(catalog,body.componentId),poses[body.id]));
  try{
    const contacts=[];let pairs=0,incomplete=false,cleared=0;
    for(let i=0;i<graph.bodies.length;i++){
      for(let j=i+1;j<graph.bodies.length;j++){
        const a=graph.bodies[i].id,b=graph.bodies[j].id;
        if(adjacent.has([a,b].sort().join(':')))continue;
        if(!objects.get(a).box.intersectsBox(objects.get(b).box))continue;
        pairs++;
        if(pairs>PAIR_BUDGET){incomplete=true;break;}
        const collision=collisionOfColliders(objects.get(a),objects.get(b),options);
        if(collision.status==='incomplete')incomplete=true;
        else if(collision.interference)contacts.push({bodyA:a,bodyB:b,...collision});
        else cleared++;
      }
      if(pairs>PAIR_BUDGET)break;
    }
    return {method:'bounded-mesh-surface-and-parity',
      contacts,broadPhaseCandidates:pairs,clearedCandidates:cleared,
      incomplete,checkedStaticConfiguration:true,
      adjacentPairsExcluded:true};
  }finally{for(const object of objects.values())dispose(object);}
}

export function inspectInsertionPath(graph,poses,catalog=COMPONENTS,request={}){
  const {movingBodyId,installedBodyIds,fromOffsetMm,samples=12}=request;
  if(typeof movingBodyId!=='string'||!finite3(fromOffsetMm) ||
     !Number.isInteger(samples)||samples<2||samples>PATH_SAMPLE_MAX ||
     !Array.isArray(installedBodyIds) ||installedBodyIds.length>20 ||
     new Set(installedBodyIds).size!==installedBodyIds.length ||
     installedBodyIds.includes(movingBodyId))fail('Invalid bounded assembly path request');
  const byId=new Map(graph.bodies.map(b=>[b.id,b]));
  if(!byId.has(movingBodyId)||installedBodyIds.some(id=>!byId.has(id)))
    fail('Path references unknown graph bodies');
  // Do not allow caller to exclude already installed bodies; installedBodyIds
  // means an explicit assembly stage, and the omission is reportable.
  const moving=byId.get(movingBodyId);
  const base=poseValue(poses[movingBodyId]);
  const objects=new Map(installedBodyIds.map(id=>{
    const body=byId.get(id);
    return [id,createCollider(catalogById(catalog,body.componentId),poses[id])];
  }));
  const tested=[];
  try {
    for(let step=0;step<=samples;step++){
      const t=step/samples;
      const pose={
        pos:base.pos.map((x,i)=>x+fromOffsetMm[i]*(1-t)),
        rotation:[...base.rotation]
      };
      const mover=createCollider(catalogById(catalog,moving.componentId),pose);
      try {
        for(const [id,obstacle] of objects){
          const hit=collisionOfColliders(mover,obstacle);
          if(hit.status==='incomplete')
            return {status:'incomplete',method:'discrete-mesh-path-samples',
              testedSamples:tested.length,steps:samples+1,
              installedBodyIds:[...installedBodyIds],movingBodyId,
              reason:'mesh-budget-exceeded'};
          if(hit.interference)
            return {status:'blocked',method:'discrete-mesh-path-samples',
              movingBodyId,hitBodyId:id,sampleIndex:step,sampleT:t,
              testedSamples:tested.length+1,steps:samples+1,
              reason:hit.reason,installedBodyIds:[...installedBodyIds]};
        }
        tested.push(t);
      }finally{dispose(mover);}
    }
    return {
      status:'sampled-clear',method:'discrete-mesh-path-samples',
      movingBodyId,installedBodyIds:[...installedBodyIds],
      testedSamples:tested.length,steps:samples+1,
      reason:'Discrete samples cannot exclude collisions between sampling poses'
    };
  }finally{for(const obstacle of objects.values())dispose(obstacle);}
}

const axleDiameter=3.5;
function portSurface(body,port,catalog){
  const entry=catalogById(catalog,body.componentId);
  const k=port.split(':')[0];
  if(entry.type==='beam' && k==='technic-hole')
    return {role:'female',radius:2.45,length:Number(entry.size?.[1])||7.8,type:'beam-hole'};
  if(entry.type==='bearing'&&k==='bearing-outer')
    return {role:'male',radius:Number(entry.size?.[0])/2,length:Number(entry.size?.[2]),type:'bearing-outer'};
  if(entry.type==='bearing'&&k==='bearing-bore')
    return {role:'female',radius:Number(entry.size?.[1])/2,length:Number(entry.size?.[2]),type:'bearing-bore'};
  if(entry.type==='axle'&&(k==='axle'||k==='axle-seat-front'||k==='axle-seat-back'))
    return {role:'male',radius:axleDiameter/2,length:Number(entry.size?.[0]),type:'axle-cross-nominal'};
  if(entry.type==='wheel'&&k==='wheel-axis')
    return {role:'female',radius:1.9,length:(Number(entry.size?.[1])||7)+0.9,type:'wheel-through-bore'};
  return null;
}
function portLocal(body,port,catalog){
  const entry=catalogById(catalog,body.componentId);
  const index=/^(?:technic-hole):(\d+)$/.exec(port);
  if(index){
    const length=Number(entry.size?.[0])||5;
    return [(Number(index[1])-(Math.round(length)-1)/2)*8,0,0];
  }
  if(port==='axle-seat-front')return [0,0,(Number(entry.size?.[0])||24)*0.3];
  if(port==='axle-seat-back')return [0,0,-(Number(entry.size?.[0])||24)*0.3];
  return [0,0,0];
}
function worldPort(body,port,pose,catalog){
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...pose.rotation,'XYZ'));
  const p=v3(pose.pos).add(v3(portLocal(body,port,catalog)).applyQuaternion(q));
  const axis=new THREE.Vector3(0,0,1).applyQuaternion(q).normalize();
  return {p,axis};
}
export function reviewNominalAxialInterfaces(graph,poses,catalog=COMPONENTS){
  const bodies=new Map(graph.bodies.map(b=>[b.id,b]));
  const checks=[];
  for(const joint of graph.joints) {
    const bodyA=bodies.get(joint.a.bodyId),bodyB=bodies.get(joint.b.bodyId);
    const a=portSurface(bodyA,joint.a.portId,catalog);
    const b=portSurface(bodyB,joint.b.portId,catalog);
    if(!a||!b)continue;
    const pa=worldPort(bodyA,joint.a.portId,poses[bodyA.id],catalog);
    const pb=worldPort(bodyB,joint.b.portId,poses[bodyB.id],catalog);
    const female=a.role==='female'?a:b.role==='female'?b:null;
    const male=a.role==='male'?a:b.role==='male'?b:null;
    if(!female||!male){
      checks.push({jointId:joint.id,status:'FAIL',code:'INTERFACE_ROLE_MISMATCH'});continue;
    }
    const femalePort=a.role==='female'?pa:pb;
    const malePort=a.role==='male'?pa:pb;
    const angle=Math.acos(Math.min(1,Math.abs(pa.axis.dot(pb.axis))))*180/Math.PI;
    const centerDelta=malePort.p.clone().sub(femalePort.p);
    const offset=centerDelta.clone().addScaledVector(femalePort.axis,
      -centerDelta.dot(femalePort.axis)).length();
    const clearanceMm=female.radius-male.radius-offset;
    const femaleHalf=female.length/2,maleHalf=male.length/2;
    // The axle-seat is a connection datum offset along the *real* shaft.
    // Compute engagement against the physical axle center and full shaft ends,
    // not a fictitious shaft of full length centered on the offset seat.
    const maleBody=a.role==='male'?bodyA:bodyB;
    const maleCenter=male.type==='axle-cross-nominal'
      ? v3(poses[maleBody.id].pos) : malePort.p;
    const displacement=maleCenter.clone().sub(femalePort.p).dot(femalePort.axis);
    const axialOverlapMm=Math.max(0,Math.min(femaleHalf,displacement+maleHalf)-
      Math.max(-femaleHalf,displacement-maleHalf));
    const compatible=clearanceMm>=-0.005 && axialOverlapMm>0.1 && angle<2;
    checks.push({
      jointId:joint.id,status:compatible?'PASS':'FAIL',
      code:compatible?'NOMINAL_COAXIAL_FIT':'NOMINAL_COAXIAL_INTERFERENCE',
      male:male.type,female:female.type,
      clearanceMm:Number(clearanceMm.toFixed(4)),
      centerOffsetMm:Number(offset.toFixed(4)),
      axialOverlapMm:Number(axialOverlapMm.toFixed(4)),
      axisMisalignmentDeg:Number(angle.toFixed(4)),
      measuredFit:false,
      note:'Nominal geometry only, without print/material tolerances or actual load capability'
    });
  }
  return checks;
}
