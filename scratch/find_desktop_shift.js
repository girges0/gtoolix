const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

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
        '.woff': 'application/font-woff',
        '.woff2': 'font/woff2',
        '.ttf': 'application/font-ttf',
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

server.listen(8085, async () => {
    console.log('Server running on http://localhost:8085/');

    const browser = await chromium.launch({ headless: true });
    
    // Desktop Viewport (1366x768)
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    
    await page.addInitScript(() => {
        window.layoutShifts = [];
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    window.layoutShifts.push({
                        value: entry.value,
                        sources: entry.sources ? entry.sources.map(s => ({
                            node: s.node ? (s.node.className || s.node.tagName || s.node.id) : null,
                            previousRect: s.previousRect,
                            currentRect: s.currentRect
                        })) : []
                    });
                }
            }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
    });

    console.log('Navigating to http://localhost:8085/ ...');
    await page.goto('http://localhost:8085/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const shifts = await page.evaluate(() => window.layoutShifts);
    console.log('Captured Layout Shifts count:', shifts.length);
    console.log('Captured Layout Shifts:', JSON.stringify(shifts, null, 2));

    const totalCLS = shifts.reduce((sum, s) => sum + s.value, 0);
    console.log('Total Desktop CLS measured:', totalCLS);

    await browser.close();
    server.close();
});
