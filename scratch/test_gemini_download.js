const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
        browser = await chromium.launch();
    }
    const page = await browser.newPage();

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

    // Navigate to Gemini page
    await page.evaluate(() => {
        if (typeof switchPage === 'function') switchPage('gemini');
    });
    await page.waitForTimeout(300);

    const testImagePath = path.join(__dirname, 'sample_gemini.png');
    const input = await page.$('#gemini-file-input');
    if (input) {
        await input.setInputFiles(testImagePath);
    }
    await page.waitForTimeout(1000);

    // Test clicking PNG download button
    const downloadPromisePng = page.waitForEvent('download', { timeout: 3000 }).catch(() => null);
    await page.click('#gemini-btn-png');
    const downloadPng = await downloadPromisePng;

    // Test clicking WEBP download button
    const downloadPromiseWebp = page.waitForEvent('download', { timeout: 3000 }).catch(() => null);
    await page.click('#gemini-btn-webp');
    const downloadWebp = await downloadPromiseWebp;

    // Test clicking JPG download button
    const downloadPromiseJpg = page.waitForEvent('download', { timeout: 3000 }).catch(() => null);
    await page.click('#gemini-btn-jpeg');
    const downloadJpg = await downloadPromiseJpg;

    console.log("Download PNG succeeded:", !!downloadPng);
    console.log("Download WEBP succeeded:", !!downloadWebp);
    console.log("Download JPG succeeded:", !!downloadJpg);
    console.log("Console & Page Errors:", errors);

    await browser.close();
})();
