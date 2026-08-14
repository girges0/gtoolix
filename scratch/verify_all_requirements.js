const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== VERIFYING ALL USER REQUIREMENTS ===');

// 1. Inspect HTML
const html = fs.readFileSync('gemini/watermark-remover/index.html', 'utf8');
const dropZoneMatch = html.match(/<label[^>]*id="gemini-drop-zone"[^>]*>/s);
console.log('1. Drop zone HTML element:');
console.log(dropZoneMatch ? dropZoneMatch[0] : 'NOT FOUND');

const hasRoleButton = dropZoneMatch ? dropZoneMatch[0].includes('role="button"') : false;
console.log('   Contains role="button"?', hasRoleButton, '(Must be false)');

// 2. Inspect JS
const js = fs.readFileSync('static/js/gemini-watermark-remover.js', 'utf8');
const dropZoneJs = js.includes("document.getElementById('gemini-drop-zone')");
console.log('2. JavaScript gemini-drop-zone binding intact?', dropZoneJs);

// 3. Lighthouse test
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

server.listen(8091, () => {
    console.log('Running Lighthouse accessibility verification on port 8091...');
    try {
        execSync('npx lighthouse http://localhost:8091/gemini/watermark-remover/ --preset=desktop --only-categories=accessibility --output=json --output-path=scratch/verify_lh_final.json --chrome-flags="--headless"', { stdio: 'inherit' });
        
        const lh = JSON.parse(fs.readFileSync('scratch/verify_lh_final.json'));
        console.log('\n3. Lighthouse Accessibility Score:', lh.categories.accessibility?.score * 100);
        console.log('   Audit [aria-allowed-role] score:', lh.audits['aria-allowed-role']?.score);
        console.log('   Audit [aria-allowed-role] failing elements count:', lh.audits['aria-allowed-role']?.details?.items?.length || 0);
    } catch (err) {
        console.error('Lighthouse error:', err.message);
    } finally {
        server.close();
        console.log('\nAll checks completed.');
    }
});
