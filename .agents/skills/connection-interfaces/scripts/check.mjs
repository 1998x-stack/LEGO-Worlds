import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('connection-interfaces');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill connection-interfaces: OK');
