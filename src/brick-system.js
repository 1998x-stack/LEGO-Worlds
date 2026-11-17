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
  const depth = Number(spec.size?.[1]) || 7.8;
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
  const hubOnly = spec.id === 'wheel-hub';
  if (!hubOnly) {
    const tire = addMesh(group, new THREE.CylinderGeometry(radius, radius, width, 32), spec.color || '#252d34', 'rubber-tire');
    tire.rotation.x = Math.PI / 2;
    if (spec.id === 'tire-offroad') {
      for (let i = 0; i < 18; i++) {
        const angle = i / 18 * Math.PI * 2;
        const lug = addMesh(group, new THREE.BoxGeometry(3.2, width + 0.6, 1.6), '#303941', 'offroad-tread-lug');
        lug.position.set(Math.cos(angle) * (radius + 0.45), Math.sin(angle) * (radius + 0.45), 0);
        lug.rotation.z = angle;
      }
    }
  }
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
  if (String(spec.id || '').startsWith('round-brick-')) {
    addStuds(group, 1, 1, height / 2 + STUD_H / 2, spec.color);
  }
}

function createSphere(group, spec) {
  const [x = 5, y = 4, z = 4] = spec.size || [];
  const mesh = addMesh(group, new THREE.SphereGeometry(1, 24, 16), spec.color, 'sphere-element');
  mesh.scale.set(x, y, z);
}


function addExtruded(group, shape, depth, color, name, options = {}) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  return addMesh(group, geometry, color, name, options);
}

function createCurvedSlope(group, spec, plate = false) {
  const [sx = 2, sz = 2] = spec.size || [];
  const width = sx * STUD - 0.2;
  const depth = sz * STUD - 0.2;
  const height = plate ? PLATE_H : BRICK_H;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height * 0.08);
  shape.quadraticCurveTo(width * 0.12, height * 0.72, -width / 2, height * 0.12);
  shape.lineTo(-width / 2, -height / 2);
  shape.closePath();
  addExtruded(group, shape, depth, spec.color, plate ? 'curved-tile' : 'curved-slope');
  if (!plate) addStuds(group, sx, sz, height / 2 + STUD_H / 2, spec.color);
}

function createArch(group, spec) {
  const [width = 32, height = 24, depth = 4, wall = 4] = spec.size || [];
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
  const innerW = Math.max(4, width - wall * 2);
  const innerH = Math.max(4, height - wall);
  const hole = new THREE.Path();
  hole.moveTo(-innerW / 2, -height / 2);
  hole.lineTo(innerW / 2, -height / 2);
  hole.lineTo(innerW / 2, 0);
  hole.quadraticCurveTo(innerW / 2, innerH * 0.55, 0, innerH / 2);
  hole.quadraticCurveTo(-innerW / 2, innerH * 0.55, -innerW / 2, 0);
  hole.lineTo(-innerW / 2, -height / 2);
  shape.holes.push(hole);
  addExtruded(group, shape, depth, spec.color, 'arch-frame');
}

function createCone(group, spec) {
  const [radius = 4, height = 9.6] = spec.size || [];
  addMesh(group, new THREE.ConeGeometry(radius, height, 24), spec.color, 'cone-element');
}

function createBracket(group, spec) {
  const [width = 16, height = 16, depth = 8, thickness = 3] = spec.size || [];
  const foot = addMesh(group, new THREE.BoxGeometry(width, thickness, depth), spec.color, 'bracket-foot');
  foot.position.y = -height / 2 + thickness / 2;
  const back = addMesh(group, new THREE.BoxGeometry(thickness, height, depth), spec.color, 'bracket-wall');
  back.position.x = -width / 2 + thickness / 2;
}

function createClip(group, spec) {
  const [opening = 7, depth = 8, thickness = 3] = spec.size || [];
  const outer = opening + thickness * 2;
  const base = addMesh(group, new THREE.BoxGeometry(outer, thickness, depth), spec.color, 'clip-base');
  base.position.y = -thickness / 2;
  for (const x of [-opening / 2 - thickness / 2, opening / 2 + thickness / 2]) {
    const arm = addMesh(group, new THREE.BoxGeometry(thickness, opening, depth), spec.color, 'clip-arm');
    arm.position.set(x, opening / 2 - thickness / 2, 0);
  }
}

function createBar(group, spec) {
  const [length = 32, radius = 2] = spec.size || [];
  const bar = addMesh(group, new THREE.CylinderGeometry(radius, radius, length, 18), spec.color, 'bar-element');
  bar.rotation.z = Math.PI / 2;
}

function createHinge(group, spec) {
  const [length = 24, leafWidth = 10, depth = 4] = spec.size || [];
  const left = addMesh(group, new THREE.BoxGeometry(length / 2, leafWidth, depth), spec.color, 'hinge-leaf-a');
  left.position.y = -leafWidth / 2;
  const right = addMesh(group, new THREE.BoxGeometry(length / 2, leafWidth, depth), spec.color, 'hinge-leaf-b');
  right.position.y = leafWidth / 2;
  const barrel = addMesh(group, new THREE.CylinderGeometry(depth * 0.48, depth * 0.48, length, 18), '#68747d', 'hinge-barrel');
  barrel.rotation.z = Math.PI / 2;
}

function createConnector(group, spec) {
  const [length = 14, radius = 2.8] = spec.size || [];
  addMesh(group, new THREE.SphereGeometry(radius, 20, 16), spec.color, 'connector-hub');
  for (const axis of ['x','z']) {
    const shaft = addMesh(group, new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, length, 16), spec.color, 'connector-shaft');
    if (axis === 'x') shaft.rotation.z = Math.PI / 2;
  }
}

function createCorner(group, spec) {
  const [width = 24, depth = 24, height = 4, thickness = 3] = spec.size || [];
  const a = addMesh(group, new THREE.BoxGeometry(width, height, thickness), spec.color, 'corner-arm-a');
  a.position.set(0, 0, -depth / 2 + thickness / 2);
  const b = addMesh(group, new THREE.BoxGeometry(thickness, height, depth), spec.color, 'corner-arm-b');
  b.position.set(-width / 2 + thickness / 2, 0, 0);
}

function createAngleBeam(group, spec) {
  const [horizontal = 3, vertical = 5] = spec.size || [];
  const a = new THREE.Group();
  createBeam(a, { ...spec, size: [horizontal, 7.8] });
  const b = new THREE.Group();
  createBeam(b, { ...spec, size: [vertical, 7.8] });
  b.rotation.z = Math.PI / 2;
  b.position.set(-horizontal * STUD / 2 + 3.9, vertical * STUD / 2 - 3.9, 0);
  group.add(a, b);
}

function createFrame(group, spec) {
  const [width = 40, height = 34, depth = 8, rail = 5] = spec.size || [];
  const vertices = [
    new THREE.Vector3(-width/2,-height/2,0),
    new THREE.Vector3(width/2,-height/2,0),
    new THREE.Vector3(0,height/2,0)
  ];
  for (let i = 0; i < 3; i++) {
    const a = vertices[i], b = vertices[(i+1)%3];
    const delta = b.clone().sub(a);
    const mesh = addMesh(group, new THREE.BoxGeometry(delta.length(),rail,depth), spec.color, 'triangle-frame-rail');
    mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
    mesh.rotation.z = Math.atan2(delta.y,delta.x);
  }
}

function createBushing(group, spec) {
  const [outer = 4, inner = 2.2, width = 2] = spec.size || [];
  const shape = new THREE.Shape();
  shape.absarc(0,0,outer,0,Math.PI*2,false);
  const hole = new THREE.Path();
  hole.absarc(0,0,inner,0,Math.PI*2,true);
  shape.holes.push(hole);
  addExtruded(group, shape, width, spec.color, 'axle-bushing');
}

function createWormGear(group, spec) {
  const [radius = 4, length = 24, turns = 4] = spec.size || [];
  const core = addMesh(group, new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, length, 20), spec.color, 'worm-core');
  core.rotation.x = Math.PI / 2;
  const points = [];
  const samples = Math.max(48, turns * 24);
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const angle = t * turns * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius * 0.88, Math.sin(angle) * radius * 0.88, (t - 0.5) * length));
  }
  const helix = new THREE.CatmullRomCurve3(points);
  addMesh(group, new THREE.TubeGeometry(helix, samples, Math.max(0.65, radius * 0.2), 6, false), '#d8dce0', 'worm-thread', { metalness: 0.42, roughness: 0.3 });
}

function createRackGear(group, spec) {
  const [length = 48, teeth = 10, thickness = 3] = spec.size || [];
  const base = addMesh(group, new THREE.BoxGeometry(length, thickness * 2, thickness), spec.color, 'rack-base');
  base.position.y = -thickness / 2;
  for (let i = 0; i < teeth; i++) {
    const x = (i - (teeth - 1) / 2) * (length / teeth);
    const tooth = addMesh(group, new THREE.BoxGeometry(length / teeth * 0.62, thickness * 1.25, thickness), spec.color, 'rack-tooth');
    tooth.position.set(x, thickness * 1.05, 0);
  }
}

function createBevelGear(group, spec) {
  const [radius = 8, teeth = 12, thickness = 4] = spec.size || [];
  const cone = addMesh(group, new THREE.ConeGeometry(radius, thickness * 1.6, Math.max(16, teeth)), spec.color, 'bevel-gear-cone');
  cone.rotation.x = Math.PI / 2;
  const hub = addMesh(group, new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, thickness * 2, 18), '#d8dce0', 'bevel-hub');
  hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < teeth; i++) {
    const a = i / teeth * Math.PI * 2;
    const tooth = addMesh(group, new THREE.BoxGeometry(2.2, 2.2, thickness), spec.color, 'bevel-tooth');
    tooth.position.set(Math.cos(a) * radius * 0.82, Math.sin(a) * radius * 0.82, 0);
    tooth.rotation.z = a;
  }
}

function createTurntable(group, spec) {
  const [radius = 16, height = 5] = spec.size || [];
  addMesh(group, new THREE.CylinderGeometry(radius, radius, height * 0.42, 48), '#303941', 'turntable-base');
  const upper = addMesh(group, new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, height * 0.32, 48), spec.color, 'turntable-top');
  upper.position.y = height * 0.32;
  const race = addMesh(group, new THREE.TorusGeometry(radius * 0.72, Math.max(0.7, height * 0.08), 8, 48), '#d8dce0', 'turntable-race', { metalness: 0.5 });
  race.rotation.x = Math.PI / 2;
  race.position.y = height * 0.05;
}

function createDifferential(group, spec) {
  const [radius = 12, width = 18] = spec.size || [];
  const caseMesh = addMesh(group, new THREE.SphereGeometry(radius, 24, 18), spec.color, 'differential-case');
  caseMesh.scale.z = width / (radius * 2);
  for (const sign of [-1,1]) {
    const axle = addMesh(group, new THREE.CylinderGeometry(2,2,width * 0.7,16), '#b7c1c9', 'differential-output');
    axle.rotation.x = Math.PI / 2;
    axle.position.z = sign * (width * 0.55);
  }
  const ring = addMesh(group, new THREE.TorusGeometry(radius * 0.76, 1.2, 8, 28), '#d8dce0', 'differential-ring');
  ring.rotation.x = Math.PI / 2;
}

function createTrack(group, spec) {
  const [radius = 8, spacing = 28, treadWidth = 8, links = 18] = spec.size || [];
  if (links <= 1) {
    const shoe = addMesh(group, new THREE.BoxGeometry(spacing, 3.2, treadWidth), spec.color, 'single-track-shoe');
    for (const x of [-spacing * 0.35, spacing * 0.35]) {
      const pin = addMesh(group, new THREE.CylinderGeometry(1.4,1.4,treadWidth + 1,12), '#b7c1c9', 'track-link-pin');
      pin.rotation.x = Math.PI / 2;
      pin.position.x = x;
    }
    return;
  }
  for (const sign of [-1,1]) {
    const wheel = addMesh(group, new THREE.CylinderGeometry(radius, radius, treadWidth * 0.72, 24), '#252d34', 'track-idler');
    wheel.rotation.x = Math.PI / 2;
    wheel.position.x = sign * spacing / 2;
  }
  const half = spacing / 2;
  const perimeter = 2 * spacing + 2 * Math.PI * radius;
  const step = perimeter / links;
  for (let i = 0; i < links; i++) {
    const d = i * step;
    let x, y, angle;
    if (d < spacing) {
      x = -half + d; y = radius; angle = 0;
    } else if (d < spacing + Math.PI * radius) {
      const a = (d - spacing) / radius - Math.PI / 2;
      x = half + Math.cos(a) * radius; y = radius + Math.sin(a) * radius; angle = a + Math.PI / 2;
    } else if (d < 2 * spacing + Math.PI * radius) {
      const local = d - spacing - Math.PI * radius;
      x = half - local; y = -radius; angle = Math.PI;
    } else {
      const a = (d - 2 * spacing - Math.PI * radius) / radius + Math.PI / 2;
      x = -half + Math.cos(a) * radius; y = -radius + Math.sin(a) * radius; angle = a + Math.PI / 2;
    }
    const link = addMesh(group, new THREE.BoxGeometry(step * 0.94, 3.2, treadWidth), spec.color, 'track-link');
    link.position.set(x, y, 0);
    link.rotation.z = angle;
  }
}

function createFlower(group, spec) {
  const [radius = 5, stemLength = 18] = spec.size || [];
  const stem = addMesh(group, new THREE.CylinderGeometry(0.7,0.9,stemLength,8), '#398653', 'flower-stem');
  stem.position.y = -stemLength / 2;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const petal = addMesh(group, new THREE.SphereGeometry(1,14,10), spec.color, 'flower-petal');
    petal.scale.set(radius * 0.65, radius * 0.32, radius * 0.42);
    petal.position.set(Math.cos(a) * radius * 0.72, stemLength * 0.1, Math.sin(a) * radius * 0.72);
  }
  const center = addMesh(group, new THREE.SphereGeometry(radius * 0.34,16,12), '#f4a62a', 'flower-center');
  center.position.y = stemLength * 0.1;
}

function createTreeTrunk(group, spec) {
  const [height = 34, radius = 5] = spec.size || [];
  const trunk = addMesh(group, new THREE.CylinderGeometry(radius * 0.75, radius, height, 12), spec.color, 'tree-trunk');
  trunk.position.y = height / 2;
  for (let i = 0; i < 3; i++) {
    const branch = addMesh(group, new THREE.CylinderGeometry(radius * 0.22, radius * 0.35, height * 0.38, 8), spec.color, 'tree-branch');
    branch.position.set((i - 1) * radius * 1.2, height * (0.55 + (i % 2) * 0.12), 0);
    branch.rotation.z = (i - 1) * 0.45;
  }
}

function createRock(group, spec) {
  const [radius = 10] = spec.size || [];
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const factor = 0.86 + ((i * 17) % 11) / 50;
    positions.setXYZ(i, x * factor, y * factor * 0.68, z * factor);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  addMesh(group, geometry, spec.color, 'rock-mesh');
}

function createSpring(group, spec) {
  const [radius = 4, height = 24, turns = 5] = spec.size || [];
  const points = [];
  const samples = Math.max(48, turns * 24);
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const a = t * turns * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, (t - 0.5) * height, Math.sin(a) * radius));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  addMesh(group, new THREE.TubeGeometry(curve, samples, 0.8, 8, false), spec.color, 'spring-coil', { metalness: 0.5, roughness: 0.3 });
}

function createTransparentShell(group, spec) {
  const [radius = 14] = spec.size || [];
  addMesh(group, new THREE.SphereGeometry(radius, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), spec.color, 'transparent-shell', { transparent: true, opacity: 0.32, roughness: 0.12, metalness: 0.08, side: THREE.DoubleSide });
}

function createLightBrick(group, spec) {
  createBrickLike(group, spec, 'brick');
  const lens = addMesh(group, new THREE.SphereGeometry(2.4, 18, 12), '#fff1a6', 'light-lens', { emissive: '#ffcf00', emissiveIntensity: 0.55, roughness: 0.2 });
  lens.position.set(0, BRICK_H / 2 + STUD_H + 1.2, 0);
}

function createGrille(group, spec) {
  const [width = 40, height = 24, depth = 3, slats = 7] = spec.size || [];
  addMesh(group, new THREE.BoxGeometry(width,height,depth), spec.color, 'grille-frame');
  for (let i = 0; i < slats; i++) {
    const x = (i - (slats - 1) / 2) * (width / (slats + 1));
    const bar = addMesh(group, new THREE.BoxGeometry(1.4,height * 0.84,depth * 1.25), '#303941', 'grille-slat');
    bar.position.x = x;
  }
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
    case 'wedge':
      createSlope(group, spec);
      break;
    case 'inverted-slope':
      createSlope(group, spec);
      group.scale.y = -1;
      break;
    case 'curved-slope':
      createCurvedSlope(group, spec, false);
      break;
    case 'curved-tile':
      createCurvedSlope(group, spec, true);
      break;
    case 'arch':
      createArch(group, spec);
      break;
    case 'cone':
      createCone(group, spec);
      break;
    case 'bracket':
      createBracket(group, spec);
      break;
    case 'clip':
      createClip(group, spec);
      break;
    case 'bar':
      createBar(group, spec);
      break;
    case 'hinge':
      createHinge(group, spec);
      break;
    case 'connector':
      createConnector(group, spec);
      break;
    case 'corner':
      createCorner(group, spec);
      break;
    case 'angle-beam':
      createAngleBeam(group, spec);
      break;
    case 'frame':
      createFrame(group, spec);
      break;
    case 'bushing':
      createBushing(group, spec);
      break;
    case 'worm-gear':
      createWormGear(group, spec);
      break;
    case 'rack-gear':
      createRackGear(group, spec);
      break;
    case 'bevel-gear':
      createBevelGear(group, spec);
      break;
    case 'turntable':
      createTurntable(group, spec);
      break;
    case 'differential':
      createDifferential(group, spec);
      break;
    case 'track':
      createTrack(group, spec);
      break;
    case 'flower':
      createFlower(group, spec);
      break;
    case 'tree-trunk':
      createTreeTrunk(group, spec);
      break;
    case 'rock':
      createRock(group, spec);
      break;
    case 'spring':
      createSpring(group, spec);
      break;
    case 'transparent-shell':
      createTransparentShell(group, spec);
      break;
    case 'light-brick':
      createLightBrick(group, spec);
      break;
    case 'grille':
      createGrille(group, spec);
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
