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

server.listen(8097, async () => {
    console.log('Server listening on http://localhost:8097');
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();

    await page.goto('http://localhost:8097/', { waitUntil: 'networkidle' });

    // Set language to English
    await page.evaluate(() => setLanguage('en'));
    await page.waitForTimeout(300);

    // Show Gemini page
    await page.evaluate(() => showPage('gemini'));
    await page.waitForTimeout(300);

    // Upload sample image
    const sampleImage = path.join(__dirname, 'sample_gemini.png');
    const fileInput = await page.$('#gemini-file-input');
    await fileInput.setInputFiles(sampleImage);
    await page.waitForTimeout(1000);

    const posText = await page.textContent('#gemini-pos-text');
    const sizeText = await page.textContent('#gemini-size-text');

    console.log('Position Text (EN):', posText.trim());
    console.log('Size/Processing Text (EN):', sizeText.trim());

    // Take screenshot of stage footer
    const stageFooter = await page.$('.stage-footer-bar');
    if (stageFooter) {
        await stageFooter.screenshot({ path: path.join(__dirname, 'en_footer_result.png') });
    }

    await browser.close();
    server.close();
});
