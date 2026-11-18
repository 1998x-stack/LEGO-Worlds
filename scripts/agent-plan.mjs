import { COMPONENTS } from '../src/catalog.js';
import { createAssemblyPlan } from '../src/ai-agent.js';
const prompt=process.argv.slice(2).join(' ').trim();
if(!prompt){
  console.error('Usage: npm run agent:plan -- "搭建一辆六轮火星探测车"');
  process.exit(2);
}
try{
  const plan=createAssemblyPlan(prompt,COMPONENTS);
  console.log(JSON.stringify(plan,null,2));
  if(plan.status==='requirements-only')process.exitCode=3;
}catch(error){console.error('Planner error: '+error.message);process.exitCode=1;}
