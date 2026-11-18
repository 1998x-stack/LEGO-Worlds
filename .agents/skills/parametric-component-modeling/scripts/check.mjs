import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('parametric-component-modeling');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill parametric-component-modeling: OK');
