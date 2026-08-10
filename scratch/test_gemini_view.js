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

    // Navigate to Gemini page via showPage
    await page.evaluate(() => {
        if (typeof showPage === 'function') showPage('gemini');
    });
    await page.waitForTimeout(300);

    // Trigger showLoadingUI
    await page.evaluate(() => {
        const loadingBox = document.getElementById('gemini-loading-box');
        const uploadBox = document.getElementById('gemini-upload-box');
        if (uploadBox) uploadBox.style.display = 'none';
        if (loadingBox) {
            loadingBox.style.display = 'flex';
        }
        
        const fileNameEl = document.getElementById('gemini-loader-filename');
        if (fileNameEl) fileNameEl.textContent = 'sample_photo.png (2.4 MB)';

        const progressFill = document.getElementById('gemini-loader-progress-fill');
        if (progressFill) progressFill.style.width = '65%';

        window.scrollTo(0, 220);
    });
    await page.waitForTimeout(200);

    await page.screenshot({ path: 'C:/Users/Girges/.gemini/antigravity-ide/brain/bc876e0c-13f2-4a69-9f5d-582f04109c18/gemini_loading_card_perfect.png' });

    console.log("Perfect loading card screenshot captured!");
    await browser.close();
})();
