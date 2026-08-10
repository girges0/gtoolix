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

server.listen(8099, async () => {
    console.log('Gemini E2E test server running on http://127.0.0.1:8099/');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    let geminiBundleLoadedOnHome = false;
    page.on('request', req => {
        if (req.url().includes('gemini-engine.bundle.js')) {
            console.log('Request for gemini-engine.bundle.js detected at URL:', page.url());
            if (page.url() === 'http://127.0.0.1:8099/' || page.url().endsWith('/')) {
                geminiBundleLoadedOnHome = true;
            }
        }
    });

    console.log('Navigating to homepage http://127.0.0.1:8099/ ...');
    await page.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('gemini-engine.bundle.js loaded on homepage?', geminiBundleLoadedOnHome);

    console.log('Navigating to Gemini tool page...');
    const geminiLink = await page.$('a[data-page="gemini"]');
    if (geminiLink) {
        await geminiLink.click();
    } else {
        await page.goto('http://127.0.0.1:8099/gemini-watermark-remover', { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(2000);

    const isGeminiEngineAvailable = await page.evaluate(() => typeof window.GeminiEngine !== 'undefined');
    console.log('Is window.GeminiEngine available on Gemini tool page?', isGeminiEngineAvailable);

    await browser.close();
    server.close();
});
