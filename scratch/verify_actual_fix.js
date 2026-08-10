const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url.split('?')[0];
    if (filePath === './') filePath = './index.html';
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(8095, () => {
    console.log('Verification server running on http://127.0.0.1:8095/');
    try {
        console.log('\n========================================');
        console.log('RUNNING VERIFICATION LIGHTHOUSE DESKTOP AUDIT...');
        console.log('========================================');
        execSync('npx lighthouse http://127.0.0.1:8095/ --preset=desktop --output=json --output-path=scratch/verify_lh_desktop.json --chrome-flags="--headless"', { stdio: 'inherit' });
        
        const d = JSON.parse(fs.readFileSync('scratch/verify_lh_desktop.json'));
        console.log('\n=== DESKTOP RESULTS AFTER FIX ===');
        console.log('Performance:', d.categories.performance?.score * 100);
        console.log('Accessibility:', d.categories.accessibility?.score * 100);
        console.log('Best Practices:', d.categories['best-practices']?.score * 100);
        console.log('SEO:', d.categories.seo?.score * 100);
        if (d.categories['agentic-browsing']) {
            console.log('Agentic Browsing:', d.categories['agentic-browsing'].score * 100);
        }
        console.log('CLS:', d.audits['cumulative-layout-shift']?.displayValue, '(numeric:', d.audits['cumulative-layout-shift']?.numericValue, ')');
        console.log('TBT:', d.audits['total-blocking-time']?.displayValue);
        console.log('LCP:', d.audits['largest-contentful-paint']?.displayValue);

        console.log('\n========================================');
        console.log('RUNNING VERIFICATION LIGHTHOUSE MOBILE AUDIT...');
        console.log('========================================');
        execSync('npx lighthouse http://127.0.0.1:8095/ --output=json --output-path=scratch/verify_lh_mobile.json --chrome-flags="--headless"', { stdio: 'inherit' });

        const m = JSON.parse(fs.readFileSync('scratch/verify_lh_mobile.json'));
        console.log('\n=== MOBILE RESULTS AFTER FIX ===');
        console.log('Performance:', m.categories.performance?.score * 100);
        console.log('Accessibility:', m.categories.accessibility?.score * 100);
        console.log('Best Practices:', m.categories['best-practices']?.score * 100);
        console.log('SEO:', m.categories.seo?.score * 100);
        if (m.categories['agentic-browsing']) {
            console.log('Agentic Browsing:', m.categories['agentic-browsing'].score * 100);
        }
        console.log('CLS:', m.audits['cumulative-layout-shift']?.displayValue, '(numeric:', m.audits['cumulative-layout-shift']?.numericValue, ')');
        console.log('TBT:', m.audits['total-blocking-time']?.displayValue);
        console.log('LCP:', m.audits['largest-contentful-paint']?.displayValue);

    } catch (err) {
        console.error('Verification error:', err);
    } finally {
        server.close();
        console.log('\nVerification server closed.');
    }
});
