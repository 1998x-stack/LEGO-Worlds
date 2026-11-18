import * as THREE from 'three';

/**
 * Minimal, bounded LDraw (.ldr / .mpd) import path for Brick Worlds.
 *
 * Scope and honesty:
 *  - This reads a *text* LDraw file and maps line type 1 (sub-file/part
 *    references) onto existing catalog components. It does NOT bundle or
 *    reimplement any third-party part geometry; unresolved parts are reported
 *    as unsupported rather than invented.
 *  - It never fetches the network, never writes files and never executes input.
 *  - It is NOT a claim of full BrickLink Studio compatibility. Round-trip
 *    fidelity against a real Studio export is unverified (see docs/rfc/ldraw-interop.md).
 */

export const LDRAW_INTEROP_VERSION = 1;

// 20 LDU = one 8 mm stud pitch, 24 LDU = one 9.6 mm brick, 8 LDU = one 3.2 mm plate.
export const LDRAW_MM_PER_LDU = 0.4;
export const LDRAW_MAX_LINES = 5000;
export const LDRAW_MAX_BODIES = 256;
export const LDRAW_MAX_DEPTH = 2;
export const LDRAW_DEFAULT_COLOR = '#B4B4B4';
export const LDRAW_MAX_COORDINATE = 1e6;

// Small, factual mapping of standard LDraw part numbers to Brick Worlds catalog
// ids. Part numbers are public identifiers (facts), not copyrighted geometry.
export const LDRAW_PART_MAP = Object.freeze({
  '3005.dat': 'brick-1x1',
  '3004.dat': 'brick-1x2',
  '3003.dat': 'brick-2x2',
  '3001.dat': 'brick-2x4',
  '3020.dat': 'plate-2x4',
  '3710.dat': 'plate-1x4'
});

// Standard LDraw colour codes with their widely published RGB values (factual
// data). The full LDConfig.ldr is CCAL licensed and is NOT bundled here.
export const LDRAW_COLORS = Object.freeze({
  0: '#05131D',
  1: '#0055BF',
  4: '#C91A09',
  14: '#F2CD37',
  15: '#FFFFFF',
  71: '#A0A5A9',
  72: '#6C6E68'
});

// A safe file name: starts alphanumeric, no separators, ends in .dat/.ldr.
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]*\.(?:dat|ldr)$/i;
const DEFAULT_MODEL = '__model__';

const round6 = n => Number(n.toFixed(6));
const identity = () => new THREE.Matrix4();

function fail(message) { throw new Error('LDRAW_INPUT_INVALID: ' + message); }

export function mapLdrawPart(partId) {
  if (typeof partId !== 'string') return null;
  const key = partId.trim().toLowerCase();
  if (!LDRAW_PART_MAP[key]) return null;
  return LDRAW_PART_MAP[key];
}

export function mapLdrawColor(code) {
  const n = Number.parseInt(code, 10);
  return Number.isFinite(n) && LDRAW_COLORS[n] ? LDRAW_COLORS[n] : LDRAW_DEFAULT_COLOR;
}

function finiteNumber(token) {
  if (typeof token !== 'string' || token.trim() === '') return null;
  const value = Number(token);
  return Number.isFinite(value) && Math.abs(value) <= LDRAW_MAX_COORDINATE ? value : null;
}

// LDraw line type 1 uses the row-vector convention: p' = p * A + t, where A is
// the supplied 3x3. This builds a Three.js (column-vector) local matrix in mm:
//   L = Translate(S * B * t) * (B * R * B),  B = diag(1,-1,-1), S = mm per LDU.
function localMatrix(record) {
  const B = new THREE.Matrix4().makeScale(1, -1, -1);
  const [a, b, c, d, e, f, g, h, i] = record.matrix;
  const R = new THREE.Matrix4().set(
    a, d, g, 0,
    b, e, h, 0,
    c, f, i, 0,
    0, 0, 0, 1
  );
  const rotation = B.clone().multiply(R).multiply(B);
  const t = new THREE.Vector3(record.translation[0], record.translation[1], record.translation[2])
    .multiplyScalar(LDRAW_MM_PER_LDU);
  rotation.setPosition(t.x, -t.y, -t.z);
  return rotation;
}

function transformOf(world) {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  world.decompose(position, quaternion, scale);
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
  return {
    posMm: [round6(position.x), round6(position.y), round6(position.z)],
    rotationEuler: [round6(euler.x), round6(euler.y), round6(euler.z)]
  };
}

/**
 * Parse LDraw text into typed records grouped by model section. Pure data; no
 * geometry is created and nothing is executed.
 */
export function parseLdrawLines(text, options = {}) {
  if (typeof text !== 'string') fail('source must be a string');
  const maxLines = options.maxLines ?? LDRAW_MAX_LINES;
  if (!Number.isInteger(maxLines) || maxLines < 1) fail('maxLines must be a positive integer');

  const diagnostics = [];
  const records = [];
  const models = new Map();
  const modelOrder = [];
  let current = DEFAULT_MODEL;
  models.set(DEFAULT_MODEL, []);
  let step = 1;
  let stepCommands = 0;

  const allLines = text.split(/\r?\n/);
  const body = allLines.slice(0, maxLines);
  if (allLines.length - 1 > maxLines)
    diagnostics.push({
      code: 'LINE_BUDGET_EXCEEDED', severity: 'error',
      message: 'Input exceeds the ' + maxLines + ' line budget; remaining lines ignored'
    });

  for (let index = 0; index < body.length; index++) {
    const raw = body[index];
    const line = raw.trim();
    if (line === '') continue;
    const tokens = line.split(/\s+/);
    const type = Number.parseInt(tokens[0], 10);
    const base = { line: index + 1, type, step, raw: raw.slice(0, 200) };

    if (type === 0) {
      const file = /^0\s+FILE\s+(.+?)\s*$/i.exec(line);
      if (file) {
        const name = file[1].trim();
        if (!SAFE_NAME.test(name)) {
          diagnostics.push({
            code: 'UNSAFE_MODEL_NAME', severity: 'warning', line: index + 1,
            message: 'Ignored model with an unsafe name'
          });
          current = DEFAULT_MODEL;
        } else {
          if (!models.has(name)) { models.set(name, []); modelOrder.push(name); }
          current = name;
        }
        records.push({ ...base, meta: 'file', name: file[1] });
        continue;
      }
      if (/^0\s+STEP\b/i.test(line)) {
        step++;
        stepCommands++;
        const stepRecord = { ...base, meta: 'step' };
        records.push(stepRecord);
        (models.get(current) || models.get(DEFAULT_MODEL)).push(stepRecord);
        continue;
      }
      records.push({ ...base, meta: 'comment' });
      continue;
    }

    if (type === 1) {
      const colorCode = Number.parseInt(tokens[1], 10);
      const translation = [finiteNumber(tokens[2]), finiteNumber(tokens[3]), finiteNumber(tokens[4])];
      const matrix = tokens.slice(5, 14).map(finiteNumber);
      const part = tokens[14];
      const bad = translation.some(v => v === null) || matrix.length < 9 || matrix.some(v => v === null);
      if (bad || !part || colorCode === undefined || Number.isNaN(colorCode)) {
        diagnostics.push({
          code: 'MALFORMED_REFERENCE', severity: 'error', line: index + 1,
          message: 'Line type 1 requires a colour, 3 coordinates, a 3x3 matrix and a part'
        });
        continue;
      }
      if (!SAFE_NAME.test(part)) {
        diagnostics.push({
          code: 'UNSAFE_PART_NAME', severity: 'error', line: index + 1,
          message: 'Rejected part reference with an unsafe name'
        });
        continue;
      }
      const record = { ...base, meta: 'reference', colorCode, translation, matrix, part };
      records.push(record);
      (models.get(current) || models.get(DEFAULT_MODEL)).push(record);
      continue;
    }

    if (type >= 2 && type <= 5) {
      // Raw primitives are intentionally not imported as geometry.
      records.push({ ...base, meta: 'primitive' });
      continue;
    }

    diagnostics.push({
      code: 'UNKNOWN_LINE_TYPE', severity: 'warning', line: index + 1,
      message: 'Ignored unknown line type ' + tokens[0]
    });
  }

  return {
    records, models, modelOrder, diagnostics,
    stats: {
      lines: records.length,
      references: records.filter(r => r.meta === 'reference').length,
      primitives: records.filter(r => r.meta === 'primitive').length,
      stepCommands,
      models: modelOrder.length || 1
    }
  };
}

/**
 * Import LDraw text into catalog-mapped component instances (mm, +Y up).
 * Returns status 'ok' when every reference resolved, else 'needs_revision'.
 */
export function importLdraw(text, catalog, options = {}) {
  if (!Array.isArray(catalog)) fail('catalog must be an array of components');
  const parsed = parseLdrawLines(text, options);
  const diagnostics = [...parsed.diagnostics];
  const unsupported = [];
  const catalogIds = new Set(catalog.map(c => c.id));
  const byId = new Map(catalog.map(c => [c.id, c]));
  const maxBodies = options.maxBodies ?? LDRAW_MAX_BODIES;
  const maxDepth = options.maxDepth ?? LDRAW_MAX_DEPTH;
  if (!Number.isInteger(maxBodies) || maxBodies < 1) fail('maxBodies must be a positive integer');
  if (!Number.isInteger(maxDepth) || maxDepth < 0) fail('maxDepth must be a non-negative integer');

  const named = parsed.modelOrder.filter(name => name !== DEFAULT_MODEL);
  let activeName = options.model
    ?? (named.length ? named[named.length - 1] : DEFAULT_MODEL);
  if (options.model && !parsed.models.has(options.model)) {
    diagnostics.push({
      code: 'MODEL_NOT_FOUND', severity: 'error',
      message: 'Requested model ' + options.model + ' was not found'
    });
    activeName = DEFAULT_MODEL;
  }

  const components = [];
  let expandedSubmodels = 0;
  let budgetHit = false;

  const expand = (modelName, parent, depth, stepBase) => {
    if (budgetHit) return;
    const lines = parsed.models.get(modelName);
    if (!lines) return;
    if (depth > maxDepth) {
      diagnostics.push({
        code: 'DEPTH_BUDGET_EXCEEDED', severity: 'error',
        message: 'Sub-model nesting exceeded depth ' + maxDepth + ' at ' + modelName
      });
      return;
    }
    let localStep = 1;
    for (const record of lines) {
      if (record.type === 0) { if (record.meta === 'step') localStep++; continue; }
      if (record.type !== 1) continue;
      const world = parent.clone().multiply(localMatrix(record));
      const mapped = mapLdrawPart(record.part);
      if (mapped && catalogIds.has(mapped)) {
        if (components.length >= maxBodies) {
          budgetHit = true;
          diagnostics.push({
            code: 'BODY_BUDGET_EXCEEDED', severity: 'error',
            message: 'Component budget of ' + maxBodies + ' reached'
          });
          return;
        }
        const { posMm, rotationEuler } = transformOf(world);
        const component = byId.get(mapped);
        components.push({
          instanceId: 'ldraw_' + components.length + '_' + mapped,
          ldrawPartId: record.part,
          catalogId: mapped,
          code: component.code,
          name: component.name,
          colorCode: record.colorCode,
          colorHex: mapLdrawColor(record.colorCode),
          posMm,
          rotationEuler,
          step: stepBase + localStep - 1
        });
      } else if (parsed.models.has(record.part)) {
        expandedSubmodels++;
        expand(record.part, world, depth + 1, stepBase + localStep - 1);
      } else {
        unsupported.push({
          partId: record.part,
          step: stepBase + localStep - 1,
          reason: mapped ? 'catalog-id-missing' : 'unmapped-part'
        });
        diagnostics.push({
          code: 'UNSUPPORTED_PART', severity: 'warning', line: record.line,
          message: 'Unsupported LDraw part ' + record.part
        });
      }
    }
  };

  if (!budgetHit) expand(activeName, identity(), 0, 1);

  const errors = diagnostics.filter(d => d.severity === 'error');
  const status = (errors.length || unsupported.length) ? 'needs_revision' : 'ok';

  return {
    schemaVersion: 1,
    kind: 'LdrawImport',
    interopVersion: LDRAW_INTEROP_VERSION,
    status,
    model: { name: activeName, components },
    unsupported,
    diagnostics,
    stats: {
      lines: parsed.stats.lines,
      references: parsed.stats.references,
      mapped: components.length,
      unmapped: unsupported.length,
      expandedSubmodels,
      modelCount: parsed.modelOrder.length || 1
    },
    limits: {
      maxLines: options.maxLines ?? LDRAW_MAX_LINES,
      maxBodies,
      maxDepth
    },
    capability: {
      ldr: true, mpd: true, nestedSubmodels: true,
      realGeometry: false, studioRoundTrip: 'not-run', network: false
    }
  };
}
