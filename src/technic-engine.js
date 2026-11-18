import * as THREE from 'three';
import { getPartAnchors, checkAnchorCompatibility } from './connection-anchors.js';
import { worldAnchor } from './snap-engine.js';

// Geometry-aware assembly recipes for the current procedural Technic vocabulary.
// The connection contract is structural; this is not a force/torque simulator.
export const MECHANISM_SCHEMA_VERSION = 1;
export const MECHANISM_MAX_PARTS = 32;
export const MECHANISM_PRESETS = Object.freeze([
  { id: 'dual-gears', name: 'Dual Gear Drive', zh: '双齿轮传动' },
  { id: 'wheel-axle', name: 'Wheel & Axle', zh: '轮轴总成' },
  { id: 'pin-fixture', name: 'Pin Fixture', zh: '销钉连接架' }
]);

const vec = p => new THREE.Vector3(...p);
const isShaft = p => p.type === 'pin' || p.type === 'axle';
const isAccessory = p => p.type === 'gear' || p.type === 'wheel';
const finite = a => Array.isArray(a) && a.length === 3 && a.every(Number.isFinite);
const makeLookup = catalog => new Map(catalog.map(p => [p.id, p]));
const shellThickness = part => part.type === 'gear'
  ? Number(part.size[2]) + 0.8 : Number(part.size[1]) + 0.9;
const beamHoleAnchors = beam => getPartAnchors(beam).filter(a => a.kind === 'technic-hole');
const shaftAnchors = shaft => getPartAnchors(shaft).filter(a => a.kind === (shaft.type === 'pin' ? 'pin' : 'axle'));
const accessoryAnchor = accessory => getPartAnchors(accessory)
  .find(a => a.kind === (accessory.type === 'gear' ? 'gear-axis' : 'wheel-axis'));

function createPart(entry, instanceId, pos, rotation = [0, 0, 0]) {
  return {
    id: entry.id, componentId: entry.id, instanceId,
    name: entry.name, type: entry.type, size: [...entry.size],
    color: entry.color, pos: [...pos], rotation: [...rotation]
  };
}
function assertIdentifier(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) {
    throw new Error('Invalid mechanism instance identifier');
  }
}
function appendStep(state, step, part, edge) {
  if (state.parts.length >= MECHANISM_MAX_PARTS) throw new Error('Mechanism part limit reached');
  if (state.parts.some(p => p.instanceId === part.instanceId)) throw new Error('Duplicate mechanism instance identifier');
  return {
    ...state,
    parts: [...state.parts, part],
    steps: [...state.steps, { ...step }],
    connections: [...state.connections, edge]
  };
}

export function createMechanism(catalog, beamId = 'beam-5') {
  const entry = makeLookup(catalog).get(beamId);
  if (!entry || entry.type !== 'beam') throw new Error('Unsupported Technic beam');
  return {
    schemaVersion: MECHANISM_SCHEMA_VERSION,
    baseBeamId: beamId,
    parts: [createPart(entry, 'beam', [0, 0, 0])],
    steps: [],
    connections: [],
    driveShaftId: null
  };
}

export function availableHoles(state) {
  const beam = state.parts[0];
  const occupied = new Set(state.connections
    .filter(edge => edge.kind === 'pin-hole' || edge.kind === 'axle-bearing')
    .map(edge => edge.holeIndex));
  return beamHoleAnchors(beam).map((anchor, holeIndex) => ({
    holeIndex,
    position: worldAnchor(anchor, beam, beam.instanceId).position,
    occupied: occupied.has(holeIndex)
  }));
}

export function mountShaft(state, catalog, args) {
  const { componentId, holeIndex, instanceId } = args;
  assertIdentifier(instanceId);
  const beam = state.parts[0];
  const lookup = makeLookup(catalog);
  const entry = lookup.get(componentId);
  if (!entry || !['pin','axle'].includes(entry.type)) throw new Error('Select a supported connector pin or axle');
  if (!Number.isInteger(holeIndex)) throw new Error('Hole index must be an integer');
  const holes = availableHoles(state);
  const hole = holes.find(x => x.holeIndex === holeIndex);
  if (!hole) throw new Error('Requested beam hole does not exist');
  if (hole.occupied) throw new Error('This beam hole already contains a shaft or pin');

  const pin = createPart(entry, instanceId, hole.position);
  const holeAnchor = worldAnchor(beamHoleAnchors(beam)[holeIndex], beam, beam.instanceId);
  const shaftAnchor = worldAnchor(shaftAnchors(pin)[0], pin, pin.instanceId);
  if (!checkAnchorCompatibility(holeAnchor, shaftAnchor).compatible) {
    throw new Error('Shaft and beam hole have incompatible nominal dimensions or axes');
  }
  // Both datum axes are +Z, and the current procedural pin/axle meshes
  // extend along local Z. Centre the shaft in the through-hole.
  const edge = {
    id: beam.instanceId + ':' + instanceId,
    from: beam.instanceId,
    to: instanceId,
    kind: entry.type === 'pin' ? 'pin-hole' : 'axle-bearing',
    joint: entry.type === 'pin' && entry.id === 'friction-pin' ? 'fixed' : 'revolute',
    holeIndex,
    fromAnchor: holeAnchor.id,
    toAnchor: shaftAnchor.id,
    axis: [0, 0, 1]
  };
  const next = appendStep(state, { operation: 'shaft', componentId, holeIndex, instanceId }, pin, edge);
  if (entry.type === 'axle' && !next.driveShaftId) next.driveShaftId = instanceId;
  return next;
}

function accessoryHasClearance(state, candidate) {
  const z = candidate.pos[2];
  const radius = Number(candidate.size[0]);
  for (const other of state.parts.filter(isAccessory)) {
    const dz = Math.abs(z - other.pos[2]);
    const thick = (shellThickness(candidate) + shellThickness(other)) / 2;
    if (dz >= thick - 0.1) continue;
    const dx = candidate.pos[0] - other.pos[0];
    const dy = candidate.pos[1] - other.pos[1];
    const distance = Math.hypot(dx, dy);
    const pitch = radius + Number(other.size[0]);
    const nominalGearMesh = candidate.type === 'gear' && other.type === 'gear' &&
      Math.abs(distance - pitch) <= 0.35 &&
      Math.abs(2 * radius / Number(candidate.size[1]) -
        2 * Number(other.size[0]) / Number(other.size[1])) <= 0.02;
    if (distance < pitch - 0.1 && !nominalGearMesh) return false;
  }
  return true;
}

export function mountAccessory(state, catalog, args) {
  const { componentId, shaftInstanceId, instanceId } = args;
  assertIdentifier(instanceId);
  const lookup = makeLookup(catalog);
  const entry = lookup.get(componentId);
  if (!entry || !['gear', 'wheel'].includes(entry.type)) throw new Error('Select a gear or wheel');
  const shaft = state.parts.find(p => p.instanceId === shaftInstanceId && p.type === 'axle');
  if (!shaft) throw new Error('Install an axle first');
  if (state.connections.some(edge => edge.kind === 'keyed-mount' && edge.from === shaftInstanceId)) {
    throw new Error('This axle already has a mounted gear or wheel');
  }
  const beam = state.parts[0];
  const width = shellThickness(entry);
  const beamDepth = Number(beam.size[1]);
  const offset = beamDepth / 2 + 0.5 + width / 2;
  const axleHalfLength = Number(shaft.size[0]) / 2;
  if (offset + width / 2 > axleHalfLength + 1e-6) {
    throw new Error('Axle too short for the selected accessory: use a longer axle');
  }
  const accessory = createPart(entry, instanceId,
    [shaft.pos[0], shaft.pos[1], shaft.pos[2] + offset],
    [...shaft.rotation]);
  if (!accessoryHasClearance(state, accessory)) {
    throw new Error('Accessory collides with an installed gear or wheel');
  }
  const shaftAnchor = worldAnchor(shaftAnchors(shaft)[0], shaft, shaft.instanceId);
  const boreAnchor = worldAnchor(accessoryAnchor(accessory), accessory, accessory.instanceId);
  if (!checkAnchorCompatibility(shaftAnchor, boreAnchor).compatible) {
    throw new Error('Axle and accessory bore are incompatible');
  }
  const edge = {
    id: shaft.instanceId + ':' + instanceId,
    from: shaft.instanceId, to: instanceId,
    kind: 'keyed-mount', joint: 'fixed',
    fromAnchor: shaftAnchor.id, toAnchor: boreAnchor.id,
    axis: [0, 0, 1]
  };
  return appendStep(state,
    { operation: 'accessory', componentId, shaftInstanceId, instanceId },
    accessory, edge);
}

export function meshedGearPairs(state) {
  const gears = state.parts.filter(part => part.type === 'gear');
  const pairs = [];
  for (let i = 0; i < gears.length; i++) {
    const a = gears[i];
    for (let j = i + 1; j < gears.length; j++) {
      const b = gears[j];
      if (Math.abs(a.pos[2] - b.pos[2]) > 0.35) continue;
      const distance = Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1]);
      const pitch = Number(a.size[0]) + Number(b.size[0]);
      const moduleA = Number(a.size[0]) * 2 / Number(a.size[1]);
      const moduleB = Number(b.size[0]) * 2 / Number(b.size[1]);
      if (Math.abs(distance - pitch) <= 0.35 && Math.abs(moduleA - moduleB) <= 0.02) {
        const axleA = state.connections.find(e => e.kind === 'keyed-mount' && e.to === a.instanceId)?.from;
        const axleB = state.connections.find(e => e.kind === 'keyed-mount' && e.to === b.instanceId)?.from;
        if (!axleA || !axleB || axleA === axleB) continue;
        pairs.push({
          id: 'mesh:' + a.instanceId + ':' + b.instanceId,
          from: a.instanceId, to: b.instanceId,
          shaftA: axleA, shaftB: axleB,
          kind: 'gear-mesh', joint: 'counter-rotation',
          teethA: Number(a.size[1]), teethB: Number(b.size[1]),
          ratio: -Number(a.size[1]) / Number(b.size[1]),
          pitchCenterDistanceMm: distance,
          axis: [0, 0, 1],
          confidence: 'schematic'
        });
      }
    }
  }
  return pairs;
}

export function mechanismGraph(state) {
  return [...state.connections.map(edge => ({...edge})), ...meshedGearPairs(state)];
}

export function mechanismAngles(state, radians = 0) {
  const angles = {};
  const shafts = state.parts.filter(part => part.type === 'axle');
  if (!shafts.length) return angles;
  for (const shaft of shafts) angles[shaft.instanceId] = null;
  const driven = shafts.some(p => p.instanceId === state.driveShaftId)
    ? state.driveShaftId : shafts[0].instanceId;
  angles[driven] = Number(radians) || 0;

  const pairs = meshedGearPairs(state);
  let changed = true;
  for (let round = 0; round < shafts.length && changed; round++) {
    changed = false;
    for (const pair of pairs) {
      if (angles[pair.shaftA] !== null && angles[pair.shaftB] === null) {
        angles[pair.shaftB] = angles[pair.shaftA] * pair.ratio;
        changed = true;
      }
      if (angles[pair.shaftB] !== null && angles[pair.shaftA] === null) {
        angles[pair.shaftA] = angles[pair.shaftB] / pair.ratio;
        changed = true;
      }
    }
  }
  for (const shaft of shafts) if (angles[shaft.instanceId] === null) angles[shaft.instanceId] = 0;
  for (const edge of state.connections.filter(e => e.kind === 'keyed-mount')) {
    angles[edge.to] = angles[edge.from] ?? 0;
  }
  return angles;
}

export function replayMechanism(catalog, document) {
  if (!document || document.schemaVersion !== MECHANISM_SCHEMA_VERSION ||
      !Array.isArray(document.steps) || document.steps.length + 1 > MECHANISM_MAX_PARTS ||
      typeof document.baseBeamId !== 'string') throw new Error('Invalid or unsupported mechanism document');
  let state = createMechanism(catalog, document.baseBeamId);
  for (const step of document.steps) {
    if (!step || typeof step !== 'object') throw new Error('Invalid assembly operation');
    if (step.operation === 'shaft') state = mountShaft(state, catalog, step);
    else if (step.operation === 'accessory') state = mountAccessory(state, catalog, step);
    else throw new Error('Unknown assembly operation');
  }
  if (document.driveShaftId && state.parts.some(p => p.type === 'axle' && p.instanceId === document.driveShaftId)) {
    state.driveShaftId = document.driveShaftId;
  }
  return state;
}

export function exportMechanism(state) {
  return {
    schemaVersion: MECHANISM_SCHEMA_VERSION,
    anchorSchemaVersion: 1,
    units: 'mm',
    baseBeamId: state.baseBeamId,
    steps: state.steps.map(step => ({ ...step })),
    driveShaftId: state.driveShaftId,
    parts: state.parts.map(part => ({
      instanceId: part.instanceId, componentId: part.componentId,
      pos: [...part.pos], rotation: [...part.rotation]
    })),
    connections: mechanismGraph(state)
  };
}

export function createMechanismPreset(catalog, id = 'dual-gears') {
  const beam = id === 'wheel-axle' ? 'beam-7' : 'beam-5';
  let state = createMechanism(catalog, beam);
  const shaft = (componentId, holeIndex, instanceId) =>
    state = mountShaft(state, catalog, { componentId, holeIndex, instanceId });
  const accessory = (componentId, shaftInstanceId, instanceId) =>
    state = mountAccessory(state, catalog, { componentId, shaftInstanceId, instanceId });
  if (id === 'dual-gears') {
    shaft('axle-3', 1, 'axle_left');
    shaft('axle-3', 3, 'axle_right');
    accessory('gear-16t', 'axle_left', 'drive_gear');
    accessory('gear-16t', 'axle_right', 'driven_gear');
  } else if (id === 'wheel-axle') {
    shaft('axle-5', 3, 'drive_axle');
    accessory('wheel-medium', 'drive_axle', 'wheel');
    shaft('friction-pin', 1, 'pin_left');
    shaft('smooth-pin', 5, 'pin_right');
  } else if (id === 'pin-fixture') {
    shaft('friction-pin', 1, 'lock_pin');
    shaft('smooth-pin', 3, 'pivot_pin');
  } else throw new Error('Unknown mechanics preset');
  return state;
}
