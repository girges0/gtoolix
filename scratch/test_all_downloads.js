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

server.listen(8098, async () => {
    console.log('Server listening on http://localhost:8098');
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();

    // 1. Test Gemini Downloads
    await page.goto('http://localhost:8098/', { waitUntil: 'networkidle' });
    await page.evaluate(() => showPage('gemini'));
    await page.waitForTimeout(300);

    const sampleImage = path.join(__dirname, 'sample_gemini.png');
    const fileInput = await page.$('#gemini-file-input');
    await fileInput.setInputFiles(sampleImage);
    await page.waitForTimeout(1000);

    // PNG download test
    let countPng = 0;
    const onDownloadPng = () => { countPng++; };
    page.on('download', onDownloadPng);
    await page.click('#gemini-btn-png');
    await page.waitForTimeout(2000);
    page.off('download', onDownloadPng);
    console.log('Gemini PNG downloads count:', countPng);

    // WEBP download test
    let countWebp = 0;
    const onDownloadWebp = () => { countWebp++; };
    page.on('download', onDownloadWebp);
    await page.click('#gemini-btn-webp');
    await page.waitForTimeout(2000);
    page.off('download', onDownloadWebp);
    console.log('Gemini WEBP downloads count:', countWebp);

    // JPG download test
    let countJpg = 0;
    const onDownloadJpg = () => { countJpg++; };
    page.on('download', onDownloadJpg);
    await page.click('#gemini-btn-jpeg');
    await page.waitForTimeout(2000);
    page.off('download', onDownloadJpg);
    console.log('Gemini JPG downloads count:', countJpg);

    await browser.close();
    server.close();
});
