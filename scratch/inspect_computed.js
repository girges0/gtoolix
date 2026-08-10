const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 371, height: 860 });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        if (typeof applyTranslations === 'function') applyTranslations();
    });
    await page.waitForTimeout(500);

    const detailedTrace = await page.evaluate(() => {
        let curr = document.querySelector('.hero-actions .btn');
        const chain = [];
        while (curr && curr !== document.documentElement) {
            const r = curr.getBoundingClientRect();
            const s = window.getComputedStyle(curr);
            chain.push({
                tagName: curr.tagName,
                className: curr.className,
                id: curr.id,
                rect: { left: r.left, right: r.right, width: r.width },
                boxModel: {
                    marginLeft: s.marginLeft,
                    marginRight: s.marginRight,
                    paddingLeft: s.paddingLeft,
                    paddingRight: s.paddingRight,
                    borderLeftWidth: s.borderLeftWidth,
                    borderRightWidth: s.borderRightWidth,
                    left: s.left,
                    right: s.right,
                    transform: s.transform,
                    width: s.width,
                    maxWidth: s.maxWidth,
                    minWidth: s.minWidth,
                    alignItems: s.alignItems,
                    justifyContent: s.justifyContent,
                    textAlign: s.textAlign,
                    display: s.display,
                    boxSizing: s.boxSizing
                }
            });
            curr = curr.parentElement;
        }
        return chain;
    });

    console.log(JSON.stringify(detailedTrace, null, 2));
    await browser.close();
})();
