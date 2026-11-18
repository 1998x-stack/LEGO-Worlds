import * as THREE from 'three';
import { checkAnchorCompatibility, getPartAnchors, ANCHOR_SCHEMA_VERSION } from './connection-anchors.js';

// Builder v1 intentionally commits only stud/socket brick-grid connections.
// Other interfaces are available in the anchor schema, but require specialized
// fit and collision rules before they are safe to auto-snap.
export const BUILDER_SCHEMA_VERSION = 1;
export const BUILDER_MAX_PARTS = 64;
export const SNAP_KINDS = Object.freeze(['stud', 'stud-socket']);
export const BUILDER_TYPES = Object.freeze(['brick', 'plate', 'tile', 'jumper']);
export const DEFAULT_SNAP_DISTANCE_MM = 13;
const STUD_INSERTION_MM = 1.7;
const BODY_OVERLAP_EPS_MM = 0.2;

export const isBuilderComponent = spec =>
  Boolean(spec && BUILDER_TYPES.includes(spec.type) && Array.isArray(spec.size) &&
    Number.isInteger(spec.size[0]) && Number.isInteger(spec.size[1]) &&
    spec.size[0] > 0 && spec.size[1] > 0);

const vec = a => new THREE.Vector3(...a);
export const poseQuaternion = pose => new THREE.Quaternion().setFromEuler(
  new THREE.Euler(...(pose.rotation || [0, 0, 0]), 'XYZ')
);

export function worldAnchor(anchor, pose, instanceId = '') {
  const q = poseQuaternion(pose);
  const p = vec(pose.pos || [0, 0, 0]);
  return {
    ...anchor,
    id: (instanceId || 'object') + ':' + anchor.id,
    instanceId: instanceId || 'object',
    position: vec(anchor.position).applyQuaternion(q).add(p).toArray(),
    normal: vec(anchor.normal).applyQuaternion(q).normalize().toArray(),
    up: vec(anchor.up).applyQuaternion(q).normalize().toArray(),
    axis: anchor.axis ? vec(anchor.axis).applyQuaternion(q).normalize().toArray() : null
  };
}

export function solveAnchorAlignment(movingAnchor, fixedWorldAnchor, currentPose) {
  if (!SNAP_KINDS.includes(movingAnchor.kind) ||
      !SNAP_KINDS.includes(fixedWorldAnchor.kind) ||
      movingAnchor.kind === fixedWorldAnchor.kind) {
    return null;
  }
  const initial = poseQuaternion(currentPose);
  const sourceNormal = vec(movingAnchor.normal).applyQuaternion(initial).normalize();
  const destinationNormal = vec(fixedWorldAnchor.normal).negate().normalize();
  const correction = new THREE.Quaternion().setFromUnitVectors(sourceNormal, destinationNormal);
  const aligned = correction.multiply(initial).normalize();
  // The stored stud datum is the stud tip. Its 1.7 mm protrusion
  // enters the underside socket, so body shoulders meet flush.
  const matePoint = vec(fixedWorldAnchor.position)
    .addScaledVector(vec(fixedWorldAnchor.normal), -STUD_INSERTION_MM);
  const translated = matePoint.sub(vec(movingAnchor.position).applyQuaternion(aligned));
  const euler = new THREE.Euler().setFromQuaternion(aligned, 'XYZ');
  return {
    pos: translated.toArray(),
    rotation: [euler.x, euler.y, euler.z]
  };
}

export function bodyBounds(spec) {
  if (!isBuilderComponent(spec)) throw new Error('Builder only supports stud-grid brick/plate/tile/jumper types');
  const [width, depth] = spec.size;
  const height = spec.type === 'brick' ? 9.6 : 3.2;
  const box = new THREE.Box3(
    new THREE.Vector3(-(width * 8 - 0.22) / 2, -height / 2, -(depth * 8 - 0.22) / 2),
    new THREE.Vector3((width * 8 - 0.22) / 2, height / 2, (depth * 8 - 0.22) / 2)
  );
  const matrix = new THREE.Matrix4().compose(
    vec(spec.pos || [0, 0, 0]),
    poseQuaternion(spec),
    new THREE.Vector3(1, 1, 1)
  );
  return box.applyMatrix4(matrix);
}

export function bodyCollision(a, b, epsilonMm = BODY_OVERLAP_EPS_MM) {
  const A = bodyBounds(a);
  const B = bodyBounds(b);
  return Math.min(A.max.x, B.max.x) - Math.max(A.min.x, B.min.x) > epsilonMm &&
    Math.min(A.max.y, B.max.y) - Math.max(A.min.y, B.min.y) > epsilonMm &&
    Math.min(A.max.z, B.max.z) - Math.max(A.min.z, B.min.z) > epsilonMm;
}

export function findSnapCandidate(moving, fixedParts, options = {}) {
  if (!isBuilderComponent(moving)) return { status: 'unsupported', candidate: null };
  const distanceLimit = Number(options.maxDistanceMm ?? DEFAULT_SNAP_DISTANCE_MM);
  const movingAnchors = getPartAnchors(moving).filter(a => SNAP_KINDS.includes(a.kind));
  const fixed = fixedParts.filter(part =>
    part.instanceId !== moving.instanceId && isBuilderComponent(part)
  );
  const candidates = [];
  for (const part of fixed) {
    const targets = getPartAnchors(part).filter(a => SNAP_KINDS.includes(a.kind));
    for (const localMoving of movingAnchors) {
      const current = worldAnchor(localMoving, moving, moving.instanceId);
      for (const target of targets) {
        if (localMoving.kind === target.kind) continue;
        const fixedWorld = worldAnchor(target, part, part.instanceId);
        const proposed = solveAnchorAlignment(localMoving, fixedWorld, moving);
        if (!proposed) continue;
        const intended = vec(fixedWorld.position)
          .addScaledVector(vec(fixedWorld.normal), -STUD_INSERTION_MM);
        const distance = vec(current.position).distanceTo(intended);
        if (distance > distanceLimit) continue;
        const alignedMoving = worldAnchor(localMoving, proposed, moving.instanceId);
        const compatibility = checkAnchorCompatibility(alignedMoving, fixedWorld);
        if (!compatibility.compatible) continue;
        const spec = { ...moving, ...proposed };
        const collidesWith = fixed.filter(other => bodyCollision(spec, other)).map(p => p.instanceId);
        candidates.push({
          fixedInstanceId: part.instanceId,
          movingAnchorId: localMoving.id,
          fixedAnchorId: target.id,
          distanceMm: distance,
          transform: proposed,
          collidesWith,
          valid: collidesWith.length === 0
        });
      }
    }
  }
  if (!candidates.length) return { status: 'none', candidate: null };
  candidates.sort((a, b) => (Number(b.valid) - Number(a.valid)) || a.distanceMm - b.distanceMm);
  const candidate = candidates[0];
  return { status: candidate.valid ? 'ready' : 'blocked', candidate };
}

const matchingStudPair = (a, b) => (a.kind === 'stud' && b.kind === 'stud-socket') ||
  (a.kind === 'stud-socket' && b.kind === 'stud');

export function collectConnections(parts) {
  const edges = [];
  const annotated = parts.map(part => ({
    spec: part,
    anchors: getPartAnchors(part).filter(a => SNAP_KINDS.includes(a.kind))
      .map(a => worldAnchor(a, part, part.instanceId))
  }));
  for (let i = 0; i < annotated.length; i++) {
    for (let j = i + 1; j < annotated.length; j++) {
      for (const a of annotated[i].anchors) {
        for (const b of annotated[j].anchors) {
          if (!matchingStudPair(a, b)) continue;
          const male = a.kind === 'stud' ? a : b;
          const female = a.kind === 'stud-socket' ? a : b;
          const shoulder = vec(male.position).addScaledVector(vec(male.normal), -STUD_INSERTION_MM);
          if (shoulder.distanceTo(vec(female.position)) > 0.35) continue;
          if (!checkAnchorCompatibility(a, b).compatible) continue;
          edges.push({
            from: a.instanceId, to: b.instanceId,
            fromAnchor: a.id, toAnchor: b.id,
            kind: 'stud-socket'
          });
        }
      }
    }
  }
  return edges;
}

export function serializeBuild(parts) {
  return {
    schemaVersion: BUILDER_SCHEMA_VERSION,
    anchorSchemaVersion: ANCHOR_SCHEMA_VERSION,
    units: 'mm',
    parts: parts.map(p => ({
      instanceId: p.instanceId, componentId: p.componentId,
      pos: [...p.pos], rotation: [...p.rotation]
    })),
    connections: collectConnections(parts)
  };
}

export function parseBuild(document, catalog) {
  if (!document || document.schemaVersion !== BUILDER_SCHEMA_VERSION ||
      document.anchorSchemaVersion !== ANCHOR_SCHEMA_VERSION || document.units !== 'mm' ||
      !Array.isArray(document.parts) || !document.parts.length ||
      document.parts.length > BUILDER_MAX_PARTS) {
    throw new Error('Invalid builder document/version/part count');
  }
  const lookup = new Map(catalog.filter(isBuilderComponent).map(item => [item.id, item]));
  const ids = new Set();
  const parts = [];
  for (const record of document.parts) {
    if (typeof record.instanceId !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(record.instanceId) || ids.has(record.instanceId)) {
      throw new Error('Invalid or duplicate instance ID');
    }
    const entry = lookup.get(record.componentId);
    if (!entry || !Array.isArray(record.pos) || record.pos.length !== 3 ||
        !record.pos.every(value => Number.isFinite(value) && Math.abs(value) <= 2000) ||
        !Array.isArray(record.rotation) || record.rotation.length !== 3 ||
        !record.rotation.every(value => Number.isFinite(value) && Math.abs(value) <= Math.PI * 2 + 0.001)) {
      throw new Error('Invalid component ID or transform');
    }
    ids.add(record.instanceId);
    parts.push({ instanceId: record.instanceId, componentId: entry.id, id: entry.id,
      type: entry.type, size: [...entry.size], color: entry.color,
      name: entry.name, pos: [...record.pos], rotation: [...record.rotation] });
  }
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      if (bodyCollision(parts[i], parts[j])) throw new Error('Imported parts collide');
    }
  }
  // Connections are recalculated from transforms: never trust imported edges.
  return parts;
}
