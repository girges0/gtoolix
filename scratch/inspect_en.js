const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 850 });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
        setLanguage('en');
    });
    await page.waitForTimeout(500);

    const report = await page.evaluate(() => {
        const getEl = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            return {
                tag: el.tagName,
                cls: el.className,
                rect: { left: r.left, right: r.right, width: r.width },
                style: {
                    width: s.width,
                    maxWidth: s.maxWidth,
                    minWidth: s.minWidth,
                    paddingLeft: s.paddingLeft,
                    paddingRight: s.paddingRight,
                    marginLeft: s.marginLeft,
                    marginRight: s.marginRight,
                    alignItems: s.alignItems,
                    direction: s.direction
                }
            };
        };

        return {
            htmlDir: document.documentElement.dir,
            htmlLang: document.documentElement.lang,
            hero: getEl('#hero'),
            container: getEl('.hero-container'),
            content: getEl('#hero-content'),
            h1: getEl('.hero h1'),
            lead: getEl('.hero p.lead'),
            actions: getEl('.hero-actions'),
            btn1: getEl('.hero-actions .btn-primary'),
            btn2: getEl('.hero-actions .btn-ghost'),
            card: getEl('.tiktok-showcase-card')
        };
    });

    console.log(JSON.stringify(report, null, 2));
    await browser.close();
})();
