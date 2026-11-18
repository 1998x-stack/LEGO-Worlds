#!/usr/bin/env node
import fs from 'node:fs';
import { runWorldTool, runWorldPipeline } from '../../packages/world-runner/index.mjs';
import { discoverCapabilities, verifyRegistryLock } from '../../packages/plugin-registry/index.mjs';

const defaults={
  plan:'world.assembly.plan',
  build:'world.geometry.build',
  validate:'world.kinematics.validate',
  repair:'world.assembly.repair',
  export:'world.artifact.export'
};
const usage=[
  'Usage:',
  '  npm run world:run -- registry',
  '  npm run world:run -- pipeline --prompt "搭建一辆六轮火星探测车"',
  '  npm run world:run -- plan --prompt "设计一个四连杆机构"',
  '  npm run world:run -- validate --request request.json',
  '  npm run world:run -- repair --request request.json',
  '  npm run world:run -- export --request request.json --workspace ./work --allow-write',
  '',
  'A request file is a world-tools/v1 JSON envelope with operation, capability and input.',
  'With no --workspace/--allow-write, export returns a JSON bundle but cannot write files.',
  'Use --target L0|L1|L2 to select the requested evidence tier.'
].join('\n');

function argsToOptions(argv) {
  const args={_:[]};
  for(let i=0;i<argv.length;i++){
    if(argv[i].startsWith('--')){
      const key=argv[i].slice(2);
      if(key==='allow-write'){args[key]=true;continue;}
      const value=argv[++i];
      if(value===undefined)throw new Error('Missing value for --'+key);
      if(args[key]!==undefined)throw new Error('Duplicate CLI flag --'+key);
      args[key]=value;
    }else args._.push(argv[i]);
  }
  const allowed=['prompt','request','target','workspace','allow-write','output','capability','iterations','attempts'];
  for(const key of Object.keys(args))if(key!=='_'&&!allowed.includes(key))
    throw new Error('Unknown CLI flag --'+key);
  return args;
}

function readJson(pathname) {
  const stat=fs.statSync(pathname);
  if(!stat.isFile()||stat.size>300000)throw new Error('Input JSON file exceeds 300 KB');
  return JSON.parse(fs.readFileSync(pathname,'utf8'));
}

function main() {
  const [command,...argv]=process.argv.slice(2);
  if(!command||['--help','-h','help'].includes(command)){
    process.stdout.write(usage+'\n');return 0;
  }
  const flags=argsToOptions(argv);
  if(command==='registry'){
    verifyRegistryLock();
    process.stdout.write(JSON.stringify({
      protocolVersion:'world-tools/v1',
      capabilities:discoverCapabilities(),
      executable:discoverCapabilities({runnableOnly:true}).length
    },null,2)+'\n');
    return 0;
  }
  if(command==='pipeline'){
    const prompt=flags.prompt||flags._.join(' ');
    if(!prompt)throw new Error('pipeline requires --prompt');
    const output=runWorldPipeline(prompt,{targetLevel:flags.target||'L2'});
    process.stdout.write(JSON.stringify(output,null,2)+'\n');
    return output.status==='ok'?0:output.status==='unsupported'?3:2;
  }
  if(!defaults[command])throw new Error('Unknown operation: '+command);
  let request;
  if(flags.request){
    request=readJson(flags.request);
    if(request.operation!==command)throw new Error('Request file operation does not match CLI operation');
  }else if(command==='plan'){
    const prompt=flags.prompt||flags._.join(' ');
    if(!prompt)throw new Error('plan requires --prompt or --request');
    request={protocolVersion:'world-tools/v1',operation:'plan',
      capability:flags.capability||defaults.plan,
      input:{prompt},options:{targetLevel:flags.target||'L2'}};
  }else throw new Error(command+' requires --request <file.json>');
  if(flags.output){
    request.options={...request.options,outputPath:flags.output};
  }
  if(flags.iterations)request.options={...request.options,maxIterations:Number(flags.iterations)};
  if(flags.attempts)request.options={...request.options,maxAttempts:Number(flags.attempts)};
  const result=runWorldTool(request,{
    workspace:flags.workspace||null,writeAllowed:flags['allow-write']===true
  });
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  return result.status==='ok'?0:result.status==='unsupported'?3:2;
}

try{process.exitCode=main();}
catch(error){
  process.stderr.write('world-runner: '+String(error.message||error)+'\n');
  process.exitCode=1;
}
