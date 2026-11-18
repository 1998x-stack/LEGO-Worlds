import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('mobile-robotics-worlds');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill mobile-robotics-worlds: OK');
