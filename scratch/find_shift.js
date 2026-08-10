const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 360, height: 800 });

    for (const dir of ['ltr', 'rtl']) {
        console.log(`\n=== TESTING DIR: ${dir} on 360px ===`);
        await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
        await page.evaluate(({ dir }) => {
            document.documentElement.lang = dir === 'ltr' ? 'en' : 'ar';
            document.documentElement.dir = dir;
            if (typeof applyTranslations === 'function') applyTranslations();
        }, { dir });
        await page.waitForTimeout(500);

        const tree = await page.evaluate(() => {
            const els = [
                document.documentElement,
                document.body,
                document.querySelector('#page-home'),
                document.querySelector('.hero'),
                document.querySelector('.hero-container'),
                document.querySelector('.hero-content'),
                document.querySelector('.hero-eyebrow-wrapper'),
                document.querySelector('.hero-eyebrow'),
                document.querySelector('.hero h1'),
                document.querySelector('.hero p.lead'),
                document.querySelector('.hero-actions'),
                document.querySelectorAll('.hero-actions .btn')[0],
                document.querySelector('.hero-showcase'),
                document.querySelector('.tiktok-showcase-card')
            ];

            return els.filter(Boolean).map(el => {
                const r = el.getBoundingClientRect();
                const s = window.getComputedStyle(el);
                return {
                    tag: el.tagName,
                    cls: el.className,
                    id: el.id,
                    left: Math.round(r.left),
                    right: Math.round(r.right),
                    width: Math.round(r.width),
                    scrollWidth: el.scrollWidth,
                    clientWidth: el.clientWidth,
                    maxWidth: s.maxWidth,
                    margin: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
                    padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`
                };
            });
        });

        console.log(JSON.stringify(tree, null, 2));
    }

    await browser.close();
})();
