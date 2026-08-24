/**
 * Trace Vercel rewrites for verification
 */
const fs = require('fs');
const path = require('path');

const vercelJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
const rewrites = vercelJson.rewrites || [];

function matchRoute(pathname) {
    for (const rule of rewrites) {
        // Simple regex conversion of Vercel source pattern
        let patternStr = rule.source
            .replace(/:slug\(\(\?!index\$\)\.\+\)/g, '(?<slug>(?!index$).+)')
            .replace(/:match\*/g, '(?<match>.*)')
            .replace(/:slug/g, '(?<slug>[^/]+)');
        
        // Exact match regex
        const regex = new RegExp(`^${patternStr}$`);
        const match = pathname.match(regex);
        if (match) {
            let dest = rule.destination;
            if (match.groups) {
                for (const [key, val] of Object.entries(match.groups)) {
                    dest = dest.replace(`:${key}`, val);
                }
            }
            return { matchedRule: rule.source, destination: dest };
        }
    }
    return { matchedRule: null, destination: pathname };
}

const testPaths = [
    '/blog/',
    '/en/blog/',
    '/blog/qr-code',
    '/en/blog/qr-code',
    '/programs/desktop-suite',
    '/en/programs/desktop-suite',
    '/tools/qr-code-generator',
    '/en/tools/qr-code-generator'
];

console.log('=== VERCEL REWRITE RULES TRACE ===');
console.log(`Total rewrite rules loaded: ${rewrites.length}\n`);

testPaths.forEach(p => {
    // Normalize path by stripping trailing slash for matching if not root
    const cleanPath = p.length > 1 ? p.replace(/\/+$/, '') : p;
    const res = matchRoute(cleanPath);
    console.log(`Path: "${p}"`);
    console.log(`  -> Normalized: "${cleanPath}"`);
    console.log(`  -> Matched Source: "${res.matchedRule}"`);
    console.log(`  -> Final Target:   "${res.destination}"\n`);
});
