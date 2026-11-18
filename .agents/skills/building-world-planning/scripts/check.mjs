import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('building-world-planning');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill building-world-planning: OK');
