const { execSync } = require('child_process');
const fs = require('fs');

console.log('Running Lighthouse desktop audit to check errors-in-console audit...');
try {
    execSync('npx lighthouse http://localhost:8098/ --preset=desktop --output=json --output-path=scratch/lh_console_check.json --chrome-flags="--headless"', { stdio: 'inherit' });
    
    const lh = JSON.parse(fs.readFileSync('scratch/lh_console_check.json'));
    console.log('\n=== ERRORS-IN-CONSOLE AUDIT RESULT ===');
    console.log(JSON.stringify(lh.audits['errors-in-console'], null, 2));

    console.log('\n=== BEST PRACTICES CATEGORY ===');
    console.log('Score:', lh.categories['best-practices']?.score * 100);
} catch (e) {
    console.error('Lighthouse run error:', e.message);
}
