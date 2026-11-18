import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffAdapters } from './sync-skill-adapters.mjs';
import { readPluginRegistry, verifyRegistryLock } from '../packages/plugin-registry/index.mjs';
const root = fileURLToPath(new URL('../',import.meta.url));
const at = p => path.join(root,p);
const read = p => fs.readFileSync(at(p),'utf8');
const validName = n => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n) && n.length<=64;
function frontmatter(text){
  const match=text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if(!match)return {};
  return Object.fromEntries(match[1].split(/\r?\n/).map(line=>{
    const i=line.indexOf(':');return i>0?[line.slice(0,i).trim(),line.slice(i+1).trim()]:['',''];
  }).filter(([k])=>k));
}
export function validateBundle(id){
  const failures=[],rootSkill='.agents/skills/'+id;
  try{
    if(!validName(id))failures.push('Invalid skill directory: '+id);
    const source=read(rootSkill+'/SKILL.md'),fields=frontmatter(source);
    if(fields.name!==id)failures.push(id+': frontmatter name must match directory');
    if(!fields.description || fields.description.length<35 || fields.description.length>1024)
      failures.push(id+': missing or unhelpful description');
    for(const needed of ['references/domain.md','scripts/check.mjs','assets/example.json']){
      if(!fs.existsSync(at(rootSkill+'/'+needed)))failures.push(id+': missing '+needed);
    }
    JSON.parse(read(rootSkill+'/assets/example.json'));
    for(const provider of ['.claude','.codex']){
      const wrapper=read(provider+'/skills/'+id+'/SKILL.md');
      const meta=frontmatter(wrapper);
      if(meta.name!==fields.name || meta.description!==fields.description)
        failures.push(id+': '+provider+' wrapper metadata drift');
      if(!wrapper.includes('../../../.agents/skills/'+id+'/SKILL.md'))
        failures.push(id+': '+provider+' wrapper missing canonical link');
    }
  }catch(error){failures.push(id+': '+error.message);}
  return failures;
}
export function validateAll(){
  const failures=[];
  try{
    const registry=JSON.parse(read('.agents/skills/registry.json'));
    if(registry.schemaVersion!==2)failures.push('Unknown skill registry version');
    if(!Array.isArray(registry.skills)||registry.skills.length<6)failures.push('Missing skill definitions');
    const list=registry.skills.map(s=>s.id);
    if(new Set(list).size!==list.length)failures.push('Duplicate skill names in registry');
    const disk=fs.readdirSync(at('.agents/skills'),{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);
    if(list.slice().sort().join('|')!==disk.slice().sort().join('|'))failures.push('Registry is out of sync with canonical skill directories');
    for(const id of list)failures.push(...validateBundle(id));
    readPluginRegistry();
    verifyRegistryLock();
    for(const adapter of diffAdapters())failures.push('Stale generated adapter: '+adapter.relative);
    const piSkills=fs.readdirSync(at('.pi/skills'),{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);
    if(piSkills.includes('world-systems-architect')||piSkills.some(n=>list.includes(n)))
      failures.push('Pi duplicates canonical skill names: do not mirror in .pi/skills');
    const pi=frontmatter(read('.pi/skills/pi-world-skills-router/SKILL.md'));
    if(pi.name!=='pi-world-skills-router')failures.push('Pi router metadata invalid');
  }catch(error){failures.push('Skill registry: '+error.message);}
  return failures;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const errors=validateAll();
  if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
  else {
    const data=JSON.parse(read('.agents/skills/registry.json'));
    console.log('Validated '+data.skills.length+' canonical skills + Claude/Codex adapters + Pi router');
  }
}
