import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('assembly-sequence-animation');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill assembly-sequence-animation: OK');
