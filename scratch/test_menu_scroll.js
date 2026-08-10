const { chromium } = require('playwright');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

    // 1. Screenshot menu at top of page
    await page.evaluate(() => {
        if (typeof toggleNav === 'function') toggleNav();
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'C:/Users/Girges/.gemini/antigravity-ide/brain/bc876e0c-13f2-4a69-9f5d-582f04109c18/menu_at_top.png' });

    // Close menu
    await page.evaluate(() => {
        if (typeof toggleNav === 'function') toggleNav(true);
    });
    await page.waitForTimeout(300);

    // 2. Scroll down 600px
    await page.evaluate(() => {
        window.scrollTo(0, 600);
    });
    await page.waitForTimeout(400);

    // Open menu when scrolled down
    await page.evaluate(() => {
        if (typeof toggleNav === 'function') toggleNav();
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'C:/Users/Girges/.gemini/antigravity-ide/brain/bc876e0c-13f2-4a69-9f5d-582f04109c18/menu_scrolled.png' });

    console.log("Screenshots captured!");
    await browser.close();
})();
