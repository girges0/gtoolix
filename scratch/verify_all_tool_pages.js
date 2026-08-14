const fs = require('fs');
const path = require('path');
const http = require('http');

const rootDir = path.resolve(__dirname, '..');

const urlsToTest = [
    { url: 'https://www.gtoolix.com/', path: 'index.html' },
    { url: 'https://www.gtoolix.com/qrcode/generator', path: 'qrcode/generator/index.html' },
    { url: 'https://www.gtoolix.com/youtube/thumbnail-downloader', path: 'youtube/thumbnail-downloader/index.html' },
    { url: 'https://www.gtoolix.com/gemini/watermark-remover', path: 'gemini/watermark-remover/index.html' },
    { url: 'https://www.gtoolix.com/screen-recorder/studio', path: 'screen-recorder/studio/index.html' },
    { url: 'https://www.gtoolix.com/about', path: 'about/index.html' },
    { url: 'https://www.gtoolix.com/privacy-policy', path: 'privacy-policy/index.html' },
    { url: 'https://www.gtoolix.com/terms-of-service', path: 'terms-of-service/index.html' },
    { url: 'https://www.gtoolix.com/disclaimer', path: 'disclaimer/index.html' },
    { url: 'https://www.gtoolix.com/cookies-policy', path: 'cookies-policy/index.html' },
    { url: 'https://www.gtoolix.com/dmca', path: 'dmca/index.html' },
    { url: 'https://www.gtoolix.com/faq', path: 'faq/index.html' },
    { url: 'https://www.gtoolix.com/contact', path: 'contact/index.html' }
];

console.log('=== STARTING AUTOMATED VALIDATION ===\n');

let passCount = 0;
let failCount = 0;

// 1. Check HTML Files and Metadata
console.log('1. Checking HTML files & Head Metadata:');
urlsToTest.forEach(item => {
    const filePath = path.join(rootDir, item.path);
    if (!fs.existsSync(filePath)) {
        console.error(`  [FAIL] Missing file: ${item.path}`);
        failCount++;
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check Title
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : null;

    // Check Meta Description
    const descMatch = content.match(/<meta\s+name="description"\s+content="(.*?)"/i);
    const desc = descMatch ? descMatch[1] : null;

    // Check Canonical
    const canonicalMatch = content.match(/<link\s+rel="canonical"\s+href="(.*?)"/i);
    const canonical = canonicalMatch ? canonicalMatch[1] : null;

    // Check AdSense ID
    const hasAdsense = content.includes('ca-pub-9332457707004456');

    // Check for unwanted redirect script in tool body
    const hasHashRedirectInBody = /window\.location\.replace\(['"]\/#.*['"]\)/i.test(content);

    let itemPass = true;

    if (!title) { console.error(`  [FAIL] ${item.path}: Missing <title>`); itemPass = false; }
    if (!desc) { console.error(`  [FAIL] ${item.path}: Missing <meta name="description">`); itemPass = false; }
    if (canonical !== item.url) { console.error(`  [FAIL] ${item.path}: Canonical mismatch! Expected: ${item.url}, Got: ${canonical}`); itemPass = false; }
    if (!hasAdsense) { console.error(`  [FAIL] ${item.path}: AdSense ID missing!`); itemPass = false; }
    if (hasHashRedirectInBody) { console.error(`  [FAIL] ${item.path}: Contains legacy window.location.replace('/#...') redirect!`); itemPass = false; }

    if (itemPass) {
        console.log(`  [PASS] ${item.path}`);
        console.log(`         Canonical: ${canonical}`);
        console.log(`         Title: ${title.substring(0, 60)}...`);
        passCount++;
    } else {
        failCount++;
    }
});

// 2. Validate Sitemap.xml
console.log('\n2. Validating sitemap.xml:');
const sitemapPath = path.join(rootDir, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
    console.error('  [FAIL] sitemap.xml missing');
    failCount++;
} else {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    let sitemapPass = true;

    if (!sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
        console.error('  [FAIL] sitemap.xml does not start with standard XML declaration');
        sitemapPass = false;
    }

    if (!sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
        console.error('  [FAIL] sitemap.xml missing standard urlset schema');
        sitemapPass = false;
    }

    urlsToTest.forEach(item => {
        const loc = `<loc>${item.url}</loc>`;
        if (!sitemapContent.includes(loc)) {
            console.error(`  [FAIL] sitemap.xml missing location: ${item.url}`);
            sitemapPass = false;
        }
    });

    if (sitemapContent.includes('#') || sitemapContent.includes('/qr-code-generator')) {
        console.error('  [FAIL] sitemap.xml contains legacy or hash URLs');
        sitemapPass = false;
    }

    if (sitemapPass) {
        console.log('  [PASS] sitemap.xml is valid XML and contains all 13 canonical URLs without legacy/hash links.');
        passCount++;
    } else {
        failCount++;
    }
}

// 3. Validate robots.txt
console.log('\n3. Validating robots.txt:');
const robotsPath = path.join(rootDir, 'robots.txt');
if (fs.existsSync(robotsPath)) {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    if (robotsContent.includes('Allow: /') && robotsContent.includes('Sitemap: https://www.gtoolix.com/sitemap.xml')) {
        console.log('  [PASS] robots.txt is correctly configured.');
        passCount++;
    } else {
        console.error('  [FAIL] robots.txt missing required Allow or Sitemap line');
        failCount++;
    }
}

console.log(`\n=== VALIDATION SUMMARY ===`);
console.log(`Passed checks: ${passCount}`);
console.log(`Failed checks: ${failCount}`);

if (failCount > 0) {
    process.exit(1);
} else {
    console.log('ALL VERIFICATIONS SUCCESSFUL!');
}
