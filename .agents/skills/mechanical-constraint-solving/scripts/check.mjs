import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('mechanical-constraint-solving');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill mechanical-constraint-solving: OK');
