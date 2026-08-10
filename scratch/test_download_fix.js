const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Simple static server for testing
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

server.listen(8099, async () => {
    console.log('Server listening on http://localhost:8099');
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();
    const downloads = [];
    page.on('download', d => {
        downloads.push(d.suggestedFilename());
        console.log('Download intercepted:', d.suggestedFilename());
    });

    await page.goto('http://localhost:8099/', { waitUntil: 'networkidle' });

    // Navigate to gemini
    await page.evaluate(() => showPage('gemini'));
    await page.waitForTimeout(500);

    // Set file
    const sampleImage = path.join(__dirname, 'sample_gemini.png');
    const fileInput = await page.$('#gemini-file-input');
    await fileInput.setInputFiles(sampleImage);
    await page.waitForTimeout(1000);

    // Click PNG download button once
    console.log('Clicking gemini-btn-png...');
    await page.click('#gemini-btn-png');
    await page.waitForTimeout(2000);

    console.log('Total downloads intercepted after 1 click:', downloads.length);

    await browser.close();
    server.close();
});
