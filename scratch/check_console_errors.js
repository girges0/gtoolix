const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push({ type: 'console.error', text: msg.text(), location: msg.location() });
        }
    });

    page.on('pageerror', err => {
        errors.push({ type: 'uncaughtException', text: err.message, stack: err.stack });
    });

    console.log('Navigating to http://localhost:8098/ ...');
    await page.goto('http://localhost:8098/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Scroll down to trigger scroll handlers and IntersectionObservers
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(1000);

    // Test clicking navigation tabs
    const qrLink = await page.$('a[data-page="qr"]');
    if (qrLink) await qrLink.click();
    await page.waitForTimeout(1000);

    const homeLink = await page.$('a[data-page="home"]');
    if (homeLink) await homeLink.click();
    await page.waitForTimeout(1000);

    console.log('\n=== LOGGED BROWSER CONSOLE ERRORS & UNCAUGHT EXCEPTIONS ===');
    console.log(JSON.stringify(errors, null, 2));

    await browser.close();
})();
