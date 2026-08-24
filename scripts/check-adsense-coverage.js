const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OFFICIAL_ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9332457707004456" crossorigin="anonymous"></script>';
const ADSENSE_REGEX = /<script\s+async\s+src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-9332457707004456["']\s+crossorigin=["']anonymous["']><\/script>/gi;
const ANY_ADSENSE_REGEX = /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/gi;

function getAllHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.agents' && file !== 'brain' && file !== 'scratch') {
                results = results.concat(getAllHtmlFiles(fullPath));
            }
        } else if (file.endsWith('.html')) {
            results.push(fullPath);
        }
    });
    return results;
}

const htmlFiles = getAllHtmlFiles(ROOT_DIR);
console.log(`\n======================================================`);
console.log(`🔍 Auditing Google AdSense across ${htmlFiles.length} HTML Files`);
console.log(`======================================================\n`);

let passedCount = 0;
let failedCount = 0;
const report = [];

htmlFiles.forEach(filePath => {
    const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    if (!headMatch) {
        report.push({ file: relPath, status: 'ERROR', reason: 'No <head> tag found' });
        failedCount++;
        return;
    }

    const headContent = headMatch[1];
    const bodyContent = bodyMatch ? bodyMatch[1] : '';

    const inHeadMatches = headContent.match(ANY_ADSENSE_REGEX) || [];
    const inBodyMatches = bodyContent.match(ANY_ADSENSE_REGEX) || [];

    if (inHeadMatches.length === 1 && inBodyMatches.length === 0 && headContent.includes('ca-pub-9332457707004456')) {
        passedCount++;
        report.push({ file: relPath, status: 'PASS', details: 'Exact tag present once in <head>' });
    } else if (inHeadMatches.length === 0) {
        failedCount++;
        report.push({ file: relPath, status: 'FAIL', reason: 'AdSense script MISSING from <head>' });
    } else if (inHeadMatches.length > 1) {
        failedCount++;
        report.push({ file: relPath, status: 'FAIL', reason: `Duplicate AdSense tags in <head> (${inHeadMatches.length} found)` });
    } else if (inBodyMatches.length > 0) {
        failedCount++;
        report.push({ file: relPath, status: 'FAIL', reason: `AdSense tag found in <body> (${inBodyMatches.length} times)` });
    } else {
        failedCount++;
        report.push({ file: relPath, status: 'FAIL', reason: 'Publisher ID mismatch or invalid attributes' });
    }
});

report.forEach(r => {
    if (r.status === 'PASS') {
        console.log(`✅ [PASS] ${r.file}`);
    } else {
        console.log(`❌ [${r.status}] ${r.file} -> ${r.reason}`);
    }
});

console.log(`\n======================================================`);
console.log(`Summary: ${passedCount} Passed, ${failedCount} Failed out of ${htmlFiles.length} HTML files.`);
console.log(`======================================================\n`);

if (failedCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
