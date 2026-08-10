const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push({ text: msg.text(), location: msg.location() });
        }
    });

    page.on('pageerror', err => {
        errors.push({ type: 'pageerror', text: err.message, stack: err.stack });
    });

    for (const url of ['https://calm-pudding-82fcbe.netlify.app/', 'https://fantastic-gumdrop-7a0fb4.netlify.app/']) {
        console.log(`\nNavigating to ${url} ...`);
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(2000);
        } catch (e) {
            console.log(`Failed to navigate to ${url}: ${e.message}`);
        }
    }

    console.log('\n=== NETLIFY CONSOLE ERRORS ===');
    console.log(JSON.stringify(errors, null, 2));

    await browser.close();
})();
