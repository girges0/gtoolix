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

server.listen(8086, () => {
    console.log('Local test server running on http://localhost:8086/');
    try {
        console.log('Running Lighthouse Desktop audit on http://localhost:8086/ ...');
        execSync('npx lighthouse http://localhost:8086/ --preset=desktop --output=json --output-path=scratch/lh_local_desktop.json --chrome-flags="--headless"', { stdio: 'inherit' });
        
        const lh = JSON.parse(fs.readFileSync('scratch/lh_local_desktop.json'));
        console.log('\n=== LOCAL LIGHTHOUSE DESKTOP AUDIT RESULTS ===');
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
