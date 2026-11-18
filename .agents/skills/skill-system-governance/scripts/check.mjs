import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('skill-system-governance');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill skill-system-governance: OK');
