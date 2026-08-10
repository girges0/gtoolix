const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

    const info = await page.evaluate(() => {
        const btn = document.querySelector('.hero-actions .btn');
        const r = btn.getBoundingClientRect();
        const s = window.getComputedStyle(btn);

        // Find rules applying to btn
        const matchingRules = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText && (rule.selectorText.includes('hero-actions') || rule.selectorText.includes('btn'))) {
                        if (btn.matches(rule.selectorText)) {
                            matchingRules.push({
                                selectorText: rule.selectorText,
                                cssText: rule.cssText,
                                mediaText: rule.parentRule ? rule.parentRule.media.mediaText : 'none'
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        return {
            rect: { left: r.left, right: r.right, width: r.width },
            style: {
                width: s.width,
                maxWidth: s.maxWidth,
                minWidth: s.minWidth,
                paddingLeft: s.paddingLeft,
                paddingRight: s.paddingRight,
                marginLeft: s.marginLeft,
                marginRight: s.marginRight,
                boxSizing: s.boxSizing,
                display: s.display,
                position: s.position
            },
            matchingRules
        };
    });

    console.log(JSON.stringify(info, null, 2));
    await browser.close();
})();
