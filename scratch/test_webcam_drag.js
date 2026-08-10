const { chromium } = require('playwright');

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

    await page.goto('http://localhost:8080/screen-recorder-studio', { waitUntil: 'networkidle' });

    // Trigger onStart on webcam overlay if present
    await page.evaluate(() => {
        const overlay = document.querySelector('.webcam-preview-overlay') || document.querySelector('[id*="webcam"]');
        if (overlay) {
            const evt = new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true });
            overlay.dispatchEvent(evt);
            const moveEvt = new MouseEvent('mousemove', { clientX: 150, clientY: 150, bubbles: true });
            document.dispatchEvent(moveEvt);
            const upEvt = new MouseEvent('mouseup', { bubbles: true });
            document.dispatchEvent(upEvt);
        }
    });

    console.log("Console & Page Errors:", errors);
    await browser.close();
})();
