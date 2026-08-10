const { chromium } = require('playwright');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();

    const widths = [360, 375, 414, 768];
    const langs = [
        { name: 'English (LTR)', lang: 'en', dir: 'ltr' },
        { name: 'Arabic (RTL)', lang: 'ar', dir: 'rtl' }
    ];

    const results = {};

    for (const l of langs) {
        results[l.name] = {};
        for (const w of widths) {
            await page.setViewportSize({ width: w, height: 800 });
            await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
            
            // Set language and dir on html
            await page.evaluate(({ lang, dir }) => {
                document.documentElement.lang = lang;
                document.documentElement.dir = dir;
                localStorage.setItem('siteLang', lang);
                if (typeof applyTranslations === 'function') {
                    applyTranslations();
                }
            }, { lang: l.lang, dir: l.dir });

            await page.waitForTimeout(500);

            const pageScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
            const windowWidth = await page.evaluate(() => window.innerWidth);

            const overflowingElements = await page.evaluate((vw) => {
                const list = [];
                const all = document.querySelectorAll('#hero *');
                all.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    // Check if element extends beyond viewport right edge or left edge
                    if (rect.right > vw + 1 || rect.left < -1) {
                        list.push({
                            tagName: el.tagName,
                            className: el.className,
                            id: el.id,
                            text: el.innerText ? el.innerText.substring(0, 40).replace(/\n/g, ' ') : '',
                            rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }
                        });
                    }
                });
                return list;
            }, w);

            results[l.name][w] = {
                windowWidth,
                pageScrollWidth,
                hasOverflow: pageScrollWidth > windowWidth,
                overflowCount: overflowingElements.length,
                overflowingElements
            };

            if (w === 375) {
                const picName = l.dir === 'ltr' ? 'hero_after_en_375.png' : 'hero_after_ar_375.png';
                await page.screenshot({ path: `C:/Users/Girges/.gemini/antigravity-ide/brain/bc876e0c-13f2-4a69-9f5d-582f04109c18/${picName}` });
            }
        }
    }

    console.log(JSON.stringify(results, null, 2));
    await browser.close();
})();
