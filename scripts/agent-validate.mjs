import fs from 'node:fs';
import { COMPONENTS } from '../src/catalog.js';
import { validateGeneratedPlan } from '../src/ai-agent.js';
const file=process.argv[2];
if(!file){console.error('Usage: node scripts/agent-validate.mjs <plan.json>');process.exit(2);}
try{
  const document=JSON.parse(fs.readFileSync(file,'utf8'));
  const plan=validateGeneratedPlan(document,COMPONENTS);
  console.log(JSON.stringify({status:plan.status,verification:plan.verification},null,2));
  if(plan.verification.collisionPairs.length)process.exitCode=4;
}catch(error){console.error('Plan rejected: '+error.message);process.exitCode=1;}
