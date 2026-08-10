const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mime = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(48922, '127.0.0.1', async () => {
    console.log('HTTP preview server running at http://127.0.0.1:48922/');

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://127.0.0.1:48922/');
    await page.waitForLoadState('networkidle');

    const artifactDir = path.join('C:', 'Users', 'Girges', '.gemini', 'antigravity-ide', 'brain', 'e93d45a4-98c6-457c-823e-0d8c8bbd8886');
    const headerScreenshot = path.join(artifactDir, 'gtoolix_header_preview.png');
    
    const headerElement = await page.$('.site-nav');
    if (headerElement) {
        await headerElement.screenshot({ path: headerScreenshot });
        console.log('Saved header preview screenshot over HTTP to:', headerScreenshot);
    }

    await browser.close();
    server.close();
});
