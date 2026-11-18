#!/usr/bin/env node
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runWorldTool, runWorldPipeline } from '../../packages/world-runner/index.mjs';
import { discoverCapabilities } from '../../packages/plugin-registry/index.mjs';

const schema=(properties={},required=[])=>({
  type:'object',properties,required,additionalProperties:false
});
const obj={type:'object'};
const text={type:'string'};
export const MCP_TOOLS=Object.freeze([
  {name:'world_registry',title:'Discover 3D Skills',description:'List trusted world-plugin capabilities and their L0/L1/L2 readiness. No arbitrary third-party executable scripts.',inputSchema:schema()},
  {name:'world_plan',title:'Plan world requirements',description:'Compile Chinese or English intent into traceable L0 WorldSpec. Only known mechanical blueprints continue to L1/L2.',inputSchema:schema({prompt:text,targetLevel:{type:'string',enum:['L0','L1','L2']}},['prompt'])},
  {name:'world_build',title:'Build geometry/assembly artifacts',description:'Rebuild procedural meshes/anchors from a checked WorldSpec and catalog-backed proposal; produce L1 and L2 candidate artifacts.',inputSchema:schema({worldSpec:obj,proposal:obj},['worldSpec','proposal'])},
  {name:'world_validate',title:'Independently validate L0 L1 L2',description:'Ignore self-asserted approvals. Verify hard requirements, actual geometry bounds and constrained graph kinematics.',inputSchema:schema({worldSpec:obj,geometry:obj,assembly:obj,clearance:obj,targetLevel:{type:'string',enum:['L0','L1','L2']}},['worldSpec'])},
  {name:'world_repair',title:'Safely repair graph data',description:'Bounded conservative normalization with hard-requirement preservation; no arbitrary design mutation or tolerance relaxation.',inputSchema:schema({graph:obj,worldSpec:obj,maxAttempts:{type:'integer',minimum:0,maximum:5}},['graph'])},
  {name:'world_export',title:'Export verified JSON artifact bundle',description:'Revalidate source artifacts, return content-addressed JSON in MCP response only; no filesystem writes.',inputSchema:schema({worldSpec:obj,geometry:obj,assembly:obj,targetLevel:{type:'string',enum:['L0','L1','L2']}},['worldSpec'])},
  {name:'world_pipeline',title:'Run complete world plan-build-validation',description:'End-to-end L0→L1→L2 demo using deterministic blueprints, real procedural bounds and graph solver; requirements-only on unsupported domains.',inputSchema:schema({prompt:text,targetLevel:{type:'string',enum:['L0','L1','L2']}},['prompt'])}
]);

const latest='2026-07-28',legacy='2025-11-25';
function protocol(message) {
  const version=message?.params?._meta?.['io.modelcontextprotocol/protocolVersion'] ||
    message?._meta?.['io.modelcontextprotocol/protocolVersion'];
  return version===latest?latest:legacy;
}
function requestError(id,code,message) {
  return {jsonrpc:'2.0',id,error:{code,message}};
}
function toolResult(data,version) {
  const success=data?.status==='ok'||data?.status===undefined;
  const response={
    ...(version===latest?{resultType:'complete'}:{}),
    content:[{type:'text',text:JSON.stringify(data)}],
    structuredContent:data,
    isError:!success
  };
  return response;
}
function demandNoExtra(args,tool) {
  if(!args || typeof args!=='object'||Array.isArray(args))
    throw new Error('Arguments must be an object');
  const allowed=new Set(Object.keys(tool.inputSchema.properties));
  for(const key of Object.keys(args))
    if(!allowed.has(key))throw new Error('Unsupported argument '+key);
  for(const name of tool.inputSchema.required)
    if(args[name]===undefined)throw new Error('Missing '+name);
}
function invoke(name,args) {
  if(name==='world_registry')
    return {status:'ok',protocolVersion:'world-tools/v1',
      capabilities:discoverCapabilities()};
  if(name==='world_pipeline')
    return runWorldPipeline(args.prompt,{targetLevel:args.targetLevel||'L2'});
  const mapping={
    world_plan:['plan','world.assembly.plan'],
    world_build:['build','world.geometry.build'],
    world_validate:['validate','world.kinematics.validate'],
    world_repair:['repair','world.assembly.repair'],
    world_export:['export','world.artifact.export']
  };
  const mapped=mapping[name];
  if(!mapped)throw new Error('Tool not found: '+name);
  const [operation,capability]=mapped;
  const input={...args};
  const options={};
  for(const key of ['targetLevel','maxAttempts','clearance']){
    if(input[key]!==undefined){options[key]=input[key];delete input[key];}
  }
  return runWorldTool({
    protocolVersion:'world-tools/v1',operation,capability,input,options
  },{writeAllowed:false});
}

export function handleMcpMessage(message) {
  if(!message||message.jsonrpc!=='2.0'||typeof message.method!=='string')
    return requestError(message?.id??null,-32600,'Invalid JSON-RPC request');
  if(message.id===undefined) {
    // Notifications receive no JSON-RPC response.
    return null;
  }
  const version=protocol(message);
  try{
    if(message.method==='initialize')return {
      jsonrpc:'2.0',id:message.id,
      result:{
        protocolVersion:legacy,capabilities:{tools:{listChanged:false}},
        serverInfo:{name:'lego-worlds-skills',version:'0.8.0'},
        instructions:'Skills orchestrate capabilities; independent L0/L1/L2 software validation does not imply physical certification.'
      }
    };
    if(message.method==='ping')return {jsonrpc:'2.0',id:message.id,result:{}};
    if(message.method==='tools/list')return {
      jsonrpc:'2.0',id:message.id,
      result:{
        ...(version===latest?{resultType:'complete'}:{}),
        tools:MCP_TOOLS
      }
    };
    if(message.method==='tools/call'){
      const name=message.params?.name;
      const tool=MCP_TOOLS.find(t=>t.name===name);
      if(!tool)return requestError(message.id,-32602,'Unknown tool name');
      const args=message.params?.arguments??{};
      demandNoExtra(args,tool);
      const executed=invoke(name,args);
      return {jsonrpc:'2.0',id:message.id,result:toolResult(executed,version)};
    }
    return requestError(message.id,-32601,'Method not found');
  }catch(error){
    // A normal tool execution error is reported as tool data so Agents can
    // inspect diagnostics and repair, not as an unstructured transport crash.
    if(message.method==='tools/call')return {
      jsonrpc:'2.0',id:message.id,
      result:toolResult({
        protocolVersion:'world-tools/v1',status:'failed',capability:message.params?.name||'unknown',
        artifacts:[],diagnostics:[{code:'MCP_TOOL_ERROR',severity:'error',
          message:String(error.message||error).slice(0,300)}]
      },version)
    };
    return requestError(message.id,-32603,'Internal error');
  }
}

async function serveStdio() {
  const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
  for await(const line of rl){
    if(!line.trim())continue;
    if(Buffer.byteLength(line,'utf8')>300000){
      process.stdout.write(JSON.stringify(requestError(null,-32600,'Message exceeds 300 KB'))+'\n');
      continue;
    }
    let answer;
    try{answer=handleMcpMessage(JSON.parse(line));}
    catch{answer=requestError(null,-32700,'Parse error');}
    if(answer!==null)process.stdout.write(JSON.stringify(answer)+'\n');
  }
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
  serveStdio().catch(error=>{
    process.stderr.write('MCP server error: '+error.message+'\n');
    process.exitCode=1;
  });
