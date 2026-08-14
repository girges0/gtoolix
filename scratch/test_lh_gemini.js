const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url.split('?')[0];
    if (filePath.endsWith('/')) filePath += 'index.html';
    
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

server.listen(8088, () => {
    console.log('Local test server running on http://localhost:8088/gemini/watermark-remover/');
    try {
        execSync('npx lighthouse http://localhost:8088/gemini/watermark-remover/ --preset=desktop --only-categories=accessibility --output=json --output-path=scratch/lh_gemini_res.json --chrome-flags="--headless"', { stdio: 'inherit' });
        
        const lh = JSON.parse(fs.readFileSync('scratch/lh_gemini_res.json'));
        console.log('\n=== LIGHTHOUSE GEMINI ACCESSIBILITY AUDIT ===');
        console.log('Accessibility Score:', lh.categories.accessibility?.score * 100);
        console.log('aria-allowed-role audit:', JSON.stringify(lh.audits['aria-allowed-role'], null, 2));
    } catch (err) {
        console.error('Error running lighthouse:', err.message);
    } finally {
        server.close();
    }
});
