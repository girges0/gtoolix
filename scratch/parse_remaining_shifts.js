const fs = require('fs');

const lh = JSON.parse(fs.readFileSync('scratch/lighthouse_desktop_final.json'));

console.log('=== REMAINING LAYOUT SHIFTS DETAILS ===');
const clsDetails = lh.audits['layout-shifts']?.details;
if (clsDetails && clsDetails.items) {
    console.log(JSON.stringify(clsDetails.items, null, 2));
} else {
    console.log('No layout shift items breakdown found.');
}
