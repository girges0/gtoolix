const { chromium } = require('playwright');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

    const cachedVal = await page.evaluate(() => localStorage.getItem('gtoolix_user_country'));
    console.log("Cached country in localStorage:", cachedVal);
    console.log("Console Errors caught:", errors);

    await browser.close();
})();
