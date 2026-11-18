import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('world-systems-architect');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill world-systems-architect: OK');
