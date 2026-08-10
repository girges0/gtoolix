const fs = require('fs');

const lh = JSON.parse(fs.readFileSync('scratch/lighthouse_desktop_live.json'));

console.log('=== LAYOUT SHIFTS AUDIT ===');
console.log(JSON.stringify(lh.audits['layout-shifts'], null, 2));

console.log('\n=== CLS CULPRITS INSIGHT ===');
console.log(JSON.stringify(lh.audits['cls-culprits-insight'], null, 2));
