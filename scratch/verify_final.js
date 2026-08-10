const { chromium } = require('playwright');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();

    const testCases = [
        { name: 'en_360', lang: 'en', width: 360 },
        { name: 'en_375', lang: 'en', width: 375 },
        { name: 'en_414', lang: 'en', width: 414 },
        { name: 'en_768', lang: 'en', width: 768 },
        { name: 'ar_360', lang: 'ar', width: 360 },
        { name: 'ar_375', lang: 'ar', width: 375 },
        { name: 'ar_414', lang: 'ar', width: 414 },
        { name: 'ar_768', lang: 'ar', width: 768 }
    ];

    const results = {};

    for (const tc of testCases) {
        await page.setViewportSize({ width: tc.width, height: 850 });
        await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

        await page.evaluate((lang) => {
            if (typeof setLanguage === 'function') {
                setLanguage(lang);
            }
        }, tc.lang);

        await page.waitForTimeout(400);

        const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
        const winW = tc.width;

        const heroRect = await page.evaluate(() => {
            const h = document.querySelector('#hero');
            const r = h.getBoundingClientRect();
            return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
        });

        const ctaRect = await page.evaluate(() => {
            const btn = document.querySelector('.hero-actions .btn');
            if (!btn) return null;
            const r = btn.getBoundingClientRect();
            return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
        });

        results[tc.name] = {
            viewportWidth: winW,
            documentScrollWidth: scrollW,
            zeroOverflow: scrollW <= winW,
            heroBounds: heroRect,
            ctaButtonBounds: ctaRect
        };

        if (tc.name === 'en_375' || tc.name === 'ar_375') {
            await page.screenshot({
                path: `C:/Users/Girges/.gemini/antigravity-ide/brain/bc876e0c-13f2-4a69-9f5d-582f04109c18/hero_final_${tc.name}.png`
            });
        }
    }

    console.log(JSON.stringify(results, null, 2));
    await browser.close();
})();
