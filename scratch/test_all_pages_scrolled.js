const { chromium } = require('playwright');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();

    // Set site-nav to position fixed in CSS for test
    const pagesToTest = [
        '/',
        '/gemini-watermark-remover',
        '/qr-code-generator',
        '/youtube-thumbnail-downloader',
        '/screen-recorder-studio',
        '/about/',
        '/terms-of-service/'
    ];

    const results = {};

    for (const p of pagesToTest) {
        await page.setViewportSize({ width: 375, height: 800 });
        await page.goto(`http://localhost:8080${p}`, { waitUntil: 'networkidle' });

        await page.evaluate(() => {
            const style = document.createElement('style');
            style.id = 'temp-fixed-nav-fix';
            style.textContent = `
                .site-nav {
                    position: fixed !important;
                    top: 0.75rem !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    width: min(100% - 1.5rem, 1180px) !important;
                    margin: 0 auto !important;
                    z-index: 10000 !important;
                }
            `;
            document.head.appendChild(style);
        });

        // Test at top
        const topNavRect = await page.evaluate(() => document.querySelector('.site-nav').getBoundingClientRect());

        // Test scrolled 500px
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(300);

        const scrolledNavRect = await page.evaluate(() => document.querySelector('.site-nav').getBoundingClientRect());

        // Open menu
        await page.evaluate(() => {
            const btn = document.getElementById('nav-toggle');
            if (btn) btn.click();
        });
        await page.waitForTimeout(300);

        const menuRect = await page.evaluate(() => {
            const links = document.querySelector('.site-nav__links');
            if (!links) return null;
            const r = links.getBoundingClientRect();
            return { top: Math.round(r.top), bottom: Math.round(r.bottom), visible: getComputedStyle(links).visibility === 'visible' };
        });

        results[p] = {
            topNavY: Math.round(topNavRect.top),
            scrolledNavY: Math.round(scrolledNavRect.top),
            menuTopY: menuRect ? menuRect.top : null,
            menuVisible: menuRect ? menuRect.visible : false,
            fixedNavWorking: Math.round(scrolledNavRect.top) === Math.round(topNavRect.top)
        };

        // Close menu
        await page.evaluate(() => {
            if (typeof toggleNav === 'function') toggleNav(true);
        });
    }

    console.log(JSON.stringify(results, null, 2));
    await browser.close();
})();
