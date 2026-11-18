import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRegistryLock } from '../packages/plugin-registry/index.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const file=path.join(root,'.agents/skills/registry.lock.json');
const expected=JSON.stringify(makeRegistryLock(),null,2)+'\n';
if(process.argv.includes('--write')){
  fs.writeFileSync(file,expected);
  console.log('Locked registry and canonical Skill sources');
}else{
  const current=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
  if(current!==expected){
    console.error('Registry lock is stale; run npm run registry:lock');
    process.exitCode=1;
  }else console.log('Registry lock verified');
}
