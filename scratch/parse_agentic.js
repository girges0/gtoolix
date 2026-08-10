const fs = require('fs');

if (fs.existsSync('scratch/lighthouse_desktop_live.json')) {
    const lh = JSON.parse(fs.readFileSync('scratch/lighthouse_desktop_live.json'));
    console.log('=== DESKTOP AGENTIC BROWSING CATEGORY ===');
    console.log(JSON.stringify(lh.categories['agentic-browsing'], null, 2));

    if (lh.categories['agentic-browsing'] && lh.categories['agentic-browsing'].auditRefs) {
        console.log('\n=== AUDIT DETAILS FOR AGENTIC BROWSING ===');
        lh.categories['agentic-browsing'].auditRefs.forEach(ref => {
            const audit = lh.audits[ref.id];
            console.log(`Audit [${ref.id}] (weight=${ref.weight}): score=${audit ? audit.score : 'N/A'}, displayValue=${audit ? audit.displayValue : ''}`);
            if (audit && audit.score < 1) {
                console.log('   Details:', JSON.stringify(audit.details || audit.explanation || audit.title, null, 2));
            }
        });
    }
} else {
    console.log('scratch/lighthouse_desktop_live.json not found');
}
