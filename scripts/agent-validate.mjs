import fs from 'node:fs';
import { COMPONENTS } from '../src/catalog.js';
import { validateGeneratedPlan, validateExternalGraphProposal } from '../src/ai-agent.js';
const isProposal=process.argv.includes('--proposal');
const file=process.argv.find((arg,index)=>index>=2 && arg!=='--proposal');
if(!file){console.error('Usage: node scripts/agent-validate.mjs [--proposal] <plan.json>');process.exit(2);}
try{
  const document=JSON.parse(fs.readFileSync(file,'utf8'));
  const plan=isProposal?validateExternalGraphProposal(document,COMPONENTS):validateGeneratedPlan(document,COMPONENTS);
  console.log(JSON.stringify({status:plan.status,verification:plan.verification},null,2));
  if(plan.verification.collisionPairs.length)process.exitCode=4;
}catch(error){console.error('Plan rejected: '+error.message);process.exitCode=1;}
