import * as THREE from 'three';

const STUD = 8;
const BRICK_H = 9.6;
const PLATE_H = 3.2;
const STUD_R = 2.4;
const STUD_H = 1.7;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color: color || '#d8d5cc',
    roughness: 0.48,
    metalness: 0.04,
    ...options
  });
}

function addMesh(group, geometry, color, name, options = {}) {
  const mesh = new THREE.Mesh(geometry, material(color, options));
  mesh.name = name || 'part-detail';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addStuds(group, widthStuds, depthStuds, y, color, mode = 'all') {
  const xCount = Math.max(1, Math.round(widthStuds));
  const zCount = Math.max(1, Math.round(depthStuds));
  const positions = [];
  for (let x = 0; x < xCount; x++) {
    for (let z = 0; z < zCount; z++) {
      if (mode === 'single' && !(x === Math.floor((xCount - 1) / 2) && z === Math.floor((zCount - 1) / 2))) continue;
      positions.push([(x - (xCount - 1) / 2) * STUD, (z - (zCount - 1) / 2) * STUD]);
    }
  }
  for (const [x, z] of positions) {
    const stud = addMesh(group, new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 24), color, 'stud');
    stud.position.set(x, y, z);
  }
}

function createBrickLike(group, spec, mode) {
  const [sx = 1, sz = 1] = spec.size || [];
  const height = mode === 'brick' ? BRICK_H : PLATE_H;
  const width = sx * STUD - 0.22;
  const depth = sz * STUD - 0.22;
  addMesh(group, new THREE.BoxGeometry(width, height, depth), spec.color, mode + '-body').position.y = 0;
  if (mode === 'brick' || mode === 'plate') {
    addStuds(group, sx, sz, height / 2 + STUD_H / 2, spec.color);
  } else if (mode === 'jumper') {
    addStuds(group, sx, sz, height / 2 + STUD_H / 2, spec.color, 'single');
  }
}

function createSlope(group, spec) {
  const [sx = 2, sz = 2] = spec.size || [];
  const width = sx * STUD - 0.2;
  const depth = sz * STUD - 0.2;
  const height = BRICK_H;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, -height / 2 + height * 0.28);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  addMesh(group, geometry, spec.color, 'slope-wedge');
}

function createBeam(group, spec) {
  const [length = 5] = spec.size || [];
  const span = length * STUD - 0.3;
  const height = 7.8;
  const depth = 7.8;
  const shape = new THREE.Shape();
  shape.moveTo(-span / 2, -height / 2);
  shape.lineTo(span / 2, -height / 2);
  shape.lineTo(span / 2, height / 2);
  shape.lineTo(-span / 2, height / 2);
  shape.closePath();
  const holes = Math.max(2, Math.round(length));
  for (let i = 0; i < holes; i++) {
    const x = (i - (holes - 1) / 2) * STUD;
    const hole = new THREE.Path();
    hole.absarc(x, 0, 2.45, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 18 });
  geometry.translate(0, 0, -depth / 2);
  addMesh(group, geometry, spec.color, 'perforated-liftarm');
  for (let i = 0; i < holes; i++) {
    const x = (i - (holes - 1) / 2) * STUD;
    const rim = addMesh(group, new THREE.TorusGeometry(2.55, 0.22, 6, 18), '#151c22', 'beam-hole-rim');
    rim.position.set(x, 0, depth / 2 + 0.08);
  }
}

function createPin(group, spec, axle = false) {
  const length = Number(spec.size?.[0]) || (axle ? 40 : 12);
  const radius = axle ? 1.75 : 2.25;
  const geo = new THREE.CylinderGeometry(radius, radius, length, 16);
  const mesh = addMesh(group, geo, spec.color, axle ? 'cross-axle' : 'connector-pin');
  mesh.rotation.x = Math.PI / 2;
  const cap = addMesh(group, new THREE.CylinderGeometry(radius * 1.22, radius * 1.22, 1.2, 16), axle ? '#313b43' : spec.color, 'pin-flange');
  cap.rotation.x = Math.PI / 2;
  cap.position.z = -length / 2 + 1;
}

function createGear(group, spec) {
  const [radius = 8, teeth = 16, thickness = 3.2] = spec.size || [];
  const body = addMesh(group, new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, thickness, 40), spec.color, 'gear-disc');
  body.rotation.x = Math.PI / 2;
  const hub = addMesh(group, new THREE.CylinderGeometry(radius * 0.35, radius * 0.35, thickness + 0.8, 24), '#d8dce0', 'gear-hub');
  hub.rotation.x = Math.PI / 2;
  const hole = addMesh(group, new THREE.CylinderGeometry(radius * 0.13, radius * 0.13, thickness + 1.1, 16), '#202a32', 'axle-hole');
  hole.rotation.x = Math.PI / 2;
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const tooth = addMesh(group, new THREE.BoxGeometry(2.8, 3.1, thickness), spec.color, 'gear-tooth');
    tooth.position.set(Math.cos(angle) * (radius * 0.92), Math.sin(angle) * (radius * 0.92), 0);
    tooth.rotation.z = angle;
  }
}

function createWheel(group, spec) {
  const [radius = 10, width = 7] = spec.size || [];
  const tire = addMesh(group, new THREE.CylinderGeometry(radius, radius, width, 32), spec.color || '#252d34', 'rubber-tire');
  tire.rotation.x = Math.PI / 2;
  const rim = addMesh(group, new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width + 0.5, 24), '#c7cbd0', 'wheel-rim');
  rim.rotation.x = Math.PI / 2;
  const hub = addMesh(group, new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, width + 1, 20), '#4a5964', 'wheel-hub');
  hub.rotation.x = Math.PI / 2;
}

function createPanel(group, spec) {
  const [width = 32, height = 20, depth = 4] = spec.size || [];
  const transparent = Boolean(spec.transparent);
  const mesh = addMesh(group, new THREE.BoxGeometry(width, height, depth), spec.color, 'panel', transparent ? { transparent: true, opacity: 0.52, metalness: 0.12, roughness: 0.2 } : {});
  mesh.material.side = THREE.DoubleSide;
}

function createWindow(group, spec) {
  const [width = 28, height = 28, depth = 4] = spec.size || [];
  const frame = spec.color || '#f4f0e6';
  const bar = 3;
  const pane = addMesh(group, new THREE.BoxGeometry(width - bar * 2, height - bar * 2, depth * 0.32), '#8ed7df', 'window-glazing', { transparent: true, opacity: 0.48, roughness: 0.18, metalness: 0.08 });
  pane.position.z = -depth * 0.12;
  const parts = [
    [width, bar, depth, 0, height / 2 - bar / 2, 0],
    [width, bar, depth, 0, -height / 2 + bar / 2, 0],
    [bar, height, depth, -width / 2 + bar / 2, 0, 0],
    [bar, height, depth, width / 2 - bar / 2, 0, 0],
    [bar * 0.72, height - bar * 2, depth * 0.8, 0, 0, depth * 0.08]
  ];
  for (const [w, h, d, x, y, z] of parts) {
    const mesh = addMesh(group, new THREE.BoxGeometry(w, h, d), frame, 'window-frame');
    mesh.position.set(x, y, z);
  }
}

function createDoor(group, spec) {
  const [width = 18, height = 44, depth = 4] = spec.size || [];
  addMesh(group, new THREE.BoxGeometry(width, height, depth), spec.color || '#b76b3f', 'door-leaf');
  const glass = addMesh(group, new THREE.BoxGeometry(width * 0.55, height * 0.34, depth * 0.25), '#8ed7df', 'door-window', { transparent: true, opacity: 0.55, roughness: 0.2 });
  glass.position.set(0, height * 0.22, depth * 0.58);
  const knob = addMesh(group, new THREE.SphereGeometry(1.5, 12, 10), '#e5b84b', 'door-knob', { metalness: 0.55, roughness: 0.25 });
  knob.position.set(width * 0.32, -height * 0.08, depth * 0.72);
}

function createLeaf(group, spec) {
  const length = Number(spec.size?.[0]) || 18;
  const leaf = addMesh(group, new THREE.SphereGeometry(1, 20, 12), spec.color || '#398653', 'leaf-blade');
  leaf.scale.set(length * 0.52, 2.2, length * 0.23);
  leaf.rotation.z = -0.22;
  const stem = addMesh(group, new THREE.CylinderGeometry(0.7, 0.7, length * 0.48, 8), '#5b8b54', 'leaf-stem');
  stem.rotation.z = Math.PI / 2;
  stem.position.x = -length * 0.18;
}

function createDome(group, spec) {
  const radius = Number(spec.size?.[0]) || 7;
  addMesh(group, new THREE.SphereGeometry(radius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), spec.color || '#ffcf00', 'dome-cap', { roughness: 0.3, metalness: 0.12 });
}

function createRing(group, spec) {
  const [radius = 34, tube = 3] = spec.size || [];
  const mesh = addMesh(group, new THREE.TorusGeometry(radius, tube, 10, 64), spec.color || '#e5b84b', 'ring-element', { metalness: 0.38, roughness: 0.3 });
  mesh.rotation.x = Math.PI / 2;
}

function createCylinder(group, spec) {
  const [radius = 4, height = 10] = spec.size || [];
  addMesh(group, new THREE.CylinderGeometry(radius, radius, height, 24), spec.color, 'cylinder-element');
}

function createSphere(group, spec) {
  const [x = 5, y = 4, z = 4] = spec.size || [];
  const mesh = addMesh(group, new THREE.SphereGeometry(1, 24, 16), spec.color, 'sphere-element');
  mesh.scale.set(x, y, z);
}

export function createPart(spec) {
  const group = new THREE.Group();
  group.name = spec.name || spec.id || 'unnamed-part';
  switch (spec.type) {
    case 'brick':
    case 'plate':
    case 'tile':
    case 'jumper':
      createBrickLike(group, spec, spec.type);
      break;
    case 'slope':
      createSlope(group, spec);
      break;
    case 'beam':
      createBeam(group, spec);
      break;
    case 'pin':
      createPin(group, spec, false);
      break;
    case 'axle':
      createPin(group, spec, true);
      break;
    case 'gear':
      createGear(group, spec);
      break;
    case 'wheel':
      createWheel(group, spec);
      break;
    case 'panel':
      createPanel(group, spec);
      break;
    case 'window':
      createWindow(group, spec);
      break;
    case 'door':
      createDoor(group, spec);
      break;
    case 'leaf':
      createLeaf(group, spec);
      break;
    case 'dome':
      createDome(group, spec);
      break;
    case 'ring':
      createRing(group, spec);
      break;
    case 'cylinder':
      createCylinder(group, spec);
      break;
    case 'sphere':
      createSphere(group, spec);
      break;
    default:
      throw new Error('Unknown brick component type: ' + spec.type);
  }
  if (spec.pos) group.position.fromArray(spec.pos);
  if (spec.rotation) group.rotation.set(...spec.rotation);
  group.userData.partId = spec.id;
  group.userData.partName = spec.name;
  group.userData.partType = spec.type;
  group.userData.step = spec.step || 1;
  return group;
}

export function buildAssembly(model) {
  const root = new THREE.Group();
  root.name = model.title;
  const parts = [];
  const count = model.parts.length;
  model.parts.forEach((spec, index) => {
    const object = createPart(spec);
    const basePosition = object.position.clone();
    const fallback = new THREE.Vector3(basePosition.x * 0.24, 15 + (index % 3) * 5, basePosition.z * 0.24);
    if (fallback.lengthSq() < 1) fallback.set((index % 2 ? 1 : -1) * 18, 18, (index % 3 - 1) * 12);
    const explode = spec.explode ? new THREE.Vector3(...spec.explode) : fallback;
    object.userData.basePosition = basePosition;
    object.userData.explodeOffset = explode;
    object.userData.partIndex = index;
    root.add(object);
    parts.push(object);
  });
  root.userData.partCount = count;
  return { root, parts };
}

export const SYSTEM_DIMENSIONS = Object.freeze({
  studPitchMm: STUD,
  brickBodyHeightMm: BRICK_H,
  plateBodyHeightMm: PLATE_H,
  studDiameterMm: STUD_R * 2,
  studHeightMm: STUD_H
});
