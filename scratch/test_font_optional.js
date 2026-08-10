const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read original index.html
let html = fs.readFileSync('index.html', 'utf8');

// Replace &display=swap with &display=optional
html = html.replace(/display=swap/g, 'display=optional');

fs.writeFileSync('scratch/test_index.html', html);

const server = http.createServer((req, res) => {
    let url = req.url.split('?')[0];
    let filePath;
    if (url === '/') {
        filePath = './scratch/test_index.html';
    } else {
        filePath = '.' + url;
    }
    
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

server.listen(8087, () => {
    console.log('Test server running on http://localhost:8087/');
    try {
        console.log('Running Lighthouse Desktop audit on display=optional test ...');
        execSync('npx lighthouse http://localhost:8087/ --preset=desktop --output=json --output-path=scratch/lh_test_optional.json --chrome-flags="--headless"', { stdio: 'inherit' });
        
        const lh = JSON.parse(fs.readFileSync('scratch/lh_test_optional.json'));
        console.log('\n=== LIGHTHOUSE DESKTOP TEST (display=optional) RESULTS ===');
        console.log('Performance:', lh.categories.performance?.score * 100);
        console.log('Accessibility:', lh.categories.accessibility?.score * 100);
        console.log('Best Practices:', lh.categories['best-practices']?.score * 100);
        console.log('SEO:', lh.categories.seo?.score * 100);
        if (lh.categories['agentic-browsing']) {
            console.log('Agentic Browsing:', lh.categories['agentic-browsing'].score * 100);
        }
        console.log('CLS:', lh.audits['cumulative-layout-shift']?.displayValue, '(numeric:', lh.audits['cumulative-layout-shift']?.numericValue, ')');
        console.log('TBT:', lh.audits['total-blocking-time']?.displayValue);
        console.log('LCP:', lh.audits['largest-contentful-paint']?.displayValue);

        const clsDetails = lh.audits['layout-shifts']?.details;
        if (clsDetails && clsDetails.items) {
            console.log('\nLayout shifts items:', JSON.stringify(clsDetails.items, null, 2));
        }
    } catch (err) {
        console.error('Error running lighthouse:', err.message);
    } finally {
        server.close();
    }
});
