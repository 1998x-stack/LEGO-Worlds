import fs from 'node:fs';
import { resolveCapability } from '../packages/plugin-registry/index.mjs';
import { runWorldTool } from '../packages/world-runner/index.mjs';

function flags(argv) {
  const result={_:[]};
  for(let i=0;i<argv.length;i++){
    const value=argv[i];
    if(!value.startsWith('--')){result._.push(value);continue;}
    const name=value.slice(2);
    if(name==='allow-write'||name==='stdin'){result[name]=true;continue;}
    if(!['request','prompt','workspace','output','target','attempts','iterations'].includes(name))
      throw new Error('Unknown option '+value);
    if(result[name]!==undefined)throw new Error('Duplicate option '+value);
    if(argv[i+1]===undefined)throw new Error('Missing value for '+value);
    result[name]=argv[++i];
  }
  return result;
}
function inputJson(filename,fromStdin=false) {
  if(!fromStdin){
    if(!filename)throw new Error('Pass --request file.json or --stdin');
    const stat=fs.statSync(filename);
    if(!stat.isFile()||stat.size>300000)throw new Error('Input file exceeds 300 KB');
  }
  const value=fs.readFileSync(fromStdin?0:filename,'utf8');
  if(value.length>300000)throw new Error('Input JSON exceeds 300 KB');
  return JSON.parse(value);
}

export function runSkillCapabilityCli(capability,argv=process.argv.slice(2)){
  try{
    const resolved=resolveCapability(capability);
    if(!resolved.executable)throw new Error('This skill capability is guidance-only');
    const operation=resolved.capability.operation;
    const opt=flags(argv);
    const provided=opt.request||opt.stdin
      ?inputJson(opt.request,opt.stdin):null;
    let request;
    if(provided?.protocolVersion==='world-tools/v1'){
      if(provided.capability!==capability||provided.operation!==operation)
        throw new Error('Skill entrypoint cannot run a different capability');
      request=provided;
    }else{
      const input=provided || (operation==='plan'?{prompt:opt.prompt||opt._.join(' ')}:null);
      if(!input || typeof input!=='object')
        throw new Error('Input object required for '+operation);
      request={protocolVersion:'world-tools/v1',operation,capability,input,options:{}};
    }
    if(opt.output)request.options={...request.options,outputPath:opt.output};
    if(opt.target)request.options={...request.options,targetLevel:opt.target};
    if(opt.attempts)request.options={...request.options,maxAttempts:Number(opt.attempts)};
    if(opt.iterations)request.options={...request.options,maxIterations:Number(opt.iterations)};
    const report=runWorldTool(request,{
      workspace:opt.workspace||null,
      writeAllowed:opt['allow-write']===true
    });
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    if(report.status==='unsupported')process.exitCode=3;
    else if(report.status!=='ok')process.exitCode=2;
    return report;
  }catch(error){
    process.stderr.write('Skill '+capability+': '+String(error.message||error)+'\n');
    process.exitCode=1;
    return null;
  }
}
