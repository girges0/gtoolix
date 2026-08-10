const fs = require('fs');

const lh = JSON.parse(fs.readFileSync('scratch/lighthouse_desktop_live.json'));

console.log('=== LIVE NETLIFY DESKTOP LIGHTHOUSE SCORES ===');
console.log('Performance:', lh.categories.performance ? lh.categories.performance.score * 100 : 'N/A');
console.log('Accessibility:', lh.categories.accessibility ? lh.categories.accessibility.score * 100 : 'N/A');
console.log('Best Practices:', lh.categories['best-practices'] ? lh.categories['best-practices'].score * 100 : 'N/A');
console.log('SEO:', lh.categories.seo ? lh.categories.seo.score * 100 : 'N/A');
if (lh.categories['agentic-browsing']) {
    console.log('Agentic Browsing:', lh.categories['agentic-browsing'].score * 100);
}

console.log('\n=== KEY METRICS ===');
console.log('FCP:', lh.audits['first-contentful-paint']?.displayValue);
console.log('LCP:', lh.audits['largest-contentful-paint']?.displayValue);
console.log('TBT:', lh.audits['total-blocking-time']?.displayValue);
console.log('CLS:', lh.audits['cumulative-layout-shift']?.displayValue, '(numericValue:', lh.audits['cumulative-layout-shift']?.numericValue, ')');

console.log('\n=== CUMULATIVE LAYOUT SHIFT AUDIT DETAILS ===');
const clsDetails = lh.audits['layout-shifts']?.details;
if (clsDetails && clsDetails.items) {
    console.log(JSON.stringify(clsDetails.items, null, 2));
} else {
    console.log('No layout shift items breakdown found.');
}

console.log('\n=== AGENTIC BROWSING AUDITS ===');
Object.keys(lh.audits).forEach(key => {
    if (key.includes('agentic') || key.includes('ai') || key.includes('structured-data') || key.includes('crawler') || key.includes('llm') || key.includes('robots')) {
        console.log(`[${key}]: score=${lh.audits[key].score}, displayValue=${lh.audits[key].displayValue || ''}`);
    }
});

console.log('\n=== FAILED AUDITS (Score < 1) ===');
Object.keys(lh.audits).forEach(key => {
    const audit = lh.audits[key];
    if (audit.score !== null && audit.score < 1 && audit.score !== undefined) {
        console.log(`Audit [${key}] (${audit.title}): score=${audit.score}, numericValue=${audit.numericValue || audit.displayValue}`);
    }
});
