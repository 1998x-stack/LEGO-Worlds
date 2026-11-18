import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, assertSchema, gitBlobSha1 } from '../world-contracts/index.mjs';

const read = (relative,root=REPO_ROOT) => fs.readFileSync(path.join(root,relative),'utf8');
const json = (relative,root=REPO_ROOT) => JSON.parse(read(relative,root));
const idPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function readPluginRegistry(root=REPO_ROOT) {
  const registry=json('.agents/skills/registry.json',root);
  if(registry.schemaVersion!==2 || registry.contractVersion!=='world-tools/v1' ||
     !Array.isArray(registry.skills)||registry.skills.length<1)
    throw new Error('REGISTRY_VERSION_UNSUPPORTED');
  const ids=new Set(), capabilityIds=new Set(), plugins=new Map();
  for(const record of registry.skills){
    if(!idPattern.test(record.id)||ids.has(record.id))
      throw new Error('REGISTRY_DUPLICATE_OR_INVALID_ID: '+record.id);
    ids.add(record.id);
    const expected='.agents/skills/'+record.id+'/plugin.json';
    if(record.manifest!==expected)throw new Error('REGISTRY_PATH_MISMATCH: '+record.id);
    const manifest=json(expected,root);
    assertSchema('schemas/plugin-manifest.schema.json',manifest);
    if(manifest.id!==record.id || manifest.version!==record.version ||
       manifest.skillPath!=='.agents/skills/'+record.id+'/SKILL.md')
      throw new Error('REGISTRY_MANIFEST_DRIFT: '+record.id);
    const capIds=manifest.capabilities.map(cap=>cap.id);
    if(JSON.stringify(capIds)!==JSON.stringify(record.capabilities))
      throw new Error('REGISTRY_CAPABILITY_DRIFT: '+record.id);
    for(const cap of manifest.capabilities){
      if(capabilityIds.has(cap.id))throw new Error('CAPABILITY_DUPLICATE: '+cap.id);
      capabilityIds.add(cap.id);
      if(manifest.execution.mode==='guidance-only'&&cap.readiness!=='guidance-only')
        throw new Error('GUIDANCE_PLUGIN_NOT_EXECUTABLE: '+record.id);
      if(manifest.execution.mode==='builtin'&&cap.readiness!=='available')
        throw new Error('BUILTIN_READINESS_MISMATCH: '+record.id);
    }
    if((manifest.execution.mode==='builtin' && manifest.execution.adapter!=='world-runner-builtin-v1') ||
       (manifest.execution.mode==='guidance-only' && manifest.execution.adapter!==null))
      throw new Error('PLUGIN_EXECUTION_ADAPTER_DENIED: '+record.id);
    if(manifest.permissions.network || manifest.permissions.subprocess ||
       manifest.permissions.filesystem.write.some(p=>p!=='artifact-workspace'))
      throw new Error('UNSAFE_PLUGIN_PERMISSIONS: '+record.id);
    plugins.set(record.id,manifest);
  }
  const ordered=[],visiting=new Set(),seen=new Set();
  function visit(id){
    if(visiting.has(id))throw new Error('PLUGIN_DEPENDENCY_CYCLE: '+id);
    if(seen.has(id))return;
    const plugin=plugins.get(id);
    if(!plugin)throw new Error('PLUGIN_DEPENDENCY_NOT_FOUND: '+id);
    visiting.add(id);
    for(const dep of plugin.dependsOn){
      if(dep===id)throw new Error('PLUGIN_SELF_DEPENDENCY: '+id);
      visit(dep);
    }
    visiting.delete(id);seen.add(id);ordered.push(id);
  }
  [...plugins.keys()].forEach(visit);
  return { registry, plugins, dependencyOrder:ordered };
}

export function resolveCapability(id,root=REPO_ROOT) {
  const loaded=readPluginRegistry(root);
  for(const [pluginId,plugin] of loaded.plugins){
    const capability=plugin.capabilities.find(c=>c.id===id);
    if(capability){
      if(capability.readiness!=='available')
        return {pluginId,plugin,capability,executable:false,
          dependencyOrder:resolveDependencies(pluginId,loaded)};
      return {pluginId,plugin,capability,executable:true,
        dependencyOrder:resolveDependencies(pluginId,loaded)};
    }
  }
  throw new Error('CAPABILITY_NOT_FOUND: '+id);
}

export function resolveDependencies(pluginId,loaded=readPluginRegistry()) {
  if(!loaded.plugins.has(pluginId))throw new Error('PLUGIN_NOT_FOUND: '+pluginId);
  const result=[],visited=new Set();
  const visit=id=>{
    if(visited.has(id))return;
    visited.add(id);
    for(const dep of loaded.plugins.get(id).dependsOn)visit(dep);
    result.push(id);
  };
  visit(pluginId);
  return result;
}

export function discoverCapabilities({operation,level,runnableOnly=false}={},root=REPO_ROOT) {
  const loaded=readPluginRegistry(root);
  const result=[];
  for(const [pluginId,manifest] of loaded.plugins){
    for(const cap of manifest.capabilities){
      if(operation&&cap.operation!==operation)continue;
      if(level&&cap.requiresLevel!==level)continue;
      if(runnableOnly&&cap.readiness!=='available')continue;
      result.push({pluginId,version:manifest.version,readiness:cap.readiness,
        mode:manifest.execution.mode,...cap});
    }
  }
  return result;
}

export function makeRegistryLock(root=REPO_ROOT) {
  const loaded=readPluginRegistry(root);
  const content=read('.agents/skills/registry.json',root);
  return {
    schemaVersion:1,registryBlobSha1:gitBlobSha1(content),
    plugins:[...loaded.plugins].map(([id,manifest])=>({
      id,version:manifest.version,
      manifestBlobSha1:gitBlobSha1(read('.agents/skills/'+id+'/plugin.json',root)),
      skillBlobSha1:gitBlobSha1(read('.agents/skills/'+id+'/SKILL.md',root))
    }))
  };
}

export function verifyRegistryLock(root=REPO_ROOT) {
  const expected=makeRegistryLock(root);
  const actual=json('.agents/skills/registry.lock.json',root);
  if(JSON.stringify(actual)!==JSON.stringify(expected))
    throw new Error('REGISTRY_LOCK_MISMATCH: run npm run registry:lock');
  return actual;
}
