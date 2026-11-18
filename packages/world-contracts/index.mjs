import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

export const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const LEVELS = Object.freeze(['L0', 'L1', 'L2']);
export const CONTRACT_VERSION = 'world-tools/v1';
const fileForKind = Object.freeze({
  WorldSpec:'world-spec.schema.json',
  GeometryManifest:'geometry-manifest.schema.json',
  AssemblyGraph:'assembly-graph.schema.json',
  ValidationReport:'validation-report.schema.json',
  RepairTrace:'repair-trace.schema.json'
});
const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
const compiled = new Map();

export function schemaFile(relative, root = REPO_ROOT) {
  if (!/^schemas\/[a-z-]+\.schema\.json$/.test(relative))
    throw new Error('INVALID_SCHEMA_REF: schema path must be an allowlisted project schema');
  const filename = path.join(root,relative);
  return JSON.parse(fs.readFileSync(filename,'utf8'));
}

export function schemaValidator(relative) {
  if (!compiled.has(relative)) compiled.set(relative,ajv.compile(schemaFile(relative)));
  return compiled.get(relative);
}

export function checkSchema(relative,value) {
  const validate=schemaValidator(relative);
  if (validate(value)) return [];
  return (validate.errors||[]).map(error=>({
    code:'SCHEMA_INVALID',
    severity:'error',
    path:error.instancePath || '/',
    message:(error.instancePath||'/')+' '+error.message
  }));
}

export function assertSchema(relative,value) {
  const errors=checkSchema(relative,value);
  if (errors.length) throw new Error('SCHEMA_INVALID: '+errors.map(e=>e.message).join('; '));
  return value;
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '['+value.map(stableStringify).join(',')+']';
  const keys=Object.keys(value).sort();
  return '{'+keys.map(k=>JSON.stringify(k)+':'+stableStringify(value[k])).join(',')+'}';
}

export const sha256 = value => 'sha256:'+createHash('sha256').update(stableStringify(value)).digest('hex');
export const gitBlobSha1 = text => createHash('sha1')
  .update('blob '+Buffer.byteLength(text,'utf8')+'\0').update(text,'utf8').digest('hex');

export function createArtifact(kind, level, content, { sources=[], capability='world.assembly.plan', pluginVersion='1.0.0' }={}) {
  if (!fileForKind[kind]) throw new Error('UNSUPPORTED_ARTIFACT_KIND: '+kind);
  if (!LEVELS.includes(level)) throw new Error('UNSUPPORTED_LEVEL: '+level);
  assertSchema('schemas/'+fileForKind[kind],content);
  const sourceArtifacts=sources.map(source=>{
    if(typeof source!=='string'||!/^sha256:[0-9a-f]{64}$/.test(source))
      throw new Error('INVALID_SOURCE_HASH');
    return source;
  });
  const contentHash=sha256({kind,level,content,sourceArtifacts});
  const artifact={
    artifactSchema:'world-artifact/v1',id:'artifact_'+contentHash.slice(7,23),
    kind,level,contentHash,content,sourceArtifacts,
    provenance:{capability,pluginVersion}
  };
  assertSchema('schemas/world-artifact.schema.json',artifact);
  return artifact;
}

export function assertArtifact(artifact,{kind,level}={}) {
  assertSchema('schemas/world-artifact.schema.json',artifact);
  if(kind && kind!==artifact.kind) throw new Error('ARTIFACT_KIND_MISMATCH');
  if(level && level!==artifact.level) throw new Error('ARTIFACT_LEVEL_MISMATCH');
  const expected=sha256({
    kind:artifact.kind,level:artifact.level,content:artifact.content,
    sourceArtifacts:artifact.sourceArtifacts
  });
  if(expected!==artifact.contentHash || artifact.id!=='artifact_'+expected.slice(7,23))
    throw new Error('ARTIFACT_HASH_MISMATCH');
  const filename=fileForKind[artifact.kind];
  if(!filename)throw new Error('UNKNOWN_ARTIFACT_KIND');
  assertSchema('schemas/'+filename,artifact.content);
  return artifact;
}

export function normalizeDiagnostics(diagnostics) {
  return diagnostics.map(item=>({
    code:String(item.code||'UNKNOWN'),
    severity:item.severity==='warning'?'warning':item.severity==='info'?'info':'error',
    subject:item.subject ? String(item.subject):undefined,
    message:String(item.message||item.code||'Unknown error'),
    repairable:Boolean(item.repairable)
  }));
}
