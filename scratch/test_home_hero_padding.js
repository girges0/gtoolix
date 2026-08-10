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

server.listen(8093, async () => {
    console.log('Server listening on http://localhost:8093');
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }

    // Desktop test
    const pageDesktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await pageDesktop.goto('http://localhost:8093/', { waitUntil: 'domcontentloaded' });
    await pageDesktop.waitForTimeout(500);
    await pageDesktop.screenshot({ path: path.join(__dirname, 'home_hero_desktop_screenshot.png') });

    // Mobile test
    const pageMobile = await browser.newPage({ viewport: { width: 375, height: 667 }, isMobile: true });
    await pageMobile.goto('http://localhost:8093/', { waitUntil: 'domcontentloaded' });
    await pageMobile.waitForTimeout(500);
    await pageMobile.screenshot({ path: path.join(__dirname, 'home_hero_mobile_screenshot.png') });

    await browser.close();
    server.close();
});
