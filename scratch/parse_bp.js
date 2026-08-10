const fs = require('fs');
const lh = JSON.parse(fs.readFileSync('scratch/lh_console_check.json'));

console.log('=== BEST PRACTICES SCORE ===');
console.log(lh.categories['best-practices']?.score * 100);

console.log('\n=== ERRORS IN CONSOLE AUDIT ===');
console.log(JSON.stringify(lh.audits['errors-in-console'], null, 2));

console.log('\n=== FAILED BEST PRACTICES AUDITS ===');
if (lh.categories['best-practices'] && lh.categories['best-practices'].auditRefs) {
    lh.categories['best-practices'].auditRefs.forEach(ref => {
        const audit = lh.audits[ref.id];
        if (audit && audit.score !== 1 && audit.score !== null) {
            console.log(`Audit [${ref.id}]: score=${audit.score}, title="${audit.title}"`);
            if (audit.details) console.log('Details:', JSON.stringify(audit.details, null, 2));
        }
    });
}
