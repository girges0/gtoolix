const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

console.log('====================================================');
console.log('GToolix Comprehensive Technical SEO & Perf Audit');
console.log('====================================================\n');

// Find all public HTML files
function getHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.git' || file === 'scratch' || file === 'templates' || file === 'gtoolix-monitoring-site' || file === 'archived_gemini_tool') return;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getHtmlFiles(fullPath));
        } else if (file.endsWith('.html')) {
            results.push(fullPath);
        }
    });
    return results;
}

const htmlFiles = getHtmlFiles(ROOT);
console.log(`Found ${htmlFiles.length} HTML files to audit.\n`);

const issues = [];
const fileReport = {};

htmlFiles.forEach(file => {
    const relPath = path.relative(ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const report = {
        file: relPath,
        warnings: [],
        errors: [],
        info: []
    };

    // 1. Check Title
    const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
    if (!titleMatch || !titleMatch[1].trim()) {
        report.errors.push('Missing or empty <title>');
    } else {
        const title = titleMatch[1].trim();
        report.title = title;
        if (title.length < 20) report.warnings.push(`Short title (${title.length} chars): "${title}"`);
        if (title.length > 70) report.warnings.push(`Long title (${title.length} chars): "${title}"`);
    }

    // 2. Check Meta Description
    const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
                      content.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
    if (!descMatch || !descMatch[1].trim()) {
        report.errors.push('Missing or empty meta description');
    } else {
        const desc = descMatch[1].trim();
        report.description = desc;
        if (desc.length < 50) report.warnings.push(`Short meta description (${desc.length} chars)`);
        if (desc.length > 170) report.warnings.push(`Long meta description (${desc.length} chars)`);
    }

    // 3. Check Canonical
    const is404Page = relPath === '404.html' || relPath === 'en/404.html';
    const canonicalMatches = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/gi) || [];
    if (canonicalMatches.length === 0) {
        if (!is404Page) {
            report.errors.push('Missing canonical link tag');
        }
    } else if (canonicalMatches.length > 1) {
        report.errors.push(`Duplicate canonical link tags found (${canonicalMatches.length})`);
    } else {
        const cUrl = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)[1];
        report.canonical = cUrl;
        if (!cUrl.startsWith('https://www.gtoolix.com')) {
            report.errors.push(`Canonical URL is not absolute HTTPS: "${cUrl}"`);
        }
    }

    // 4. Check Robots Meta
    const robotsMatch = content.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
    if (robotsMatch) {
        report.robots = robotsMatch[1];
        if (is404Page && !robotsMatch[1].includes('noindex')) {
            report.warnings.push('404 page should have noindex in robots meta');
        }
        if (!is404Page && robotsMatch[1].includes('noindex')) {
            report.errors.push(`Accidental noindex on public page: ${robotsMatch[1]}`);
        }
    } else if (is404Page) {
        report.warnings.push('404.html missing robots noindex meta');
    }

    // 5. Check OpenGraph & Twitter Cards
    const ogTitle = content.match(/<meta\s+property=["']og:title["']/i);
    const ogDesc = content.match(/<meta\s+property=["']og:description["']/i);
    const ogUrl = content.match(/<meta\s+property=["']og:url["']/i);
    const ogImage = content.match(/<meta\s+property=["']og:image["']/i);
    const twCard = content.match(/<meta\s+name=["']twitter:card["']/i);

    if (relPath !== '404.html') {
        if (!ogTitle) report.warnings.push('Missing og:title');
        if (!ogDesc) report.warnings.push('Missing og:description');
        if (!ogUrl) report.warnings.push('Missing og:url');
        if (!ogImage) report.warnings.push('Missing og:image');
        if (!twCard) report.warnings.push('Missing twitter:card');
    }

    // 6. Check Schema.org JSON-LD
    const schemaMatches = content.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
    if (!schemaMatches && relPath !== '404.html') {
        report.warnings.push('No Schema.org JSON-LD markup found');
    } else if (schemaMatches) {
        schemaMatches.forEach(sm => {
            const rawJson = sm.replace(/<script\s+type=["']application\/ld\+json["']>/i, '').replace(/<\/script>/i, '').trim();
            try {
                const parsed = JSON.parse(rawJson);
                report.schemaType = parsed['@type'] || (parsed['@graph'] ? parsed['@graph'].map(g => g['@type']).join(', ') : 'unknown');
            } catch (e) {
                report.errors.push(`Invalid JSON-LD Syntax: ${e.message}`);
            }
        });
    }

    // 7. Check Headings (H1)
    const h1Matches = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    if (h1Matches.length === 0) {
        report.errors.push('No <h1> heading found');
    } else if (h1Matches.length > 1) {
        report.warnings.push(`Multiple <h1> tags found (${h1Matches.length})`);
    }

    // 8. Check AdSense Script & Publisher ID
    const adsenseMatches = content.match(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-9332457707004456/gi) || [];
    if (adsenseMatches.length === 0 && relPath !== '404.html') {
        report.warnings.push('Missing standard AdSense publisher script tag');
    } else if (adsenseMatches.length > 1) {
        report.errors.push(`Duplicate AdSense scripts in head (${adsenseMatches.length})`);
    }

    // 9. Check Images (width, height, alt, loading)
    const imgMatches = content.match(/<img\s+[^>]*>/gi) || [];
    imgMatches.forEach(img => {
        if (!img.includes('alt=')) {
            report.warnings.push(`Image missing alt attribute: ${img.substring(0, 50)}...`);
        }
        if (!img.includes('width=') || !img.includes('height=')) {
            report.warnings.push(`Image missing explicit width/height (causes CLS): ${img.substring(0, 50)}...`);
        }
    });

    fileReport[relPath] = report;
});

// Print summary
console.log('=== AUDIT RESULTS BY PAGE ===');
let totalErrors = 0;
let totalWarnings = 0;

for (const [file, rep] of Object.entries(fileReport)) {
    console.log(`\n[${file}]`);
    if (rep.canonical) console.log(`   Canonical: ${rep.canonical}`);
    if (rep.schemaType) console.log(`   Schema: ${rep.schemaType}`);
    
    if (rep.errors.length > 0) {
        rep.errors.forEach(e => {
            console.error(`   [ERROR] ERROR: ${e}`);
            totalErrors++;
        });
    }
    if (rep.warnings.length > 0) {
        rep.warnings.forEach(w => {
            console.warn(`   [WARNING] WARNING: ${w}`);
            totalWarnings++;
        });
    }
    if (rep.errors.length === 0 && rep.warnings.length === 0) {
        console.log('   [SUCCESS] All SEO checks passed cleanly.');
    }
}

console.log(`\n====================================================`);
console.log(`Audit Finished: ${totalErrors} Errors, ${totalWarnings} Warnings.`);
console.log(`====================================================`);
