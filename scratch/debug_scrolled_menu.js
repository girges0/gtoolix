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

    // Apply fix to .site-nav and html/body
    await page.evaluate(() => {
        document.documentElement.style.overflowX = 'visible';
        document.body.style.overflowX = 'visible';

        const nav = document.querySelector('.site-nav');
        if (nav) {
            nav.style.position = 'sticky';
            nav.style.top = '0.5rem';
            nav.style.zIndex = '10000';
        }
    });

    // Scroll down 600px
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(400);

    // Open menu
    await page.evaluate(() => {
        const toggle = document.getElementById('nav-toggle');
        if (toggle) toggle.click();
    });
    await page.waitForTimeout(400);

    const data = await page.evaluate(() => {
        const nav = document.querySelector('.site-nav');
        const links = document.querySelector('.site-nav__links');
        return {
            scrollY: window.scrollY,
            navTop: nav ? nav.getBoundingClientRect().top : null,
            linksTop: links ? links.getBoundingClientRect().top : null,
            linksVisible: links ? getComputedStyle(links).visibility : null
        };
    });

    console.log(JSON.stringify(data, null, 2));

    await page.screenshot({ path: 'C:/Users/Girges/.gemini/antigravity-ide/brain/bc876e0c-13f2-4a69-9f5d-582f04109c18/menu_fixed_scrolled.png' });

    await browser.close();
})();
