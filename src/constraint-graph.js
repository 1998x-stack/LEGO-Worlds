import * as THREE from 'three';
import { OBB } from 'three/addons/math/OBB.js';
import { getPartAnchors } from './connection-anchors.js';

export const CONSTRAINT_GRAPH_VERSION = 1;
export const GRAPH_MAX_BODIES = 20;
export const GRAPH_MAX_JOINTS = 32;
export const CONSTRAINT_KINDS = Object.freeze(['fixed', 'hinge', 'shaft', 'slider']);
export const GRAPH_CATALOG_IDS = Object.freeze([
  'beam-3', 'beam-5', 'beam-7', 'beam-13',
  'brick-2x4', 'plate-2x6', 'wheel-medium', 'gear-16t'
]);
export const GRAPH_PRESETS = Object.freeze([
  { id: 'four-bar', name: 'Four-Bar Linkage', zh: '四连杆闭环机构' },
  { id: 'linear-carriage', name: 'Linear Carriage', zh: '滑轨与移动平台' },
  { id: 'shaft-drive', name: 'Shaft Drive', zh: '旋转轴与轮组' }
]);

const V = a => new THREE.Vector3(...a);
const ident = () => new THREE.Matrix4();
const validId = x => typeof x === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(x);
const triple = x => Array.isArray(x) && x.length === 3 && x.every(Number.isFinite);
const digits = x => Number.isFinite(x) && Math.abs(x) <= 10000;
const clamp = THREE.MathUtils.clamp;
const rot = r => new THREE.Quaternion().setFromEuler(new THREE.Euler(...r, 'XYZ'));
const mat = (p, r = [0, 0, 0]) => new THREE.Matrix4().compose(
  V(p), rot(r), new THREE.Vector3(1, 1, 1)
);
const toPose = matrix => {
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  matrix.decompose(p, q, s);
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  return { pos: p.toArray(), rotation: [e.x, e.y, e.z] };
};

function componentSize(entry) {
  const s = entry.size || [];
  switch (entry.type) {
    case 'beam': return [(Number(s[0]) || 5) * 8, 7.8, Number(s[1]) || 7.8];
    case 'brick': return [(Number(s[0]) || 2) * 8, 9.6, (Number(s[1]) || 4) * 8];
    case 'plate':
    case 'tile':
    case 'jumper': return [(Number(s[0]) || 2) * 8, 3.2, (Number(s[1]) || 2) * 8];
    case 'wheel': return [(Number(s[0]) || 10) * 2, (Number(s[0]) || 10) * 2, Number(s[1]) || 7];
    case 'gear': return [(Number(s[0]) || 8) * 2, (Number(s[0]) || 8) * 2, Number(s[2]) || 3.2];
    default: return [16, 8, 8];
  }
}

export function graphPorts(body, catalog) {
  const entry = catalog.find(p => p.id === body.componentId);
  if (!entry) throw new Error('Unknown graph component: ' + body.componentId);
  const baseSize = componentSize(entry);
  const ports = [
    { id: 'center-z', label: 'Center / Z axis', position: [0, 0, 0], rotation: [0, 0, 0], source: 'virtual-datum' },
    { id: 'center-x', label: 'Center / X guide', position: [0, 0, 0], rotation: [0, Math.PI / 2, 0], source: 'virtual-datum' },
    { id: 'left-z', label: 'Left endpoint', position: [-baseSize[0] / 2, 0, 0], rotation: [0, 0, 0], source: 'virtual-datum' },
    { id: 'right-z', label: 'Right endpoint', position: [baseSize[0] / 2, 0, 0], rotation: [0, 0, 0], source: 'virtual-datum' }
  ];
  const kinds = new Map();
  for (const anchor of getPartAnchors(entry)) {
    if (!['technic-hole', 'hinge-axis', 'axle', 'axle-hole', 'gear-axis', 'wheel-axis', 'rotary-axis'].includes(anchor.kind)) continue;
    const index = kinds.get(anchor.kind) || 0;
    kinds.set(anchor.kind, index + 1);
    const axis = V(anchor.axis || anchor.normal).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis);
    const e = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
    ports.push({
      id: anchor.kind + ':' + index,
      label: anchor.kind + ' ' + (index + 1),
      position: [...anchor.position], rotation: [e.x, e.y, e.z],
      source: 'connection-anchor', anchorId: anchor.id
    });
  }
  return ports;
}

export function portById(body, id, catalog) {
  const port = graphPorts(body, catalog).find(p => p.id === id);
  if (!port) throw new Error('Unknown port ' + id + ' on ' + body.id);
  return port;
}

const motionMatrix = (joint, value) => {
  if (joint.kind === 'slider') return new THREE.Matrix4().makeTranslation(0, 0, value);
  if (joint.kind === 'hinge' || joint.kind === 'shaft') {
    return new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(value));
  }
  return ident();
};

function relativeMatrix(joint, value, byId, catalog) {
  const a = byId.get(joint.a.bodyId), b = byId.get(joint.b.bodyId);
  const aPort = portById(a, joint.a.portId, catalog);
  const bPort = portById(b, joint.b.portId, catalog);
  return mat(aPort.position, aPort.rotation).multiply(motionMatrix(joint, value))
    .multiply(mat(bPort.position, bPort.rotation).invert());
}

export function validateConstraintGraph(graph, catalog) {
  if (!graph || !validId(graph.id) || !Array.isArray(graph.bodies) ||
      !Array.isArray(graph.joints) || !graph.bodies.length ||
      graph.bodies.length > GRAPH_MAX_BODIES || graph.joints.length > GRAPH_MAX_JOINTS) {
    throw new Error('Invalid graph schema or capacity');
  }
  const components = new Set(catalog.map(p => p.id));
  const bodyIds = new Set();
  for (const body of graph.bodies) {
    if (!validId(body.id) || bodyIds.has(body.id) || !components.has(body.componentId) ||
        !triple(body.pos) || !triple(body.rotation) ||
        !body.pos.every(digits) || !body.rotation.every(r => Math.abs(r) <= Math.PI * 2 + 1e-6)) {
      throw new Error('Invalid or duplicate body and component data');
    }
    bodyIds.add(body.id);
  }
  const byId = new Map(graph.bodies.map(body => [body.id, body]));
  const jointIds = new Set();
  const usedPairs = new Set();
  for (const joint of graph.joints) {
    if (!joint || !validId(joint.id) || jointIds.has(joint.id) ||
        !CONSTRAINT_KINDS.includes(joint.kind) || !joint.a || !joint.b ||
        !byId.has(joint.a.bodyId) || !byId.has(joint.b.bodyId) ||
        joint.a.bodyId === joint.b.bodyId || !Array.isArray(joint.limits) ||
        joint.limits.length !== 2 || !joint.limits.every(digits) ||
        joint.limits[0] > joint.limits[1] || !digits(joint.value) ||
        joint.value < joint.limits[0] || joint.value > joint.limits[1] ||
        (joint.kind === 'fixed' && (joint.value !== 0 || joint.limits.some(n => n !== 0)))) {
      throw new Error('Invalid joint/limits or duplicate constraint');
    }
    portById(byId.get(joint.a.bodyId), joint.a.portId, catalog);
    portById(byId.get(joint.b.bodyId), joint.b.portId, catalog);
    const endpoints = [joint.a.bodyId + ':' + joint.a.portId,
      joint.b.bodyId + ':' + joint.b.portId].sort().join('~');
    if (usedPairs.has(endpoints)) throw new Error('Duplicate connection between the same ports');
    usedPairs.add(endpoints);
    jointIds.add(joint.id);
  }
  return { byId, jointIds };
}

function spanningFrames(graph, catalog, values) {
  const byId = new Map(graph.bodies.map(b => [b.id, b]));
  const frames = new Map(), treeJointIds = new Set();
  const roots = [], adjacency = new Map(graph.bodies.map(b => [b.id, []]));
  for (const joint of graph.joints) {
    adjacency.get(joint.a.bodyId).push({ joint, forward: true, target: joint.b.bodyId });
    adjacency.get(joint.b.bodyId).push({ joint, forward: false, target: joint.a.bodyId });
  }
  // Put grounded parts first; disconnected assemblies retain independent reference poses.
  const ordered = [...graph.bodies].sort((a, b) => Number(Boolean(b.grounded)) - Number(Boolean(a.grounded)));
  const groups = [];
  for (const root of ordered) {
    if (frames.has(root.id)) continue;
    roots.push(root.id);
    const members = [];
    frames.set(root.id, mat(root.pos, root.rotation));
    const queue = [root.id];
    for (let index = 0; index < queue.length; index++) {
      const from = queue[index];
      members.push(from);
      for (const link of adjacency.get(from)) {
        const { joint, target, forward } = link;
        if (frames.has(target)) continue;
        const relative = relativeMatrix(joint, values[joint.id], byId, catalog);
        const transform = forward ? relative : relative.invert();
        frames.set(target, frames.get(from).clone().multiply(transform));
        treeJointIds.add(joint.id);
        queue.push(target);
      }
    }
    groups.push(members);
  }
  return { frames, treeJointIds, roots, groups };
}

const AXIS_LEVER_MM = 14;
function rotationResidual(matrix) {
  const pos = new THREE.Vector3(), q = new THREE.Quaternion(), scale = new THREE.Vector3();
  matrix.decompose(pos, q, scale);
  q.normalize();
  if (q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w);
  const vlen = Math.hypot(q.x, q.y, q.z);
  const angle = 2 * Math.atan2(vlen, Math.max(-1, Math.min(1, q.w)));
  const rotation = vlen < 1e-10 ? [q.x * 2, q.y * 2, q.z * 2]
    : [q.x, q.y, q.z].map(n => n * angle / vlen);
  return [...pos.toArray(), ...rotation.map(n => n * AXIS_LEVER_MM)];
}

function closureResidual(graph, catalog, values) {
  const {frames, treeJointIds, groups, roots} = spanningFrames(graph, catalog, values);
  const byId = new Map(graph.bodies.map(b => [b.id, b]));
  const residual = [];
  const closures = [];
  for (const joint of graph.joints) {
    if (treeJointIds.has(joint.id)) continue;
    const expected = frames.get(joint.a.bodyId).clone()
      .multiply(relativeMatrix(joint, values[joint.id], byId, catalog));
    const mismatch = expected.clone().invert().multiply(frames.get(joint.b.bodyId));
    const vector = rotationResidual(mismatch);
    residual.push(...vector);
    closures.push({ jointId: joint.id, residualMm: Math.hypot(...vector) });
  }
  // Grounded references also act as hard closure equations when interconnected.
  for (const body of graph.bodies.filter(b => b.grounded && !roots.includes(b.id))) {
    const target = mat(body.pos, body.rotation);
    const error = target.clone().invert().multiply(frames.get(body.id));
    const vector = rotationResidual(error);
    residual.push(...vector);
    closures.push({ jointId: 'ground:' + body.id, residualMm: Math.hypot(...vector) });
  }
  return { residual, closures, frames, groups, roots,
    cycleCount: graph.joints.length - graph.bodies.length + groups.length };
}

const norm = v => Math.hypot(...v);
function linearSolve(input, rhs) {
  const n = rhs.length;
  const rows = input.map((row, i) => [...row, rhs[i]]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++)
      if (Math.abs(rows[j][i]) > Math.abs(rows[pivot][i])) pivot = j;
    if (Math.abs(rows[pivot][i]) < 1e-12) return null;
    [rows[i], rows[pivot]] = [rows[pivot], rows[i]];
    const factor = rows[i][i];
    for (let k = i; k <= n; k++) rows[i][k] /= factor;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const multiple = rows[j][i];
      for (let k = i; k <= n; k++) rows[j][k] -= multiple * rows[i][k];
    }
  }
  return rows.map(row => row[n]);
}

function optimizeFreeJoints(graph, catalog, initial, iterations) {
  let values = {...initial};
  const editable = graph.joints.filter(j => !j.controlled && j.kind !== 'fixed');
  let evaluated = closureResidual(graph, catalog, values);
  if (!editable.length || !evaluated.residual.length || norm(evaluated.residual) < 1e-5)
    return {values, evaluated, iterations:0};
  let lambda = 0.03;
  let used = 0;
  for (let iteration = 0; iteration < iterations; iteration++) {
    used++;
    const r = evaluated.residual;
    if (norm(r) < 0.05) break;
    const derivs = editable.map(joint => {
      const h = joint.kind === 'slider' ? 0.05 : 0.05;
      const raised = {...values,[joint.id]:clamp(values[joint.id]+h,...joint.limits)};
      const lowered = {...values,[joint.id]:clamp(values[joint.id]-h,...joint.limits)};
      const upper = closureResidual(graph, catalog, raised).residual;
      const lower = closureResidual(graph, catalog, lowered).residual;
      const denom = raised[joint.id] - lowered[joint.id];
      return upper.map((n,i) => denom > 1e-10 ? (n-lower[i])/denom : 0);
    });
    const normal = editable.map((_,i) => editable.map((_,j) =>
      derivs[i].reduce((sum,n,k) => sum+n*derivs[j][k],0) + (i===j?lambda:0)));
    const rhs = derivs.map(d => -d.reduce((sum,n,k)=>sum+n*r[k],0));
    const delta = linearSolve(normal,rhs);
    if (!delta || !delta.every(Number.isFinite)) break;
    let accepted = false;
    for (const scale of [1,0.5,0.25,0.1]) {
      const next = {...values};
      editable.forEach((joint,i)=>{
        const bounded = clamp(delta[i]*scale, joint.kind==='slider'?-10:-25,
          joint.kind==='slider'?10:25);
        next[joint.id]=clamp(values[joint.id]+bounded,...joint.limits);
      });
      const candidate = closureResidual(graph,catalog,next);
      if (norm(candidate.residual) < norm(evaluated.residual)-1e-8) {
        values=next;evaluated=candidate;lambda=Math.max(0.0001,lambda*0.55);accepted=true;break;
      }
    }
    if (!accepted) lambda=Math.min(100000,lambda*6);
    if (!accepted && lambda>=100000) break;
  }
  return {values,evaluated,iterations:used};
}

function bodyOBB(body, frame, catalog) {
  const entry = catalog.find(item => item.id === body.componentId);
  const size = componentSize(entry);
  // Proxy boxes use a modest inset to avoid false collisions on face contact.
  const obb = new OBB(new THREE.Vector3(), new THREE.Vector3(
    ...size.map(n => Math.max(0.4,n-0.5)/2)
  ));
  obb.applyMatrix4(frame);
  return obb;
}

export function detectGraphCollisions(graph, frames, catalog) {
  const adjacent = new Set(graph.joints.map(j =>
    [j.a.bodyId,j.b.bodyId].sort().join(':')));
  const obbs = new Map(graph.bodies.map(b => [b.id,bodyOBB(b,frames.get(b.id),catalog)]));
  const collisions = [];
  for(let i=0;i<graph.bodies.length;i++){
    for(let j=i+1;j<graph.bodies.length;j++){
      const a=graph.bodies[i],b=graph.bodies[j];
      if(adjacent.has([a.id,b.id].sort().join(':'))) continue;
      if(obbs.get(a.id).intersectsOBB(obbs.get(b.id),1e-5))
        collisions.push({bodyA:a.id,bodyB:b.id,method:'oriented-box-proxy'});
    }
  }
  return collisions;
}

export function solveConstraintGraph(graph, catalog, options={}) {
  validateConstraintGraph(graph,catalog);
  const base={};
  for(const joint of graph.joints){
    const supplied=options.values?.[joint.id];
    const candidate = supplied === undefined ? joint.value : Number(supplied);
    if (!Number.isFinite(candidate)) throw new Error('Non-finite joint target');
    base[joint.id]=clamp(candidate,...joint.limits);
  }
  const optimized=optimizeFreeJoints(graph,catalog,base,
    Math.max(0,Math.min(90,Number(options.maxIterations??55))));
  const evaluation=optimized.evaluated;
  const closureErrorMm=norm(evaluation.residual);
  const valid=closureErrorMm<=Number(options.closureToleranceMm??0.7);
  const poses=Object.fromEntries([...evaluation.frames].map(([id,matrix])=>[id,toPose(matrix)]));
  const collisions=detectGraphCollisions(graph,evaluation.frames,catalog);
  return {
    valid, status:!valid?'closure-incompatible':collisions.length?'collision-warning':'valid',
    values:optimized.values, poses,
    closureErrorMm, closures:evaluation.closures,
    collisionPairs:collisions, cycleCount:evaluation.cycleCount,
    groundedRoots:evaluation.roots, connectedGroups:evaluation.groups,
    iterations:optimized.iterations
  };
}

export function appendGraphBody(graph, componentId, catalog, name) {
  if (graph.bodies.length >= GRAPH_MAX_BODIES) throw new Error('Graph body limit reached');
  if (!GRAPH_CATALOG_IDS.includes(componentId) || !catalog.some(c=>c.id===componentId))
    throw new Error('Unsupported graph component');
  const ids=new Set(graph.bodies.map(b=>b.id));
  let i=1;
  while(ids.has('part_'+i))i++;
  const id='part_'+i;
  const result=structuredClone(graph);
  result.bodies.push({
    id,componentId,name:String(name||id).slice(0,100),
    pos:[80+i*12,0,0],rotation:[0,0,0],grounded:false
  });
  validateConstraintGraph(result,catalog);
  return result;
}

export function appendGraphJoint(graph, input, catalog, options={}) {
  if (graph.joints.length>=GRAPH_MAX_JOINTS) throw new Error('Graph joint limit reached');
  const kind=input.kind;
  if (!CONSTRAINT_KINDS.includes(kind)) throw new Error('Unsupported joint type');
  const ids=new Set(graph.joints.map(j=>j.id));
  let n=1;
  while(ids.has('joint_'+n))n++;
  const value=kind==='fixed'?0:Number(input.value??0);
  const limits=kind==='fixed'?[0,0]:kind==='slider'?[-60,60]:[-170,170];
  const joint={
    id:'joint_'+n,kind,
    a:{bodyId:input.bodyA,portId:input.portA},
    b:{bodyId:input.bodyB,portId:input.portB},
    value:clamp(value,...limits),limits,
    controlled:Boolean(input.controlled) && kind!=='fixed'
  };
  const draft=structuredClone(graph);
  draft.joints.push(joint);
  validateConstraintGraph(draft,catalog);
  const solved=solveConstraintGraph(draft,catalog,options);
  if (!solved.valid) throw new Error('New edge violates closed-loop constraints (residual '+
    solved.closureErrorMm.toFixed(2)+' mm)');
  if (options.rejectCollisions && solved.collisionPairs.length)
    throw new Error('New edge creates an oriented-box collision');
  return draft;
}

export function removeGraphJoint(graph,id,catalog) {
  const draft=structuredClone(graph);
  const index=draft.joints.findIndex(j=>j.id===id);
  if(index<0)throw new Error('Unknown joint ID');
  draft.joints.splice(index,1);
  validateConstraintGraph(draft,catalog);
  return draft;
}

export function exportConstraintGraph(graph, catalog) {
  validateConstraintGraph(graph,catalog);
  return {
    schemaVersion:CONSTRAINT_GRAPH_VERSION,units:'mm',
    graph:structuredClone(graph)
  };
}

export function importConstraintGraph(value,catalog) {
  if(!value || value.schemaVersion!==CONSTRAINT_GRAPH_VERSION || value.units!=='mm')
    throw new Error('Invalid or unsupported constraint graph version');
  const graph=structuredClone(value.graph);
  validateConstraintGraph(graph,catalog);
  const result=solveConstraintGraph(graph,catalog);
  if(!result.valid)throw new Error('Imported closed-loop constraints cannot be satisfied');
  return graph;
}

function graphBody(id,componentId,grounded=false) {
  return {id,componentId,grounded,pos:[0,0,0],rotation:[0,0,0]};
}
const j = (id,a,portA,b,portB,kind,value=0,controlled=false,limits=[-170,170]) => ({
  id,kind,a:{bodyId:a,portId:portA},b:{bodyId:b,portId:portB},value,controlled,
  limits:kind==='fixed'?[0,0]:limits
});

export function createConstraintPreset(id='four-bar') {
  if(id==='four-bar') return {
    id,name:'Four-Bar Linkage',zh:'四连杆闭环机构',
    bodies:[
      graphBody('ground','beam-7',true),graphBody('crank','beam-5'),
      graphBody('coupler','beam-7'),graphBody('rocker','beam-5')
    ],
    joints:[
      j('drive','ground','technic-hole:0','crank','technic-hole:0','hinge',90,true,[25,145]),
      j('upper_left','crank','technic-hole:4','coupler','technic-hole:0','hinge',-90,false),
      j('right_ground','ground','technic-hole:6','rocker','technic-hole:0','hinge',90,false),
      j('loop_closure','coupler','technic-hole:6','rocker','technic-hole:4','hinge',90,false)
    ]
  };
  if(id==='linear-carriage') return {
    id,name:'Linear Carriage',zh:'滑轨与移动平台',
    bodies:[graphBody('rail','beam-13',true),graphBody('carriage','brick-2x4'),graphBody('platform','plate-2x6')],
    joints:[
      j('slide','rail','center-x','carriage','center-x','slider',0,true,[-32,32]),
      j('payload','carriage','center-z','platform','center-z','fixed',0,false)
    ]
  };
  if(id==='shaft-drive') return {
    id,name:'Shaft Drive',zh:'旋转轴与轮组',
    bodies:[graphBody('support','beam-5',true),graphBody('rotor','gear-16t'),graphBody('wheel','wheel-medium')],
    joints:[
      j('motor','support','technic-hole:2','rotor','gear-axis:0','shaft',0,true,[-170,170]),
      j('keyed_wheel','rotor','center-z','wheel','center-z','fixed',0,false)
    ]
  };
  throw new Error('Unknown constraint graph preset');
}
