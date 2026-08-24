const { chromium } = require('playwright');

const routes = [
    { name: 'Home', ar: 'http://localhost:8080/', en: 'http://localhost:8080/en/' },
    { name: 'Tools Index', ar: 'http://localhost:8080/tools', en: 'http://localhost:8080/en/tools' },
    { name: 'QR Code Generator', ar: 'http://localhost:8080/tools/qr-code-generator', en: 'http://localhost:8080/en/tools/qr-code-generator' },
    { name: 'YouTube Thumbnail Downloader', ar: 'http://localhost:8080/tools/youtube-thumbnail-downloader', en: 'http://localhost:8080/en/tools/youtube-thumbnail-downloader' },
    { name: 'Screen Recorder Studio', ar: 'http://localhost:8080/tools/screen-recorder-studio', en: 'http://localhost:8080/en/tools/screen-recorder-studio' },
    { name: 'Image Compressor', ar: 'http://localhost:8080/tools/image-compressor', en: 'http://localhost:8080/en/tools/image-compressor' },
    { name: 'Blog Index', ar: 'http://localhost:8080/blog', en: 'http://localhost:8080/en/blog' },
    { name: 'Blog Article QR', ar: 'http://localhost:8080/blog/qr-code', en: 'http://localhost:8080/en/blog/qr-code' },
    { name: 'Programs Index', ar: 'http://localhost:8080/programs', en: 'http://localhost:8080/en/programs' },
    { name: 'About', ar: 'http://localhost:8080/about', en: 'http://localhost:8080/en/about' },
    { name: 'FAQ', ar: 'http://localhost:8080/faq', en: 'http://localhost:8080/en/faq' },
    { name: 'Privacy Policy', ar: 'http://localhost:8080/privacy-policy', en: 'http://localhost:8080/en/privacy-policy' },
    { name: 'Contact', ar: 'http://localhost:8080/contact', en: 'http://localhost:8080/en/contact' }
];

function hasArabic(text) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text || '');
}

async function run() {
    console.log('====================================================');
    console.log(' Starting Automated Bilingual Playwright Audit');
    console.log('====================================================\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    let totalErrors = 0;

    for (const r of routes) {
        console.log(`\n--- Testing ${r.name} ---`);

        // Test English
        await page.goto(r.en, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(150);
        const enTitle = await page.title();
        const enLang = await page.getAttribute('html', 'lang');
        const enDir = await page.getAttribute('html', 'dir');
        const enNav = await page.$$eval('.nav-item-label', els => els.map(e => e.textContent.trim()));
        const enH1 = await page.$eval('h1:visible', e => e.textContent.trim()).catch(() => '');

        console.log(`[EN] Lang=${enLang} Dir=${enDir} Title="${enTitle.substring(0, 40)}..."`);
        console.log(`[EN] Nav Items:`, enNav);
        console.log(`[EN] H1: "${enH1.substring(0, 50)}"`);

        if (enLang !== 'en' || enDir !== 'ltr') {
            console.error(`❌ [EN ERROR] Expected lang="en" dir="ltr", got lang="${enLang}" dir="${enDir}"`);
            totalErrors++;
        }
        if (enNav.some(hasArabic)) {
            console.error(`❌ [EN ERROR] Arabic text found in English navbar:`, enNav);
            totalErrors++;
        }
        if (hasArabic(enH1)) {
            console.error(`❌ [EN ERROR] Arabic text found in English H1: "${enH1}"`);
            totalErrors++;
        }

        // Test Arabic
        await page.goto(r.ar, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(150);
        const arTitle = await page.title();
        const arLang = await page.getAttribute('html', 'lang');
        const arDir = await page.getAttribute('html', 'dir');
        const arNav = await page.$$eval('.nav-item-label', els => els.map(e => e.textContent.trim()));
        const arH1 = await page.$eval('h1:visible', e => e.textContent.trim()).catch(() => '');

        console.log(`[AR] Lang=${arLang} Dir=${arDir} Title="${arTitle.substring(0, 40)}..."`);
        console.log(`[AR] Nav Items:`, arNav);
        console.log(`[AR] H1: "${arH1.substring(0, 50)}"`);

        if (arLang !== 'ar' || arDir !== 'rtl') {
            console.error(`❌ [AR ERROR] Expected lang="ar" dir="rtl", got lang="${arLang}" dir="${arDir}"`);
            totalErrors++;
        }
        if (arNav.some(item => !hasArabic(item))) {
            console.error(`❌ [AR ERROR] Non-Arabic text found in Arabic navbar:`, arNav);
            totalErrors++;
        }
    }

    await browser.close();

    console.log('\n====================================================');
    if (totalErrors === 0) {
        console.log('✅ ALL PAGES PASSED BILINGUAL VERIFICATION WITH 0 ERRORS!');
    } else {
        console.log(`❌ FAILED: ${totalErrors} errors detected.`);
    }
    console.log('====================================================');
}

run().catch(err => {
    console.error('Fatal error running audit:', err);
    process.exit(1);
});
