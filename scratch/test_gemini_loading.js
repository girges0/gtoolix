const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 800 });

    const testImagePath = path.join(__dirname, 'sample_gemini.png');

    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

    // Navigate to Gemini page in SPA
    await page.evaluate(() => {
        if (typeof switchPage === 'function') switchPage('gemini');
    });
    await page.waitForTimeout(300);

    // Set file input
    const input = await page.$('#gemini-file-input');
    if (input) {
        await input.setInputFiles(testImagePath);
    }

    // Capture loading state screenshot
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'C:/Users/Girges/.gemini/antigravity-ide/brain/bc876e0c-13f2-4a69-9f5d-582f04109c18/gemini_loading_overlay.png' });

    // Wait for processing to complete and capture workspace
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/Girges/.gemini/antigravity-ide/brain/bc876e0c-13f2-4a69-9f5d-582f04109c18/gemini_workspace_loaded.png' });

    console.log("Loading & Workspace screenshots captured!");
    await browser.close();
})();
