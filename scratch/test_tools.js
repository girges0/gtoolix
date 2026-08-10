const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser test for GToolix tools...');
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        const errors = [];
        page.on('pageerror', err => errors.push(err.toString()));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));

        const qrState = await page.evaluate(() => {
            return {
                qrToolDefined: typeof window.QRTool !== 'undefined',
                qrCanvas: !!document.querySelector('#qr-canvas-container canvas, #qr-canvas-container svg, #qr-canvas-container img'),
                geminiDefined: typeof window.GeminiWatermarkTool !== 'undefined',
                uploadBox: !!document.getElementById('gemini-upload-box')
            };
        });

        console.log('Test Results:', qrState);
        console.log('Console Errors:', errors);

        await browser.close();
    } catch (e) {
        console.error('Puppeteer test error:', e.message);
    }
})();
