const fs = require('fs');
const path = require('path');

const pages = [
    {
        file: 'qr-code-generator/index.html',
        enTitle: 'Free QR Code Generator Online | Custom Barcode & QR - GToolix',
        arTitle: 'مولد كود QR مجاني أونلاين | إنشاء باركود QR بدون تسجيل – GToolix',
        enDesc: 'Free high-performance online QR Code Generator. Create custom high-resolution QR codes for URLs, Wi-Fi, vCards, SMS, and text instantly with zero watermarks.',
        arDesc: 'أفضل أداة مجانية أونلاين لإنشاء وتخصيص أكواد QR عالية الدقة بدون علامة مائية. توليد فوري لأكواد الروابط والواي فاي وبطاقات الاتصال والنصوص.'
    },
    {
        file: 'gemini/watermark-remover/index.html',
        enTitle: 'Free Gemini Watermark Remover Online | Remove Google AI Watermark - GToolix',
        arTitle: 'مزيل علامة جيميناي المائية مجاناً أونلاين | GToolix',
        enDesc: 'Remove Google Gemini AI watermark from your images instantly online. 100% free, browser-based, client-side processing, no quality loss.',
        arDesc: 'أداة مجانية أونلاين لإزالة العلامة المائية من صور جيميناي (Google Gemini AI) فورياً وبأقصى جودة وبدون تسجيل.'
    },
    {
        file: 'youtube-thumbnail-downloader/index.html',
        enTitle: 'Free YouTube Thumbnail Downloader HD & 4K | Image Extractor - GToolix',
        arTitle: 'تحميل صور اليوتيوب المصغرة HD و 4K مجاناً | مستخرج الصور – GToolix',
        enDesc: 'Free online YouTube Thumbnail Downloader. Extract high-resolution YouTube video and Shorts cover images in HD, 1080p, and 4K instantly with zero watermark.',
        arDesc: 'أفضل أداة مجانية أونلاين لتحميل وتنظيف صور اليوتيوب المصغرة (Thumbnails) بجودة HD و 1080p و 4K بضغطة واحدة. استخرج صور أغلفة فيديوهات يوتيوب والشورتس فورياً وبدون تسجيل.'
    },
    {
        file: 'screen-recorder-studio/index.html',
        enTitle: 'Free Professional Screen Recorder | Record Screen, Camera & Audio - GToolix',
        arTitle: 'مسجل الشاشة الاحترافي مجانًا | تسجيل شاشة وصوت وكاميرا بدون برنامج - GToolix',
        enDesc: 'Record screen, webcam, and audio in studio quality right from your browser — 100% private, zero upload, no signup, no watermark.',
        arDesc: 'سجّل شاشتك بجودة استوديو مباشرة من متصفحك — شاشة، كاميرا، صوت النظام والميكروفون معًا. بدون تثبيت، بدون رفع، بدون حساب. تسجيلك يفضل على جهازك فقط.'
    }
];

pages.forEach(p => {
    const filePath = path.join(__dirname, '..', p.file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Add pageTitle & pageDesc to en translation block if not present
    if (!content.includes('pageTitle: "' + p.enTitle + '"') && !content.includes("pageTitle: '" + p.enTitle + "'")) {
        content = content.replace('common: {', `common: {\n                    pageTitle: "${p.enTitle}",\n                    pageDesc: "${p.enDesc}",`);
    }

    // Ensure applyTranslations updates document.title & meta description
    if (!content.includes('document.title =')) {
        content = content.replace('document.documentElement.dir = currentLang === \'ar\' ? \'rtl\' : \'ltr\';', `document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';\n\n            const pTitle = (translations[currentLang] && translations[currentLang].common && translations[currentLang].common.pageTitle) || (currentLang === 'en' ? "${p.enTitle}" : "${p.arTitle}");\n            if (pTitle) document.title = pTitle;\n            const pDesc = (translations[currentLang] && translations[currentLang].common && translations[currentLang].common.pageDesc) || (currentLang === 'en' ? "${p.enDesc}" : "${p.arDesc}");\n            const metaDescEl = document.querySelector('meta[name="description"]');\n            if (metaDescEl && pDesc) metaDescEl.setAttribute('content', pDesc);`);
    }

    fs.writeFileSync(filePath, content);
    console.log('Successfully updated page title i18n logic in:', p.file);
});
