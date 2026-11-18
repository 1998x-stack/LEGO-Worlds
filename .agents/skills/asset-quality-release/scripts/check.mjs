import { validateBundle } from '../../../../scripts/validate-skills.mjs';
const errors = validateBundle('asset-quality-release');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Skill asset-quality-release: OK');
