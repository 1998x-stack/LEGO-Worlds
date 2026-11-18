import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const registry=()=>JSON.parse(fs.readFileSync(path.join(root,'.agents/skills/registry.json'),'utf8'));
export function renderAdapter(id,description,provider) {
  const label=provider==='.claude'?'Claude Code':'Codex reference';
  return `---
name: ${id}
description: ${description}
---

# ${id} — ${label} entrypoint

This is a thin compatibility entrypoint. The single source of truth is [the canonical skill](../../../.agents/skills/${id}/SKILL.md).

1. Read `../../../.agents/skills/${id}/SKILL.md` fully when this skill is selected.
2. Follow its `references/domain.md` and reuse its `assets/example.json` if needed.
3. Execute supporting scripts from the repository root only after reviewing their source.
4. Honor root `AGENTS.md` and all physical-fidelity and licensing gates.

Do not copy this skill into a divergent provider-specific workflow; edit canonical content and regenerate wrappers.
`;
}
export function diffAdapters(){
  const diffs=[];
  for(const skill of registry().skills){
    for(const provider of ['.claude','.codex']){
      const relative=provider+'/skills/'+skill.id+'/SKILL.md';
      const file=path.join(root,relative);
      const expected=renderAdapter(skill.id,skill.description,provider);
      const actual=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
      if(expected!==actual)diffs.push({relative,expected});
    }
  }
  return diffs;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const diffs=diffAdapters();
  if(process.argv.includes('--write')){
    for(const {relative,expected} of diffs){
      const file=path.join(root,relative);
      fs.mkdirSync(path.dirname(file),{recursive:true});
      fs.writeFileSync(file,expected);
    }
    console.log('Updated '+diffs.length+' Codex/Claude skill adapters');
  }else{
    if(diffs.length){
      console.error('Stale skill adapter files: '+diffs.map(x=>x.relative).join(', '));
      console.error('Run: node scripts/sync-skill-adapters.mjs --write');
      process.exitCode=1;
    }else console.log('Codex/Claude skill adapters match canonical registry');
  }
}
