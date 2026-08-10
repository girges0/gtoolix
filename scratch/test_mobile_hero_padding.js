const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const root = path.join(__dirname, '..');
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath)) filePath = path.join(root, 'index.html');
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(8095, async () => {
    console.log('Server listening on http://localhost:8095');
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true
    });
    const page = await context.newPage();

    await page.goto('http://localhost:8095/', { waitUntil: 'networkidle' });
    await page.evaluate(() => showPage('gemini'));
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(__dirname, 'mobile_gemini_after_fix.png') });

    await browser.close();
    server.close();
});
