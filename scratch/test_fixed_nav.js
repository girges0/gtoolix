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

    // Apply fixed positioning to .site-nav
    await page.evaluate(() => {
        const style = document.createElement('style');
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

    // Scroll down 600px
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(400);

    const dataBeforeClick = await page.evaluate(() => {
        const nav = document.querySelector('.site-nav');
        return {
            scrollY: window.scrollY,
            navTop: nav ? nav.getBoundingClientRect().top : null
        };
    });
    console.log("Before click scrolled down:", JSON.stringify(dataBeforeClick));

    // Open menu
    await page.evaluate(() => {
        if (typeof toggleNav === 'function') toggleNav();
    });
    await page.waitForTimeout(400);

    const dataAfterClick = await page.evaluate(() => {
        const nav = document.querySelector('.site-nav');
        const links = document.querySelector('.site-nav__links');
        const anchors = Array.from(document.querySelectorAll('.site-nav__links a'));
        return {
            scrollY: window.scrollY,
            navTop: nav ? nav.getBoundingClientRect().top : null,
            linksTop: links ? links.getBoundingClientRect().top : null,
            anchorsTop: anchors.map(a => ({ text: a.innerText, top: a.getBoundingClientRect().top }))
        };
    });
    console.log("After click scrolled down:", JSON.stringify(dataAfterClick));

    await page.screenshot({ path: 'C:/Users/Girges/.gemini/antigravity-ide/brain/bc876e0c-13f2-4a69-9f5d-582f04109c18/scrolled_menu_fixed_working.png' });

    await browser.close();
})();
