import * as THREE from 'three';
import { getPartAnchors, ANCHOR_SCHEMA_VERSION } from './connection-anchors.js';

export const HIERARCHY_SCHEMA_VERSION = 1;
export const HIERARCHY_MAX_NODES = 24;
export const HIERARCHY_MAX_PARTS = 96;
export const HIERARCHY_PRESETS = Object.freeze([
  { id: 'articulated-crane', name: 'Articulated Crane', zh: '双关节机械吊臂' },
  { id: 'twin-drawbridge', name: 'Twin Drawbridge', zh: '双叶联动吊桥' },
  { id: 'solar-observatory', name: 'Solar Observatory', zh: '双翼太阳能观测站' }
]);
const rad = THREE.MathUtils.degToRad;
const deg = THREE.MathUtils.radToDeg;
const v = p => new THREE.Vector3(...p);
const isFinite3 = p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);
const idOk = s => typeof s === 'string' && /^[a-z][a-z0-9_-]{0,63}$/.test(s);
const identity = () => new THREE.Matrix4();
const part = (instanceId, componentId, pos, rotation = [0, 0, 0]) =>
  ({ instanceId, componentId, pos, rotation });
const anchor = partId => ({ partId, kind: 'hinge-axis', index: 0 });
const hinge = (id, parentId, parentPartId, childPartId, homeDeg = 0, limitsDeg = [-85, 85]) =>
  ({ id, parentId, joint: { type: 'revolute', parentAnchor: anchor(parentPartId),
    childAnchor: anchor(childPartId), homeDeg, limitsDeg } });
const fixed = (id, parentId, parentPartId, childPartId) =>
  ({ id, parentId, joint: { type: 'fixed', parentAnchor: anchor(parentPartId),
    childAnchor: anchor(childPartId), homeDeg: 0, limitsDeg: [0, 0] } });

function crane() {
  return {
    id: 'articulated-crane', title: 'Articulated Crane', zh: '双关节机械吊臂',
    nodes: [
      { id: 'base', parentId: null, pose: { pos: [0, 0, 0], rotation: [0, 0, 0] },
        parts: [
          part('foundation_beam', 'beam-7', [0, -7, 0]),
          part('foundation_hinge', 'hinge-1x2', [0, 0, 0]),
          part('base_bushing', 'half-bushing', [-17, -7, 0])
        ] },
      { ...hinge('boom', 'base', 'foundation_hinge', 'boom_hinge', 18, [-45, 88]),
        parts: [
          part('boom_hinge', 'hinge-1x2', [0, 0, 0]),
          part('boom_beam', 'beam-5', [0, 20, 0], [0, 0, Math.PI / 2]),
          part('boom_tip_hinge', 'hinge-1x2', [0, 40, 0])
        ] },
      { ...hinge('wrist', 'boom', 'boom_tip_hinge', 'wrist_hinge', -20, [-100, 65]),
        parts: [
          part('wrist_hinge', 'hinge-1x2', [0, 0, 0]),
          part('wrist_beam', 'beam-3', [0, 8, 0], [0, 0, Math.PI / 2]),
          part('wrist_tip', 'clip-1x1', [0, 22, 0])
        ] }
    ],
    couplings: []
  };
}
function bridge() {
  return {
    id: 'twin-drawbridge', title: 'Twin Drawbridge', zh: '双叶联动吊桥',
    nodes: [
      { id: 'base', parentId: null, pose: { pos: [0, 0, 0], rotation: [0, 0, 0] },
        parts: [
          part('foundation_panel', 'balcony-floor', [0, -6, 0]),
          part('left_base_hinge', 'hinge-1x4', [0, 0, -20]),
          part('right_base_hinge', 'hinge-1x4', [0, 0, 20]),
          part('foundation_rock', 'rock', [-30, -6, 0])
        ] },
      { ...hinge('left_deck', 'base', 'left_base_hinge', 'left_deck_hinge', -28, [-78, 6]),
        parts: [
          part('left_deck_hinge', 'hinge-1x4', [0, 0, 0]),
          part('left_road', 'balcony-floor', [0, 0, 12]),
          part('left_rail', 'railing', [0, 5, 12])
        ] },
      { ...hinge('right_deck', 'base', 'right_base_hinge', 'right_deck_hinge', 28, [-6, 78]),
        parts: [
          part('right_deck_hinge', 'hinge-1x4', [0, 0, 0]),
          part('right_road', 'balcony-floor', [0, 0, -12]),
          part('right_rail', 'railing', [0, 5, -12])
        ] }
    ],
    couplings: [{ id: 'symmetric_lift', driver: 'left_deck', driven: 'right_deck', ratio: -1, offsetDeg: 0 }]
  };
}
function observatory() {
  const zAxis = [0, -Math.PI / 2, 0];
  return {
    id: 'solar-observatory', title: 'Solar Observatory', zh: '双翼太阳能观测站',
    nodes: [
      { id: 'base', parentId: null, pose: { pos: [0, 0, 0], rotation: [0, 0, 0] },
        parts: [
          part('base_platform', 'plate-2x6', [0, -7, 0]),
          part('observatory_dome', 'dome-2x2', [0, 6, 0]),
          part('left_axis', 'hinge-1x2', [-22, 1, 0], zAxis),
          part('right_axis', 'hinge-1x2', [22, 1, 0], zAxis),
          part('antenna', 'bar-4', [0, 18, 0])
        ] },
      { ...hinge('left_wing', 'base', 'left_axis', 'left_wing_hinge', -26, [-90, 5]),
        parts: [
          part('left_wing_hinge', 'hinge-1x2', [0, 0, 0], zAxis),
          part('left_solar_panel', 'wall-panel', [-24, 0, 0]),
          part('left_solar_tile', 'tile-2x4', [-24, 2, 0])
        ] },
      { ...hinge('right_wing', 'base', 'right_axis', 'right_wing_hinge', 26, [-5, 90]),
        parts: [
          part('right_wing_hinge', 'hinge-1x2', [0, 0, 0], zAxis),
          part('right_solar_panel', 'wall-panel', [24, 0, 0]),
          part('right_solar_tile', 'tile-2x4', [24, 2, 0])
        ] }
    ],
    couplings: [{ id: 'mirrored_solar_wings', driver: 'left_wing', driven: 'right_wing', ratio: -1, offsetDeg: 0 }]
  };
}

const factories = Object.freeze({
  'articulated-crane': crane,
  'twin-drawbridge': bridge,
  'solar-observatory': observatory
});
export function createHierarchyPreset(id = 'articulated-crane') {
  const factory = factories[id];
  if (!factory) throw new Error('Unknown hierarchy preset');
  return factory();
}

const eulerQuaternion = e => new THREE.Quaternion().setFromEuler(new THREE.Euler(...e, 'XYZ'));
function partMatrix(spec) {
  return new THREE.Matrix4().compose(
    v(spec.pos), eulerQuaternion(spec.rotation), new THREE.Vector3(1, 1, 1)
  );
}
function anchorDatum(node, ref, lookup) {
  const instance = node.parts.find(p => p.instanceId === ref.partId);
  if (!instance) throw new Error('Missing joint anchor part: ' + ref.partId);
  const component = lookup.get(instance.componentId);
  if (!component) throw new Error('Missing catalog component: ' + instance.componentId);
  const matching = getPartAnchors(component).filter(a => a.kind === ref.kind);
  const datum = matching[ref.index];
  if (!datum || !datum.axis) throw new Error('Missing axial joint datum on ' + instance.componentId);
  const mat = partMatrix(instance);
  const rotation = eulerQuaternion(instance.rotation);
  return {
    position: v(datum.position).applyMatrix4(mat),
    axis: v(datum.axis).applyQuaternion(rotation).normalize(),
    anchorId: instance.instanceId + ':' + datum.id
  };
}

export function validateHierarchy(document, catalog) {
  if (!document || !idOk(document.id) || !Array.isArray(document.nodes) ||
      document.nodes.length < 2 || document.nodes.length > HIERARCHY_MAX_NODES ||
      !Array.isArray(document.couplings)) throw new Error('Invalid hierarchy schema');
  const lookup = new Map(catalog.map(component => [component.id, component]));
  const nodeLookup = new Map();
  const partIds = new Set();
  let partCount = 0;
  for (const node of document.nodes) {
    if (!node || !idOk(node.id) || nodeLookup.has(node.id) || !Array.isArray(node.parts) ||
        !node.parts.length || node.parts.length > HIERARCHY_MAX_PARTS) {
      throw new Error('Invalid, duplicate or empty subassembly node');
    }
    nodeLookup.set(node.id, node);
    for (const item of node.parts) {
      if (!idOk(item.instanceId) || partIds.has(item.instanceId) || !lookup.has(item.componentId) ||
          !isFinite3(item.pos) || !isFinite3(item.rotation) ||
          item.pos.some(n => Math.abs(n) > 2000) || item.rotation.some(n => Math.abs(n) > Math.PI * 2 + 1e-6)) {
        throw new Error('Invalid part ID, catalog reference or transform');
      }
      partIds.add(item.instanceId);
      partCount++;
    }
  }
  if (partCount > HIERARCHY_MAX_PARTS) throw new Error('Hierarchy part limit exceeded');

  const roots = document.nodes.filter(n => n.parentId == null);
  if (roots.length !== 1 || !roots[0].pose || !isFinite3(roots[0].pose.pos) ||
      !isFinite3(roots[0].pose.rotation)) throw new Error('Hierarchy must have one valid root');
  const root = roots[0];
  const visited = new Set();
  const visiting = new Set();
  const sorted = [];
  function visit(node) {
    if (visiting.has(node.id)) throw new Error('Parent cycle in hierarchy');
    if (visited.has(node.id)) return;
    visiting.add(node.id);
    if (node.parentId) {
      const parent = nodeLookup.get(node.parentId);
      if (!parent) throw new Error('Unknown parent assembly ' + node.parentId);
      visit(parent);
    }
    visiting.delete(node.id);
    visited.add(node.id);
    sorted.push(node);
  }
  document.nodes.forEach(visit);
  for (const node of document.nodes) {
    if (node.id === root.id) continue;
    if (!node.joint || !['fixed', 'revolute'].includes(node.joint.type) ||
        !node.joint.parentAnchor || !node.joint.childAnchor ||
        !Array.isArray(node.joint.limitsDeg) || node.joint.limitsDeg.length !== 2 ||
        !node.joint.limitsDeg.every(Number.isFinite) ||
        !Number.isFinite(node.joint.homeDeg) ||
        node.joint.limitsDeg[0] > node.joint.limitsDeg[1] ||
        node.joint.homeDeg < node.joint.limitsDeg[0] ||
        node.joint.homeDeg > node.joint.limitsDeg[1] ||
        (node.joint.type === 'fixed' && node.joint.limitsDeg.some(n => n !== 0))) {
      throw new Error('Invalid hinge/fixed joint limits');
    }
    const parent = nodeLookup.get(node.parentId);
    const a = anchorDatum(parent, node.joint.parentAnchor, lookup);
    const b = anchorDatum(node, node.joint.childAnchor, lookup);
    if (a.axis.length() < 0.9 || b.axis.length() < 0.9) {
      throw new Error('Invalid hinge axis');
    }
  }
  const byDriven = new Set();
  for (const coupling of document.couplings) {
    const driver = nodeLookup.get(coupling.driver);
    const driven = nodeLookup.get(coupling.driven);
    if (!idOk(coupling.id) || !driver?.joint || !driven?.joint ||
        driver.joint.type !== 'revolute' || driven.joint.type !== 'revolute' ||
        coupling.driver === coupling.driven || !Number.isFinite(coupling.ratio) ||
        !Number.isFinite(coupling.offsetDeg) || Math.abs(coupling.ratio) > 10 ||
        Math.abs(coupling.offsetDeg) > 360 || byDriven.has(coupling.driven)) {
      throw new Error('Invalid or multiply-driven joint coupling');
    }
    byDriven.add(coupling.driven);
  }
  const couplingMap = new Map(document.couplings.map(c => [c.driven, c.driver]));
  for (const id of couplingMap.keys()) {
    const seen = new Set();
    let cursor = id;
    while (couplingMap.has(cursor)) {
      if (seen.has(cursor)) throw new Error('Coupling dependency cycle');
      seen.add(cursor);
      cursor = couplingMap.get(cursor);
    }
  }
  return { root, nodes: sorted, nodeLookup, lookup, partCount };
}

export function resolveJointAngles(document, inputs = {}) {
  const nodes = new Map(document.nodes.map(node => [node.id, node]));
  const couplings = document.couplings || [];
  const byDriven = new Map(couplings.map(c => [c.driven, c]));
  const solved = {};
  const stack = new Set();
  function evaluate(id) {
    if (Object.hasOwn(solved, id)) return solved[id];
    if (stack.has(id)) throw new Error('Joint coupling cycle');
    const node = nodes.get(id);
    if (!node?.joint) throw new Error('Unknown joint ' + id);
    stack.add(id);
    const coupling = byDriven.get(id);
    const raw = coupling
      ? evaluate(coupling.driver) * coupling.ratio + coupling.offsetDeg
      : Number(inputs[id] ?? node.joint.homeDeg);
    if (!Number.isFinite(raw)) throw new Error('Invalid joint angle');
    const [min, max] = node.joint.limitsDeg;
    // Do not hide physically incompatible ratios behind silent clamping.
    if (coupling && (raw < min - 1e-6 || raw > max + 1e-6)) {
      throw new Error('Coupling exceeds dependent hinge limits: ' + id);
    }
    solved[id] = THREE.MathUtils.clamp(raw, min, max);
    stack.delete(id);
    return solved[id];
  }
  for (const node of document.nodes.filter(n => n.joint)) evaluate(node.id);
  return solved;
}

function decomposed(matrix) {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
  return {
    pos: position.toArray(),
    rotation: [euler.x, euler.y, euler.z]
  };
}

export function evaluateHierarchy(document, catalog, inputs = {}) {
  const checked = validateHierarchy(document, catalog);
  const angles = resolveJointAngles(document, inputs);
  const frames = new Map();
  const pivots = [];
  const parts = [];
  for (const node of checked.nodes) {
    let nodeMatrix;
    if (node.id === checked.root.id) {
      nodeMatrix = new THREE.Matrix4().compose(
        v(node.pose.pos), eulerQuaternion(node.pose.rotation), new THREE.Vector3(1, 1, 1)
      );
    } else {
      const parent = checked.nodeLookup.get(node.parentId);
      const parentDatum = anchorDatum(parent, node.joint.parentAnchor, checked.lookup);
      const childDatum = anchorDatum(node, node.joint.childAnchor, checked.lookup);
      const align = new THREE.Quaternion().setFromUnitVectors(childDatum.axis, parentDatum.axis);
      const spin = new THREE.Quaternion().setFromAxisAngle(parentDatum.axis, rad(angles[node.id]));
      nodeMatrix = frames.get(parent.id).clone()
        .multiply(new THREE.Matrix4().makeTranslation(...parentDatum.position.toArray()))
        .multiply(new THREE.Matrix4().makeRotationFromQuaternion(spin))
        .multiply(new THREE.Matrix4().makeRotationFromQuaternion(align))
        .multiply(new THREE.Matrix4().makeTranslation(...childDatum.position.clone().negate().toArray()));
      const axisWorld = parentDatum.axis.clone().transformDirection(frames.get(parent.id));
      const pivotWorld = parentDatum.position.clone().applyMatrix4(frames.get(parent.id));
      pivots.push({
        id: node.id, parentId: parent.id,
        position: pivotWorld.toArray(), axis: axisWorld.toArray(),
        degrees: angles[node.id], limitsDeg: [...node.joint.limitsDeg],
        parentAnchorId: parentDatum.anchorId, childAnchorId: childDatum.anchorId,
        jointType: node.joint.type
      });
    }
    frames.set(node.id, nodeMatrix);
    for (const item of node.parts) {
      const component = checked.lookup.get(item.componentId);
      const matrix = nodeMatrix.clone().multiply(partMatrix(item));
      parts.push({
        ...item, nodeId: node.id, name: component.name, type: component.type,
        color: component.color, size: [...component.size],
        ...decomposed(matrix)
      });
    }
  }
  return { angles, parts, pivots, frames };
}

export function createAssemblySequence(document, catalog) {
  const checked = validateHierarchy(document, catalog);
  const result = [];
  const lastByNode = new Map();
  for (const node of checked.nodes) {
    const parentStep = node.parentId ? lastByNode.get(node.parentId) : null;
    for (const part of node.parts) {
      const previous = lastByNode.get(node.id);
      const number = result.length + 1;
      const offset = node.parentId
        ? [number % 2 ? 22 : -22, 18 + number % 3 * 7, 35 + number % 4 * 8]
        : [number % 2 ? 16 : -16, 26, 48];
      result.push({
        index: number - 1, step: number, nodeId: node.id, partId: part.instanceId,
        componentId: part.componentId,
        dependsOn: [...new Set([previous, parentStep].filter(Boolean))],
        operation: number === 1 ? 'place-foundation' :
          node.parentId ? 'attach-subassembly-part' : 'attach-foundation-part',
        operationZh: number === 1 ? '安放基础零件' :
          node.parentId ? '安装到子总成' : '连接底座零件',
        componentName: checked.lookup.get(part.componentId).name,
        componentZh: checked.lookup.get(part.componentId).zh || checked.lookup.get(part.componentId).name,
        approachOffsetMm: offset,
        durationMs: 480
      });
      lastByNode.set(node.id, number);
    }
  }
  return result;
}

export function assemblyFrame(document, catalog, inputs = {}, progress = 1) {
  const evaluated = evaluateHierarchy(document, catalog, inputs);
  const steps = createAssemblySequence(document, catalog);
  const raw = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1) * steps.length;
  return {
    ...evaluated,
    progress: raw / steps.length,
    steps,
    visible: evaluated.parts.map((part, index) => {
      const t = THREE.MathUtils.clamp(raw - index, 0, 1);
      const ease = t * t * (3 - 2 * t);
      const offset = steps[index].approachOffsetMm;
      return {
        ...part, step: index + 1, visible: t > 0,
        buildFraction: t, alpha: ease,
        pos: part.pos.map((value, axis) => value + offset[axis] * (1 - ease))
      };
    })
  };
}

export function exportHierarchyRecipe(document, inputs = {}) {
  const angles = resolveJointAngles(document, inputs);
  return {
    schemaVersion: HIERARCHY_SCHEMA_VERSION,
    anchorSchemaVersion: ANCHOR_SCHEMA_VERSION,
    units: 'mm',
    presetId: document.id,
    angles,
    // Recomputed on import. Useful to other consumers as a read-only preview.
    operations: document.nodes.flatMap(node => node.parts.map(part => ({
      nodeId: node.id, partId: part.instanceId, componentId: part.componentId
    })))
  };
}

export function importHierarchyRecipe(recipe, catalog) {
  if (!recipe || recipe.schemaVersion !== HIERARCHY_SCHEMA_VERSION ||
      recipe.anchorSchemaVersion !== ANCHOR_SCHEMA_VERSION || recipe.units !== 'mm' ||
      !idOk(recipe.presetId) || !recipe.angles || typeof recipe.angles !== 'object' ||
      Array.isArray(recipe.angles) || Object.keys(recipe.angles).length > HIERARCHY_MAX_NODES) {
    throw new Error('Unsupported or malformed hierarchy recipe');
  }
  const document = createHierarchyPreset(recipe.presetId);
  validateHierarchy(document, catalog);
  const known = new Set(document.nodes.filter(node => node.joint).map(node => node.id));
  const coupled = new Set(document.couplings.map(c => c.driven));
  const inputs = {};
  for (const [id, angle] of Object.entries(recipe.angles)) {
    if (!known.has(id) || !Number.isFinite(angle) || Math.abs(angle) > 360) {
      throw new Error('Unknown or invalid joint angle');
    }
    if (!coupled.has(id)) inputs[id] = angle;
  }
  const angles = resolveJointAngles(document, inputs);
  // Refuse hidden divergence between the exported follower and reconstructed follower.
  for (const id of coupled) {
    if (Object.hasOwn(recipe.angles, id) && Math.abs(recipe.angles[id] - angles[id]) > 1e-4) {
      throw new Error('Imported coupling violates dependent joint constraint');
    }
  }
  return { document, inputs, angles };
}
