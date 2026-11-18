import { validateAll } from '../../../../scripts/validate-skills.mjs';
const errors = validateAll();
if (errors.length) {console.error(errors.join('\n'));process.exitCode=1;} else console.log('Pi skill router: OK');
