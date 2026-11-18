import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('ai-assembly-planning');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill ai-assembly-planning: OK');
