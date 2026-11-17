import * as THREE from 'three';

export const ANCHOR_SCHEMA_VERSION = 1;
export const ANCHOR_UNITS = 'mm';

export const ANCHOR_KINDS = Object.freeze({
  STUD: 'stud', STUD_SOCKET: 'stud-socket', TECHNIC_HOLE: 'technic-hole',
  PIN: 'pin', AXLE: 'axle', AXLE_HOLE: 'axle-hole', GEAR_AXIS: 'gear-axis',
  GEAR_MESH: 'gear-mesh', RACK_MESH: 'rack-mesh', CLIP: 'clip', BAR: 'bar',
  BALL: 'ball', BALL_SOCKET: 'ball-socket', HINGE_AXIS: 'hinge-axis',
  WHEEL_AXIS: 'wheel-axis', ROTARY_AXIS: 'rotary-axis', TRACK_JOINT: 'track-joint',
  PANEL_MOUNT: 'panel-mount', SURFACE_MOUNT: 'surface-mount',
  DECORATIVE_MOUNT: 'decorative-mount', SPRING_END: 'spring-end'
});

export const ANCHOR_COMPATIBILITY = Object.freeze({
  'stud': ['stud-socket'], 'stud-socket': ['stud'],
  'technic-hole': ['pin', 'axle'], 'pin': ['technic-hole'],
  'axle': ['technic-hole', 'axle-hole', 'gear-axis', 'wheel-axis'],
  'axle-hole': ['axle'], 'gear-axis': ['axle'], 'wheel-axis': ['axle'],
  'clip': ['bar'], 'bar': ['clip'], 'ball': ['ball-socket'],
  'ball-socket': ['ball'], 'hinge-axis': ['hinge-axis'],
  'gear-mesh': ['gear-mesh'], 'rack-mesh': ['gear-mesh'],
  'rotary-axis': ['rotary-axis'], 'track-joint': ['track-joint'],
  'panel-mount': ['panel-mount'], 'surface-mount': ['surface-mount', 'spring-end'],
  'spring-end': ['surface-mount'], 'decorative-mount': ['decorative-mount']
});

const STUD_PITCH = 8;
const BRICK_HEIGHT = 9.6;
const PLATE_HEIGHT = 3.2;
const STUD_DIAMETER = 4.8;
const STUD_HEIGHT = 1.7;
const DEFAULT_UP = [0, 0, 1];

const normalize = vector => {
  const length = Math.hypot(...vector);
  return length > 1e-9 ? vector.map(value => value / length) : [0, 1, 0];
};
const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
const isRoundBrick = id => String(id || '').startsWith('round-brick-');

function gridPositions(widthStuds, depthStuds, single = false) {
  const width = Math.max(1, Math.round(Number(widthStuds) || 1));
  const depth = Math.max(1, Math.round(Number(depthStuds) || 1));
  const positions = [];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      if (single && !(x === Math.floor((width - 1) / 2) && z === Math.floor((depth - 1) / 2))) continue;
      positions.push([(x - (width - 1) / 2) * STUD_PITCH, (z - (depth - 1) / 2) * STUD_PITCH]);
    }
  }
  return positions;
}

export function getPartAnchors(spec = {}) {
  const anchors = [];
  const partId = String(spec.id || spec.name || 'part');
  const size = Array.isArray(spec.size) ? spec.size : [];
  const type = spec.type || 'unknown';

  const add = (kind, role, position, options = {}) => {
    const normal = normalize(options.normal || [0, 1, 0]);
    const axis = options.axis ? normalize(options.axis) : null;
    anchors.push({
      id: partId + ':' + kind + ':' + String(anchors.length + 1).padStart(3, '0'),
      partId, kind, role,
      position: position.map(Number),
      normal,
      up: normalize(options.up || DEFAULT_UP),
      axis,
      size: { ...(options.size || {}) },
      accepts: [...(options.accepts || ANCHOR_COMPATIBILITY[kind] || [])],
      source: options.source || 'procedural-interface',
      confidence: options.confidence || 'nominal'
    });
  };

  const addStudGrid = (width, depth, y, normal, single = false) => {
    for (const [x, z] of gridPositions(width, depth, single)) {
      add(ANCHOR_KINDS.STUD, 'male', [x, y, z], {
        normal, size: { diameterMm: STUD_DIAMETER, heightMm: STUD_HEIGHT, pitchMm: STUD_PITCH }
      });
    }
  };
  const addSocketGrid = (width, depth, y, normal) => {
    for (const [x, z] of gridPositions(width, depth)) {
      add(ANCHOR_KINDS.STUD_SOCKET, 'female', [x, y, z], {
        normal, size: { diameterMm: 5.15, depthMm: 5.5, pitchMm: STUD_PITCH },
        confidence: 'nominal-interface'
      });
    }
  };
  const addBeamHoles = (length, depth, transform = point => point) => {
    const count = Math.max(2, Math.round(Number(length) || 2));
    for (let index = 0; index < count; index++) {
      const x = (index - (count - 1) / 2) * STUD_PITCH;
      add(ANCHOR_KINDS.TECHNIC_HOLE, 'female', transform([x, 0, 0]), {
        normal: [0, 0, 1], axis: [0, 0, 1],
        size: { diameterMm: 4.9, pitchMm: STUD_PITCH, throughDepthMm: Number(depth) || 7.8 }
      });
    }
  };
  const addPanelFaceAnchors = (width, height, depth, inset = 3) => {
    for (const sign of [-1, 1]) {
      for (const x of [-1, 1]) {
        for (const y of [-1, 1]) {
          add(ANCHOR_KINDS.PANEL_MOUNT, 'neutral', [
            x * (width / 2 - inset), y * (height / 2 - inset), sign * depth / 2
          ], {
            normal: [0, 0, sign],
            size: { face: 'panel', widthMm: width, heightMm: height, depthMm: depth }
          });
        }
      }
    }
  };

  switch (type) {
    case 'brick':
    case 'plate':
    case 'tile':
    case 'jumper':
    case 'light-brick': {
      const width = size[0] || 1;
      const depth = size[1] || 1;
      const bodyHeight = type === 'brick' || type === 'light-brick' ? BRICK_HEIGHT : PLATE_HEIGHT;
      if (type === 'brick' || type === 'plate' || type === 'jumper' || type === 'light-brick') {
        addStudGrid(width, depth, bodyHeight / 2 + STUD_HEIGHT, [0, 1, 0], type === 'jumper');
      }
      addSocketGrid(width, depth, -bodyHeight / 2, [0, -1, 0]);
      break;
    }
    case 'cylinder': {
      const radius = Number(size[0]) || 4;
      const height = Number(size[1]) || 10;
      if (isRoundBrick(spec.id)) {
        addStudGrid(1, 1, height / 2 + STUD_HEIGHT, [0, 1, 0], true);
        addSocketGrid(1, 1, -height / 2, [0, -1, 0]);
      } else {
        add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [0, height / 2, 0], {
          normal: [0, 1, 0], size: { diameterMm: radius * 2 }
        });
        add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [0, -height / 2, 0], {
          normal: [0, -1, 0], size: { diameterMm: radius * 2 }
        });
      }
      break;
    }
    case 'slope':
    case 'wedge':
    case 'curved-slope':
    case 'curved-tile': {
      const bodyHeight = type === 'curved-tile' ? PLATE_HEIGHT : BRICK_HEIGHT;
      addSocketGrid(size[0] || 2, size[1] || 2, -bodyHeight / 2, [0, -1, 0]);
      break;
    }
    case 'inverted-slope':
      addSocketGrid(size[0] || 2, size[1] || 2, BRICK_HEIGHT / 2, [0, 1, 0]);
      break;
    case 'arch': {
      const [width = 32, height = 24, depth = 4, wall = 4] = size;
      for (const sign of [-1, 1]) {
        add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [sign * (width / 2 - wall / 2), -height / 2, 0], {
          normal: [0, -1, 0], size: { footWidthMm: wall, depthMm: depth }
        });
      }
      break;
    }
    case 'dome': {
      const radius = Number(size[0]) || 8;
      add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [0, 0, 0], {
        normal: [0, -1, 0], size: { diameterMm: radius * 2 }
      });
      break;
    }
    case 'cone': {
      const height = Number(size[1]) || 9.6;
      add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [0, -height / 2, 0], {
        normal: [0, -1, 0], size: { diameterMm: (Number(size[0]) || 4) * 2 }
      });
      break;
    }
    case 'bracket': {
      const [width = 16, height = 16, depth = 8, thickness = 3] = size;
      add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [0, -height / 2 + thickness, 0], {
        normal: [0, 1, 0], size: { widthMm: width, depthMm: depth }
      });
      add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [-width / 2, 0, 0], {
        normal: [-1, 0, 0], size: { heightMm: height, depthMm: depth }
      });
      break;
    }
    case 'clip': {
      const [opening = 7, depth = 8, thickness = 3] = size;
      add(ANCHOR_KINDS.CLIP, 'female', [0, opening / 2, 0], {
        normal: [0, 1, 0], axis: [1, 0, 0],
        size: { openingMm: opening, depthMm: depth, wallThicknessMm: thickness }
      });
      break;
    }
    case 'bar': {
      const [length = 32, radius = 2] = size;
      add(ANCHOR_KINDS.BAR, 'male', [0, 0, 0], {
        normal: [1, 0, 0], axis: [1, 0, 0],
        size: { diameterMm: radius * 2, lengthMm: length }
      });
      break;
    }
    case 'hinge': {
      const [length = 24, leafWidth = 10, depth = 4] = size;
      add(ANCHOR_KINDS.HINGE_AXIS, 'neutral', [0, 0, 0], {
        normal: [0, 1, 0], axis: [1, 0, 0],
        size: { diameterMm: depth * 0.96, lengthMm: length }
      });
      add(ANCHOR_KINDS.PANEL_MOUNT, 'neutral', [-length / 4, -leafWidth / 2, 0], {
        normal: [0, 0, 1], size: { widthMm: length / 2, heightMm: leafWidth }
      });
      add(ANCHOR_KINDS.PANEL_MOUNT, 'neutral', [length / 4, leafWidth / 2, 0], {
        normal: [0, 0, 1], size: { widthMm: length / 2, heightMm: leafWidth }
      });
      break;
    }
    case 'connector': {
      const [length = 14, radius = 2.8] = size;
      if (spec.id === 'ball-joint') {
        add(ANCHOR_KINDS.BALL, 'male', [0, 0, 0], {
          normal: [0, 1, 0], size: { diameterMm: radius * 2 }
        });
      } else if (spec.id === 'socket-joint') {
        add(ANCHOR_KINDS.BALL_SOCKET, 'female', [0, 0, 0], {
          normal: [0, -1, 0], size: { diameterMm: 6 }
        });
      } else {
        const kind = spec.id === 'axle-connector' ? ANCHOR_KINDS.AXLE : ANCHOR_KINDS.PIN;
        for (const axis of [[1, 0, 0], [0, 1, 0]]) {
          for (const sign of [-1, 1]) {
            add(kind, 'male', axis.map(value => value * sign * length / 2), {
              normal: axis.map(value => value * sign), axis,
              size: { diameterMm: radius * 1.16, lengthMm: length }
            });
          }
        }
      }
      break;
    }
    case 'corner': {
      const [width = 24, depth = 24, height = 4, thickness = 3] = size;
      add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [0, height / 2, -depth / 2 + thickness / 2], {
        normal: [0, 1, 0], size: { widthMm: width, depthMm: thickness }
      });
      add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [-width / 2 + thickness / 2, height / 2, 0], {
        normal: [0, 1, 0], size: { widthMm: thickness, depthMm: depth }
      });
      break;
    }
    case 'beam': {
      const [length = 5, depth = 7.8] = size;
      addBeamHoles(length, depth);
      break;
    }
    case 'angle-beam': {
      const [horizontal = 3, vertical = 5] = size;
      addBeamHoles(horizontal, 7.8);
      const offsetX = -horizontal * STUD_PITCH / 2 + 3.9;
      const offsetY = vertical * STUD_PITCH / 2 - 3.9;
      addBeamHoles(vertical, 7.8, ([x, y, z]) => [offsetX, offsetY + x, z]);
      break;
    }
    case 'frame': {
      const [width = 40, height = 34, depth = 8] = size;
      for (const [x, y] of [[-width / 2, -height / 2], [width / 2, -height / 2], [0, height / 2]]) {
        add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [x, y, depth / 2], {
          normal: [0, 0, 1], size: { railDepthMm: depth }
        });
      }
      break;
    }
    case 'pin': {
      const length = Number(size[0]) || 12;
      const friction = spec.id === 'friction-pin';
      add(ANCHOR_KINDS.PIN, 'male', [0, 0, 0], {
        normal: [0, 0, 1], axis: [0, 0, 1],
        size: { diameterMm: 4.5, lengthMm: length, fit: friction ? 'friction' : 'smooth' }
      });
      break;
    }
    case 'axle': {
      const length = Number(size[0]) || 24;
      add(ANCHOR_KINDS.AXLE, 'male', [0, 0, 0], {
        normal: [0, 0, 1], axis: [0, 0, 1],
        size: { diameterMm: 3.5, lengthMm: length, section: 'round-schematic' },
        confidence: 'schematic'
      });
      break;
    }
    case 'bushing': {
      const [outer = 4, inner = 2.2, width = 2] = size;
      add(ANCHOR_KINDS.AXLE_HOLE, 'female', [0, 0, 0], {
        normal: [0, 0, 1], axis: [0, 0, 1],
        size: { diameterMm: inner * 2, outerDiameterMm: outer * 2, depthMm: width }
      });
      break;
    }
    case 'gear': {
      const [radius = 8, teeth = 16, thickness = 3.2] = size;
      add(ANCHOR_KINDS.GEAR_AXIS, 'neutral', [0, 0, 0], {
        normal: [0, 0, 1], axis: [0, 0, 1],
        size: { diameterMm: radius * 0.26, depthMm: thickness + 1.1 }
      });
      add(ANCHOR_KINDS.GEAR_MESH, 'neutral', [0, 0, 0], {
        normal: [0, 1, 0], axis: [0, 0, 1],
        size: { pitchRadiusMm: radius, teeth, moduleMm: 2 * radius / teeth, profile: 'spur' }
      });
      break;
    }
    case 'worm-gear': {
      const [radius = 4, length = 24] = size;
      add(ANCHOR_KINDS.AXLE, 'male', [0, 0, 0], {
        normal: [0, 0, 1], axis: [0, 0, 1],
        size: { diameterMm: radius * 1.44, lengthMm: length, section: 'round-schematic' },
        confidence: 'schematic'
      });
      add(ANCHOR_KINDS.GEAR_MESH, 'neutral', [0, 0, 0], {
        normal: [0, 1, 0], axis: [0, 0, 1],
        size: { pitchRadiusMm: radius, profile: 'worm' }
      });
      break;
    }
    case 'rack-gear': {
      const [length = 48, teeth = 10, thickness = 3] = size;
      add(ANCHOR_KINDS.RACK_MESH, 'neutral', [0, thickness, 0], {
        normal: [0, 1, 0], axis: [1, 0, 0],
        size: { lengthMm: length, teeth, pitchMm: length / teeth, profile: 'rack' }
      });
      break;
    }
    case 'bevel-gear': {
      const [radius = 8, teeth = 12, thickness = 4] = size;
      add(ANCHOR_KINDS.GEAR_AXIS, 'neutral', [0, 0, 0], {
        normal: [0, 0, 1], axis: [0, 0, 1],
        size: { diameterMm: radius * 0.48, depthMm: thickness * 2 }
      });
      add(ANCHOR_KINDS.GEAR_MESH, 'neutral', [0, 0, 0], {
        normal: [0, 1, 0], axis: [0, 0, 1],
        size: { pitchRadiusMm: radius, teeth, moduleMm: 2 * radius / teeth, profile: 'bevel' }
      });
      break;
    }
    case 'turntable': {
      const [radius = 16, height = 5] = size;
      add(ANCHOR_KINDS.ROTARY_AXIS, 'neutral', [0, 0, 0], {
        normal: [0, 1, 0], axis: [0, 1, 0],
        size: { diameterMm: radius * 2, heightMm: height }
      });
      add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [0, height * 0.48, 0], {
        normal: [0, 1, 0], size: { diameterMm: radius * 1.8 }
      });
      add(ANCHOR_KINDS.SURFACE_MOUNT, 'neutral', [0, -height * 0.21, 0], {
        normal: [0, -1, 0], size: { diameterMm: radius * 2 }
      });
      break;
    }
    case 'differential': {
      const [radius = 12, width = 18] = size;
      for (const sign of [-1, 1]) {
        add(ANCHOR_KINDS.AXLE, 'male', [0, 0, sign * width * 0.9], {
          normal: [0, 0, sign], axis: [0, 0, 1],
          size: { diameterMm: 4, exposedLengthMm: width * 0.35 }
        });
      }
      add(ANCHOR_KINDS.GEAR_AXIS, 'neutral', [0, 0, 0], {
        normal: [0, 0, 1], axis: [0, 0, 1], size: { diameterMm: radius * 0.3 }
      });
      break;
    }
    case 'wheel': {
      const [radius = 10, width = 7] = size;
      add(ANCHOR_KINDS.WHEEL_AXIS, 'neutral', [0, 0, 0], {
        normal: [0, 0, 1], axis: [0, 0, 1],
        size: { diameterMm: radius * 0.44, wheelDiameterMm: radius * 2, widthMm: width },
        confidence: 'schematic'
      });
      break;
    }
    case 'track': {
      if (spec.id === 'track-link') {
        const spacing = Number(size[1]) || 20;
        for (const sign of [-1, 1]) {
          add(ANCHOR_KINDS.TRACK_JOINT, 'neutral', [sign * spacing * 0.35, 0, 0], {
            normal: [sign, 0, 0], axis: [0, 0, 1],
            size: { diameterMm: 2.8, pinSpacingMm: spacing * 0.7 }
          });
        }
      } else {
        const spacing = Number(size[1]) || 28;
        for (const sign of [-1, 1]) {
          add(ANCHOR_KINDS.WHEEL_AXIS, 'neutral', [sign * spacing / 2, 0, 0], {
            normal: [0, 0, 1], axis: [0, 0, 1],
            size: { diameterMm: 4, wheelSpacingMm: spacing }
          });
        }
      }
      break;
    }
    case 'panel':
    case 'window':
    case 'door':
    case 'grille': {
      const [width = 32, height = 20, depth = 4] = size;
      addPanelFaceAnchors(width, height, depth, Math.min(3, width / 4, height / 4));
      if (type === 'door') {
        add(ANCHOR_KINDS.HINGE_AXIS, 'neutral', [-width / 2, 0, 0], {
          normal: [-1, 0, 0], axis: [0, 1, 0],
          size: { lengthMm: height, doorHinge: true }
        });
      }
      break;
    }
    case 'leaf': {
      const length = Number(size[0]) || 18;
      add(ANCHOR_KINDS.DECORATIVE_MOUNT, 'neutral', [-length * 0.42, 0, 0], {
        normal: [-1, 0, 0], size: { stemDiameterMm: 1.4 }
      });
      break;
    }
    case 'flower': {
      const stemLength = Number(size[1]) || 18;
      add(ANCHOR_KINDS.DECORATIVE_MOUNT, 'neutral', [0, -stemLength, 0], {
        normal: [0, -1, 0], size: { stemDiameterMm: 1.8 }
      });
      break;
    }
    case 'tree-trunk': {
      const [height = 34, radius = 5] = size;
      add(ANCHOR_KINDS.DECORATIVE_MOUNT, 'neutral', [0, 0, 0], {
        normal: [0, -1, 0], size: { diameterMm: radius * 2 }
      });
      for (let index = 0; index < 3; index++) {
        add(ANCHOR_KINDS.DECORATIVE_MOUNT, 'neutral', [
          (index - 1) * radius * 1.2,
          height * (0.55 + (index % 2) * 0.12) + height * 0.19,
          0
        ], { normal: [index - 1, 1, 0], size: { branchRadiusMm: radius * 0.35 } });
      }
      break;
    }
    case 'rock': {
      const radius = Number(size[0]) || 10;
      add(ANCHOR_KINDS.DECORATIVE_MOUNT, 'neutral', [0, -radius * 0.68, 0], {
        normal: [0, -1, 0], size: { approximateDiameterMm: radius * 2 }
      });
      break;
    }
    case 'spring': {
      const [radius = 4, height = 24] = size;
      for (const sign of [-1, 1]) {
        add(ANCHOR_KINDS.SPRING_END, 'neutral', [0, sign * height / 2, 0], {
          normal: [0, sign, 0], axis: [0, 1, 0], size: { diameterMm: radius * 2 }
        });
      }
      break;
    }
    case 'transparent-shell': {
      const radius = Number(size[0]) || 14;
      for (const [x, z] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        add(ANCHOR_KINDS.PANEL_MOUNT, 'neutral', [x * radius, 0, z * radius], {
          normal: [0, -1, 0], size: { rimRadiusMm: radius }
        });
      }
      break;
    }
    case 'ring': {
      const [radius = 34, tube = 3] = size;
      add(ANCHOR_KINDS.ROTARY_AXIS, 'neutral', [0, 0, 0], {
        normal: [0, 1, 0], axis: [0, 1, 0], size: { radiusMm: radius, tubeMm: tube }
      });
      break;
    }
    case 'sphere':
      add(ANCHOR_KINDS.DECORATIVE_MOUNT, 'neutral', [0, 0, 0], {
        normal: [0, 1, 0], size: { point: 'center' }, confidence: 'schematic'
      });
      break;
    default:
      break;
  }
  return anchors;
}

export function getAssemblyAnchors(model = {}) {
  const parts = Array.isArray(model.parts) ? model.parts : [];
  const anchors = [];
  parts.forEach((spec, partIndex) => {
    const partId = String(spec.id || 'part-' + (partIndex + 1));
    const rotation = Array.isArray(spec.rotation) ? spec.rotation : [0, 0, 0];
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Number(rotation[0]) || 0, Number(rotation[1]) || 0, Number(rotation[2]) || 0, 'XYZ')
    );
    const origin = new THREE.Vector3(...(spec.pos || [0, 0, 0]));
    const instanceId = partId + '#' + partIndex;
    for (const anchor of getPartAnchors({ ...spec, id: partId })) {
      const position = new THREE.Vector3(...anchor.position).applyQuaternion(quaternion).add(origin);
      const normal = new THREE.Vector3(...anchor.normal).applyQuaternion(quaternion).normalize();
      const up = new THREE.Vector3(...anchor.up).applyQuaternion(quaternion).normalize();
      const axis = anchor.axis
        ? new THREE.Vector3(...anchor.axis).applyQuaternion(quaternion).normalize()
        : null;
      anchors.push({
        ...anchor,
        id: instanceId + ':' + anchor.id.slice(partId.length + 1),
        instanceId, partIndex,
        position: position.toArray(),
        normal: normal.toArray(),
        up: up.toArray(),
        axis: axis?.toArray() || null
      });
    }
  });
  return anchors;
}

const pairKey = (a, b) => [a, b].sort().join('|');
const AXIS_PARALLEL_PAIRS = new Set([
  pairKey('technic-hole', 'pin'), pairKey('technic-hole', 'axle'),
  pairKey('axle-hole', 'axle'), pairKey('gear-axis', 'axle'),
  pairKey('wheel-axis', 'axle'), pairKey('clip', 'bar'),
  pairKey('hinge-axis', 'hinge-axis'), pairKey('gear-mesh', 'gear-mesh'),
  pairKey('rotary-axis', 'rotary-axis'), pairKey('track-joint', 'track-joint')
]);
const FACE_OPPOSED_PAIRS = new Set([
  pairKey('stud', 'stud-socket'), pairKey('surface-mount', 'surface-mount'),
  pairKey('panel-mount', 'panel-mount'), pairKey('surface-mount', 'spring-end')
]);

function compareDimensions(a, b, toleranceMm) {
  const aSize = a.size || {};
  const bSize = b.size || {};
  const pair = pairKey(a.kind, b.kind);
  if (pair === pairKey('stud', 'stud-socket')) {
    const delta = Math.abs((aSize.diameterMm || 0) - (bSize.diameterMm || 0));
    return { compatible: delta <= toleranceMm, delta, reason: delta <= toleranceMm ? 'stud-diameter-compatible' : 'stud-diameter-mismatch' };
  }
  if (pair === pairKey('technic-hole', 'pin') || pair === pairKey('technic-hole', 'axle') ||
      pair === pairKey('axle-hole', 'axle') || pair === pairKey('gear-axis', 'axle') ||
      pair === pairKey('wheel-axis', 'axle')) {
    const delta = Math.abs((aSize.diameterMm || 0) - (bSize.diameterMm || 0));
    return { compatible: delta <= toleranceMm + 0.9, delta, reason: delta <= toleranceMm + 0.9 ? 'shaft-diameter-compatible' : 'shaft-diameter-mismatch' };
  }
  if (pair === pairKey('clip', 'bar')) {
    const diameter = a.kind === 'bar' ? aSize.diameterMm : bSize.diameterMm;
    const opening = a.kind === 'clip' ? aSize.openingMm : bSize.openingMm;
    const compatible = Number.isFinite(diameter) && Number.isFinite(opening) && diameter <= opening + toleranceMm;
    return { compatible, delta: opening - diameter, reason: compatible ? 'bar-fits-clip-opening' : 'bar-exceeds-clip-opening' };
  }
  if (pair === pairKey('ball', 'ball-socket')) {
    const delta = Math.abs((aSize.diameterMm || 0) - (bSize.diameterMm || 0));
    return { compatible: delta <= toleranceMm + 0.8, delta, reason: delta <= toleranceMm + 0.8 ? 'ball-and-socket-size-compatible' : 'ball-and-socket-size-mismatch' };
  }
  if (pair === pairKey('gear-mesh', 'gear-mesh')) {
    const sameProfile = (aSize.profile || 'spur') === (bSize.profile || 'spur');
    const delta = Math.abs((aSize.moduleMm || 0) - (bSize.moduleMm || 0));
    const compatible = sameProfile && delta <= 0.15;
    return { compatible, delta, reason: !sameProfile ? 'gear-profile-mismatch' : compatible ? 'gear-module-compatible' : 'gear-module-mismatch' };
  }
  return { compatible: true, delta: 0, reason: 'interface-size-not-constrained' };
}

export function checkAnchorCompatibility(a, b, options = {}) {
  if (!a || !b) return { compatible: false, reason: 'missing-anchor' };
  if (a.id && b.id && a.id === b.id) return { compatible: false, reason: 'same-anchor' };
  if (!(ANCHOR_COMPATIBILITY[a.kind] || []).includes(b.kind)) {
    return { compatible: false, reason: 'interface-type-mismatch' };
  }
  const angularToleranceDeg = Number(options.angularToleranceDeg ?? 12);
  const toleranceMm = Number(options.toleranceMm ?? 0.8);
  const cosine = Math.cos(THREE.MathUtils.degToRad(angularToleranceDeg));
  const pair = pairKey(a.kind, b.kind);
  let alignment = 1;

  if (AXIS_PARALLEL_PAIRS.has(pair)) {
    const axisA = normalize(a.axis || a.normal || [0, 0, 1]);
    const axisB = normalize(b.axis || b.normal || [0, 0, 1]);
    alignment = Math.abs(dot(axisA, axisB));
    if (alignment < cosine) return { compatible: false, reason: 'axis-misaligned', alignment };
  } else if (FACE_OPPOSED_PAIRS.has(pair)) {
    alignment = dot(normalize(a.normal || [0, 1, 0]), normalize(b.normal || [0, -1, 0]));
    if (alignment > -cosine) return { compatible: false, reason: 'face-normals-not-opposed', alignment };
  }

  const dimensions = compareDimensions(a, b, toleranceMm);
  if (!dimensions.compatible) {
    return { compatible: false, reason: dimensions.reason, alignment, dimensionDeltaMm: dimensions.delta };
  }
  return { compatible: true, reason: dimensions.reason, alignment, dimensionDeltaMm: dimensions.delta };
}

export const areAnchorsCompatible = (a, b, options) =>
  checkAnchorCompatibility(a, b, options).compatible;

const ROLE_COLORS = Object.freeze({ male: 0x36a3ff, female: 0xffb347, neutral: 0x35c98a });

export function createAnchorDebugGroup(anchors = [], options = {}) {
  const root = new THREE.Group();
  root.name = 'connection-anchor-debug';
  const markerRadius = Number(options.markerRadiusMm) || 0.85;
  const lineLength = Number(options.normalLengthMm) || 3.2;
  const buckets = new Map();
  const linePositions = new Map();

  for (const anchor of anchors) {
    const role = anchor.role || 'neutral';
    if (!buckets.has(role)) buckets.set(role, []);
    buckets.get(role).push(anchor);
    if (!linePositions.has(role)) linePositions.set(role, []);
    const position = new THREE.Vector3(...anchor.position);
    const direction = new THREE.Vector3(...(anchor.axis || anchor.normal || [0, 1, 0])).normalize();
    if (anchor.axis) {
      linePositions.get(role).push(
        ...position.clone().addScaledVector(direction, -lineLength / 2).toArray(),
        ...position.clone().addScaledVector(direction, lineLength / 2).toArray()
      );
    } else {
      linePositions.get(role).push(
        ...position.toArray(),
        ...position.clone().addScaledVector(direction, lineLength).toArray()
      );
    }
  }

  const geometry = new THREE.SphereGeometry(markerRadius, 10, 8);
  for (const [role, items] of buckets) {
    const color = ROLE_COLORS[role] || ROLE_COLORS.neutral;
    const material = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.96 });
    const instances = new THREE.InstancedMesh(geometry, material, items.length);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    items.forEach((anchor, index) => {
      matrix.compose(new THREE.Vector3(...anchor.position), quaternion, scale);
      instances.setMatrixAt(index, matrix);
    });
    instances.instanceMatrix.needsUpdate = true;
    instances.renderOrder = 1000;
    root.add(instances);

    const positions = linePositions.get(role) || [];
    if (positions.length) {
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const lineMaterial = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.85 });
      const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      lines.renderOrder = 1001;
      root.add(lines);
    }
  }
  return root;
}
