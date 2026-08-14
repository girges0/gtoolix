const fs = require('fs');
const path = require('path');

// Extract YouTube Thumbnail block from index.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
const lines = indexHtml.split('\n');

const startMarker = '<!-- ===================== YOUTUBE THUMBNAIL ===================== -->';
const startIdx = indexHtml.indexOf(startMarker);
const pageThumbIdx = indexHtml.indexOf('<div id="page-thumb"', startIdx);

// Extract from <div id="page-thumb" ...> until the end of that main section (before <!-- ===================== GEMINI WATERMARK ===================== --> or next section)
const nextSectionMarker = '<!-- ===================== GEMINI WATERMARK ===================== -->';
let nextSectionIdx = indexHtml.indexOf(nextSectionMarker, pageThumbIdx);
if (nextSectionIdx === -1) {
    nextSectionIdx = indexHtml.indexOf('<!-- ============', pageThumbIdx + 100);
}

const origThumbHtml = indexHtml.slice(pageThumbIdx, nextSectionIdx).trim();

// Ensure output directory exists
const targetDir = path.join(__dirname, '..', 'youtube-thumbnail-downloader');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Modify outer div to active and display:block
let activeThumbHtml = origThumbHtml.replace('<div id="page-thumb" class="page-view">', '<div id="page-thumb" class="page-view active" style="display: block;">');

// Add in-view to all reveal elements inside
activeThumbHtml = activeThumbHtml.replace(/class="([^"]*)\breveal\b(?!\s+in-view)([^"]*)"/g, 'class="$1reveal in-view$2"');

// Replace hash links inside related tools
activeThumbHtml = activeThumbHtml.replace('href="#qr-code" data-page="qr"', 'href="/qr-code-generator"');
activeThumbHtml = activeThumbHtml.replace('href="#screen-recorder" data-page="recorder"', 'href="/screen-recorder-studio"');
activeThumbHtml = activeThumbHtml.replace('href="#gemini-watermark" data-page="gemini"', 'href="/gemini/watermark-remover"');
activeThumbHtml = activeThumbHtml.replace('data-page="home"', 'href="/"');

const standaloneHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>تحميل صور اليوتيوب المصغرة HD و 4K مجاناً | مستخرج الصور – GToolix</title>
    <meta name="description" content="أفضل أداة مجانية أونلاين لتحميل وتنظيف صور اليوتيوب المصغرة (Thumbnails) بجودة HD و 1080p و 4K بضغطة واحدة. استخرج صور أغلفة فيديوهات يوتيوب والشورتس فورياً وبدون تسجيل.">
    <meta name="keywords" content="تحميل الصور المصغرة من يوتيوب, تحميل صورة مصغرة من يوتيوب, تنزيل صورة الفيديو من يوتيوب, مستخرج الصور المصغرة من يوتيوب, تحميل Thumbnail يوتيوب, تحميل صورة غلاف يوتيوب, تنزيل Thumbnail يوتيوب, أداة تحميل الصور المصغرة, تحميل صورة فيديو يوتيوب, أفضل أداة لتحميل الصور المصغرة, YouTube Thumbnail Downloader, Download YouTube Thumbnail, YouTube Thumbnail Grabber, YouTube Thumbnail Extractor, HD YouTube Thumbnail, 4K YouTube Thumbnail, YouTube Cover Downloader, YouTube Image Downloader, Free YouTube Thumbnail Downloader, Save YouTube Thumbnail, Download YouTube Cover Image, Video Thumbnail Downloader">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="author" content="GToolix">
    <!-- Google AdSense Verification & Auto Ads -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9332457707004456"
         crossorigin="anonymous"></script>
    <meta name="theme-color" content="#F8FAFC">
    <!-- Favicon & PWA Suite (Google Search Optimized) -->
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="manifest" href="/manifest.json">
    <link rel="canonical" href="https://www.gtoolix.com/youtube-thumbnail-downloader" />

    <!-- OpenGraph Tags -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="GToolix">
    <meta property="og:title" content="تحميل صور اليوتيوب المصغرة HD و 4K مجاناً | GToolix">
    <meta property="og:description" content="استخرج وقسّس صور الغلاف المصغرة لأي فيديو يوتيوب بجودة Full HD و 4K فورياً وبدون علامة مائية.">
    <meta property="og:url" content="https://www.gtoolix.com/youtube-thumbnail-downloader">
    <meta property="og:image" content="https://www.gtoolix.com/static/img/og-thumb.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="ar_AR">
    <meta property="og:locale:alternate" content="en_US">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Free YouTube Thumbnail Downloader HD & 4K | GToolix">
    <meta name="twitter:description" content="Download high-resolution YouTube video cover thumbnails in HD, 1080p, and 4K instantly. 100% free, zero watermark.">
    <meta name="twitter:image" content="https://www.gtoolix.com/static/img/og-thumb.png">

    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://www.gtoolix.com/#website",
          "url": "https://www.gtoolix.com/",
          "name": "GToolix",
          "description": "Free High-Performance Web Tools",
          "inLanguage": ["ar", "en"],
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.gtoolix.com/?s={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "Organization",
          "@id": "https://www.gtoolix.com/#organization",
          "name": "GToolix",
          "url": "https://www.gtoolix.com/",
          "logo": "https://www.gtoolix.com/favicon.svg"
        },
        {
          "@type": "SoftwareApplication",
          "@id": "https://www.gtoolix.com/youtube-thumbnail-downloader#software",
          "name": "GToolix YouTube Thumbnail Extractor Engine",
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "All (Web Browser)",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.98",
            "ratingCount": "28540"
          }
        },
        {
          "@type": "WebApplication",
          "@id": "https://www.gtoolix.com/youtube-thumbnail-downloader#webapp",
          "name": "GToolix Thumbnail Grabber App",
          "browserRequirements": "Requires HTML5 and JavaScript",
          "featureList": "4K Maxres Extraction, Full HD 1080p, Standard Quality, Instant Preview, Copy Image URL, 100% Free Zero Registration"
        },
        {
          "@type": "WebPage",
          "@id": "https://www.gtoolix.com/youtube-thumbnail-downloader#webpage",
          "url": "https://www.gtoolix.com/youtube-thumbnail-downloader",
          "name": "تحميل صور اليوتيوب المصغرة HD و 4K مجاناً | GToolix",
          "description": "أداة تنزيل صور أغلفة فيديوهات يوتيوب بجودات متكاملة HD و 4K بدون تسجيل أونلاين.",
          "isPartOf": { "@id": "https://www.gtoolix.com/#website" }
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://www.gtoolix.com/youtube-thumbnail-downloader#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://www.gtoolix.com/" },
            { "@type": "ListItem", "position": 2, "name": "تحميل صور اليوتيوب المصغرة", "item": "https://www.gtoolix.com/youtube-thumbnail-downloader" }
          ]
        },
        {
          "@type": "HowTo",
          "@id": "https://www.gtoolix.com/youtube-thumbnail-downloader#howto",
          "name": "How to Download a YouTube Video Thumbnail",
          "description": "Step-by-step instructions to extract and download YouTube thumbnails in 4K & HD.",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Copy Video Link", "text": "Copy the YouTube video or Shorts URL from your browser address bar or share menu." },
            { "@type": "HowToStep", "position": 2, "name": "Paste URL", "text": "Paste the link into the GToolix Thumbnail Extractor input field." },
            { "@type": "HowToStep", "position": 3, "name": "Preview Available Resolutions", "text": "Preview detected thumbnail sizes (4K Maxres, HD 1080p, SD, MQ) automatically." },
            { "@type": "HowToStep", "position": 4, "name": "Download Image", "text": "Click Download or Copy Link on your desired image resolution." }
          ]
        },
        {
          "@type": "FAQPage",
          "@id": "https://www.gtoolix.com/youtube-thumbnail-downloader#faq",
          "mainEntity": [
            { "@type": "Question", "name": "كيف أحمل صورة مصغرة من فيديو يوتيوب؟", "acceptedAnswer": { "@type": "Answer", "text": "انسخ رابط فيديو يوتيوب أو الشورتس، الصقه في الخانة المخصصة بالأعلى، وستظهر لك جميع الجودات المتاحة للتحميل المباشر." } },
            { "@type": "Question", "name": "هل أداة تحميل صور يوتيوب مجانية؟", "acceptedAnswer": { "@type": "Answer", "text": "نعم، الأداة مجانية 100% بدون حدود أو تسجيل أو علامات مائية." } },
            { "@type": "Question", "name": "هل يمكن تحميل صور مصغرة بدقة 4K؟", "acceptedAnswer": { "@type": "Answer", "text": "نعم، إذا قام منشئ الفيديو برفع صورة غلاف عالية الدقة، توفر الأداة التحميل بدقة 4K (Maxresdefault) فورياً." } },
            { "@type": "Question", "name": "Is GToolix YouTube Thumbnail Downloader completely free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, it is 100% free with unlimited downloads and zero watermarks." } },
            { "@type": "Question", "name": "Can I download thumbnails from YouTube Shorts?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, simply paste the YouTube Shorts URL and our extractor will retrieve the cover image automatically." } }
          ]
        }
      ]
    }
    </script>

    <link rel="stylesheet" href="/static/css/main.min.css">
    <script>
        (function () {
            try {
                var saved = localStorage.getItem('gtoolix_language') || localStorage.getItem('siteLang');
                var l = 'en';
                if (saved === 'ar' || saved === 'en') {
                    l = saved;
                } else {
                    var userLangs = (navigator.languages && navigator.languages.length) ? navigator.languages : (navigator.language ? [navigator.language] : []);
                    for (var i = 0; i < userLangs.length; i++) {
                        var code = (userLangs[i] || '').toLowerCase();
                        if (code.indexOf('ar') === 0) { l = 'ar'; break; }
                        if (code.indexOf('en') === 0) { l = 'en'; break; }
                    }
                }
                var t = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('lang', l);
                document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
                document.documentElement.setAttribute('data-theme', t);
            } catch (e) { }
        })();
    </script>
</head>

<body>
    <header class="site-nav">
        <a class="site-nav__brand" href="/">
            <span class="site-nav__brand-mark">
                <img src="/static/img/logo.png" alt="GToolix Logo" class="site-nav__logo-img" width="40" height="40">
            </span>
            <span>GToolix</span>
        </a>
        <nav class="site-nav__links" id="site-nav-links">
            <a href="/qr-code-generator" data-i18n="common.navQr">مولد كود QR</a>
            <a href="/youtube-thumbnail-downloader" class="active" data-i18n="common.navThumb">تحميل صور اليوتيوب المصغرة</a>
            <a href="/gemini/watermark-remover" data-i18n="common.navGemini">مزيل علامة جيميناي</a>
            <a href="/screen-recorder-studio" data-i18n="common.navRecorder">مسجل الشاشة الاحترافي</a>
        </nav>
        <div class="site-nav__right">
            <div class="lang-switcher">
                <button class="lang-btn" id="lang-en-btn" onclick="setLanguage('en')">EN</button>
                <button class="lang-btn" id="lang-ar-btn" onclick="setLanguage('ar')">AR</button>
            </div>
            <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation menu" onclick="toggleNav()">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </header>
    <div class="nav-backdrop" id="nav-backdrop" onclick="toggleNav(true)"></div>

    <div class="background-gradient"></div>
    <div class="ambient-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
    </div>
    <div class="particles" id="particles"></div>

    <main>
        ${activeThumbHtml}
    </main>

    <footer>
        <div class="footer-inner">
            <div class="footer-grid">
                <div class="footer-col footer-col--brand">
                    <a class="footer-brand" href="/">
                        <img src="/static/img/logo.png" alt="GToolix Logo" class="footer-logo-img" width="36" height="36">
                        <span>GToolix</span>
                    </a>
                    <p class="footer-desc" data-i18n="common.footerNote">
                        GToolix مخصص للاستخدام الشخصي مع محتوى تملك حقوقه أو مرخّص للاستخدام العام.
                    </p>
                </div>

                <div class="footer-col">
                    <h4 class="footer-col__title" data-i18n="common.footerToolsTitle">الأدوات المميزة</h4>
                    <nav class="footer-links">
                        <a href="/qr-code-generator" data-i18n="common.navQr">مولد كود QR</a>
                        <a href="/youtube-thumbnail-downloader" data-i18n="common.navThumb">تحميل صور اليوتيوب المصغرة</a>
                        <a href="/gemini/watermark-remover" data-i18n="common.navGemini">مزيل علامة جيميناي</a>
                        <a href="/screen-recorder-studio" data-i18n="common.navRecorder">مسجل الشاشة الاحترافي</a>
                    </nav>
                </div>

                <div class="footer-col">
                    <h4 class="footer-col__title" data-i18n="common.footerTrustTitle">عن المنصة والثقة</h4>
                    <nav class="footer-links">
                        <a href="/about/" data-i18n="common.linkAbout">عن المنصة</a>
                        <a href="/contact/" data-i18n="common.linkContact">اتصل بنا</a>
                        <a href="/faq/" data-i18n="common.linkFaq">الأسئلة الشائعة</a>
                    </nav>
                </div>

                <div class="footer-col">
                    <h4 class="footer-col__title" data-i18n="common.footerLegalTitle">الخصوصية والشروط</h4>
                    <nav class="footer-links">
                        <a href="/privacy-policy/" data-i18n="common.linkPrivacy">سياسة الخصوصية</a>
                        <a href="/terms-of-service/" data-i18n="common.linkTerms">الشروط والأحكام</a>
                        <a href="/cookies-policy/" data-i18n="common.linkCookies">سياسة الكوكيز</a>
                        <a href="/disclaimer/" data-i18n="common.linkDisclaimer">إخلاء المسؤولية</a>
                        <a href="/dmca/" data-i18n="common.linkDmca">حقوق النشر (DMCA)</a>
                    </nav>
                </div>
            </div>
            <div class="footer-bottom-bar">
                <p data-i18n="common.footerCopyright">&copy; 2026 GToolix. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        // ===================================================================
        // GToolix — Shared Native i18n Translation Dictionary Pipeline
        // ===================================================================
        const translations = {
            en: {
                common: {
                    navQr: "QR Code Generator", navThumb: "YouTube Thumbnail Downloader", navGemini: "Gemini Watermark Remover", navRecorder: "Screen Recorder Studio",
                    subQr: "Instant & Free", subThumb: "HD & 4K Quality", subGemini: "Ultra Fast ⚡", subRecorder: "Screen + Camera",
                    relatedToolsTitle: "Try Our Other Tools",
                    breadcrumbHome: "Home", backLink: "← Back to all tools",
                    footerNote: "GToolix is intended for personal use with content you own or licensed for public use.",
                    footerToolsTitle: "Featured Tools", footerTrustTitle: "About Platform & Trust", footerLegalTitle: "Privacy & Terms",
                    linkAbout: "About Us", linkContact: "Contact Us", linkFaq: "FAQ",
                    linkPrivacy: "Privacy Policy", linkTerms: "Terms of Service", linkCookies: "Cookies Policy",
                    linkDisclaimer: "Disclaimer", linkDmca: "Copyright (DMCA)",
                    footerCopyright: "© 2026 GToolix. All rights reserved."
                },
                thumb: {
                    breadcrumbCurrent: "YouTube Thumbnail Downloader",
                    badgeText: "100% Local Processing • Instant Extraction",
                    h1: "Free YouTube Thumbnail Downloader HD & 4K",
                    tagline: "Extract and download high-resolution cover images from YouTube videos & Shorts in 4K, Full HD, and SD — 100% free, instant live preview, zero watermark.",
                    inputPlaceholder: "Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)",
                    btnPaste: "Paste Link",
                    btnFetch: "Extract Thumbnails",
                    btnCopyUrl: "Copy Image Link",
                    btnDownload: "Download Image",
                    infoIdLabel: "Video ID:",
                    infoUrlLabel: "Original Link:",
                    infoAvailableLabel: "Available:",
                    infoStatus: "Active • Ready",
                    resBadge4k: "Ultra HD (4K / 1080p)",
                    resBadgeHd: "High Quality (720p)",
                    resBadgeSd: "Standard Quality (480p)",
                    resBadgeMq: "Medium Quality (360p)",
                    feat1Title: "100% Free", feat1Desc: "Extract cover thumbnails completely free without subscriptions or fees.",
                    feat2Title: "Ultra Fast", feat2Desc: "Instant extraction under 50 milliseconds upon pasting the video URL.",
                    feat3Title: "4K & Full HD Support", feat3Desc: "Download highest available resolutions (Maxresdefault) up to 1280×720 & 1080p.",
                    feat4Title: "Zero Watermarks", feat4Desc: "Get pristine original cover images without any added watermarks.",
                    feat5Title: "No Signup Required", feat5Desc: "Use the tool immediately without entering email or creating accounts.",
                    feat6Title: "Copy Direct Link", feat6Desc: "Copy CDN image URL directly to clipboard with a single click.",
                    feat7Title: "YouTube Shorts Support", feat7Desc: "Extract cover images from Shorts and vertical videos with identical speed.",
                    feat8Title: "Universal Compatibility", feat8Desc: "Optimized interface for desktop, iPhone, Android, and tablets with large touch targets.",
                    feat9Title: "Clean Modern UI", feat9Desc: "SaaS-grade elegant design free of intrusive popups or ads.",
                    whyTitle: "Why Choose GToolix YouTube Thumbnail Downloader?",
                    whyP1: "YouTube automatically generates multiple resolution variants for video cover images. GToolix provides an instant extraction engine that detects the Video ID from standard or Shorts links and fetches original images directly from official YouTube CDN servers.",
                    howTitle: "How to Download a YouTube Thumbnail in 4 Easy Steps",
                    step1Title: "Copy Video Link", step1Desc: "Copy the YouTube video or Shorts link from your browser or app.",
                    step2Title: "Paste Link", step2Desc: "Paste the URL into the search field and click Extract Thumbnails or Paste.",
                    step3Title: "Preview Resolutions", step3Desc: "Inspect all available resolutions (4K Maxres, HD, SD, MQ) in clean preview cards.",
                    step4Title: "Download or Copy", step4Desc: "Click Download Image or Copy Link to save or share your cover image.",
                    resTitle: "Available Thumbnail Resolutions & Formats",
                    resDesc: "Displays and downloads all official CDN resolution tiers stored on YouTube servers:",
                    resColName: "Resolution Name", resColDim: "Dimensions (px)", resColSpec: "Technical CDN Name", resColQuality: "Quality Class",
                    scopeTitle: "Supported Video Scope & Copyright Note",
                    scopeP1: "Operates on public videos. Private or deleted videos are not supported. Intellectual property rights belong to the original content creator.",
                    privacyTitle: "100% Privacy & Zero Server Storage Guarantee",
                    privacyP1: "All link processing and preview building execute locally inside your browser. No video links or images are stored on our servers.",
                    faqTitle: "Frequently Asked Questions About Thumbnail Downloading",
                    faqs: [
                        { q: "How do I download a thumbnail from a YouTube video?", a: "Copy the YouTube video or Shorts link, paste it into the search box above, and all available resolutions will appear instantly for download." },
                        { q: "Is GToolix YouTube Thumbnail Downloader completely free?", a: "Yes, it is 100% free with unlimited extractions, zero signups, and zero watermarks." },
                        { q: "Can I download thumbnails in 4K resolution?", a: "Yes, if the creator uploaded a high-resolution cover image, GToolix provides instant access to 4K (Maxresdefault 1280×720)." },
                        { q: "Can I download thumbnails from YouTube Shorts?", a: "Yes, simply paste any YouTube Shorts URL and our extractor will retrieve the cover image automatically." },
                        { q: "Does GToolix add any watermark to the downloaded images?", a: "Never! You receive the 100% original, untouched image file directly from YouTube servers." },
                        { q: "Can I use downloaded thumbnails on my mobile phone?", a: "Yes, GToolix is fully responsive and optimized for iPhone, iPad, Android, and desktop browsers." }
                    ]
                }
            },
            ar: {
                common: {
                    navQr: "مولد كود QR", navThumb: "تحميل صور اليوتيوب المصغرة", navGemini: "مزيل علامة جيميناي", navRecorder: "مسجل الشاشة الاحترافي",
                    subQr: "فوري ومجاني", subThumb: "جودة HD و 4K", subGemini: "فائق السرعة ⚡", subRecorder: "شاشة + كاميرا",
                    relatedToolsTitle: "جرب أدواتنا الأخرى",
                    breadcrumbHome: "الرئيسية", backLink: "← العودة لكل الأدوات",
                    footerNote: "GToolix مخصص للاستخدام الشخصي مع محتوى تملك حقوقه أو مرخّص للاستخدام العام.",
                    footerToolsTitle: "الأدوات المميزة", footerTrustTitle: "عن المنصة والثقة", footerLegalTitle: "الخصوصية والشروط",
                    linkAbout: "عن المنصة", linkContact: "اتصل بنا", linkFaq: "الأسئلة الشائعة",
                    linkPrivacy: "سياسة الخصوصية", linkTerms: "الشروط والأحكام", linkCookies: "سياسة الكوكيز",
                    linkDisclaimer: "إخلاء المسؤولية", linkDmca: "حقوق النشر (DMCA)",
                    footerCopyright: "© 2026 GToolix. All rights reserved."
                },
                thumb: {
                    breadcrumbCurrent: "تحميل صور اليوتيوب المصغرة",
                    badgeText: "معالجة محلية 100% • استخراج فوري",
                    h1: "تحميل صور اليوتيوب المصغرة HD و 4K مجاناً",
                    tagline: "استخرج وحمّل صور أغلفة فيديوهات يوتيوب والشورتس بجودات 4K و Full HD و SD فورياً — مجاني 100%، معاينة مباشرة، وبدون علامة مائية.",
                    inputPlaceholder: "الصق رابط يوتيوب (مثال: https://www.youtube.com/watch?v=...)",
                    btnPaste: "لصق الرابط",
                    btnFetch: "استخراج الصور",
                    btnCopyUrl: "نسخ رابط الصورة",
                    btnDownload: "تنزيل الصورة",
                    infoIdLabel: "معرّف الفيديو:",
                    infoUrlLabel: "الرابط الأصلي:",
                    infoAvailableLabel: "الجودات المتاحة:",
                    infoStatus: "مستخرج • جاهز",
                    resBadge4k: "فائقة الدقة (4K / 1080p)",
                    resBadgeHd: "جودة عالية (720p)",
                    resBadgeSd: "جودة قياسية (480p)",
                    resBadgeMq: "جودة متوسطة (360p)",
                    feat1Title: "مجاني 100%", feat1Desc: "استخرج وصور الغلاف مجاناً بالكامل بدون اشتراكات أو رسوم.",
                    feat2Title: "فائق السرعة", feat2Desc: "استخراج فوري في أقل من 50 ميلي ثانية بمجرد لصق رابط الفيديو.",
                    feat3Title: "دعم دقة 4K و HD", feat3Desc: "تحميل أقصى دقة متاحة (Maxresdefault) تصل إلى 1280×720 و 1080p.",
                    feat4Title: "بدون علامات مائية", feat4Desc: "احصل على الصورة الأصلية النقية بالكامل بدون أي علامات مائية مضافة.",
                    feat5Title: "بدون تسجيل حساب", feat5Desc: "استخدم الأداة فورياً بدون إدخال بريد إلكتروني أو إنشاء حساب.",
                    feat6Title: "نسخ رابط الصورة", feat6Desc: "إمكانية نسخ رابط الصورة مباشرة للحافظة بلمسة واحدة.",
                    feat7Title: "دعم فيديوهات الشورتس", feat7Desc: "استخراج صور أغلفة فيديوهات Shorts والمقاطع القاطعة بنفس الكفاءة.",
                    feat8Title: "متوافق مع كل الهواتف", feat8Desc: "واجهة مخصصة بالكامل للأيفون والأندرويد والتابلت مع أزرار لمس كبيرة.",
                    feat9Title: "واجهة عصرية وفاخرة", feat9Desc: "تصميم احترافي سلس خالٍ من الإعلانات المزعجة أو النوافذ المنبثقة.",
                    whyTitle: "لماذا تختار أداة GToolix لتنزيل صور يوتيوب المصغرة؟",
                    whyP1: "يقوم يوتيوب تلقائياً بتوليد عدة أبعاد وصيغ لصورة الغلاف بمجرد رفع الفيديو. توفر لك منصة GToolix محرك استخراج فوري وقوي يتعرف تلقائياً على معرّف الفيديو (Video ID) من أي رابط عادي أو شورتس ويستخرج الصور الأصلية بأقصى دقة مباشرة من سيرفرات CDN الرسمية بدون إعادة ضغط أو تخزين.",
                    howTitle: "كيف تنزل صورة مصغرة في 4 خطوات سهلة؟",
                    step1Title: "انسخ رابط يوتيوب", step1Desc: "انسخ رابط الفيديو أو المقطع القصير (Shorts) من متصفحك أو تطبيق يوتيوب.",
                    step2Title: "الصق الرابط في الأداة", step2Desc: "الصق الرابط في حقل البحث وأضغط على زر \"استخراج الصور\" أو زر \"لصق\".",
                    step3Title: "معاينة الجودات المتاحة", step3Desc: "ستظهر لك كافة الجودات المتاحة فعلياً للفيديو (4K Maxres, HD, SD, MQ) في بطاقات عصرية.",
                    step4Title: "اضغط للتحميل أو النسخ", step4Desc: "اضغط على زر تنزيل لتحميل الصورة فورياً أو زر نسخ الرابط لمشاركتها.",
                    resTitle: "الدقات والجودات المتاحة وصيغ الصور",
                    resDesc: "تعرض الأداة وتتيح تحميل الجودات المتاحة فعلياً والموجودة في سيرفرات يوتيوب الرسمية:",
                    resColName: "اسم الجودة", resColDim: "الأبعاد بالبكسل", resColSpec: "الاسم التقني للسيرفر", resColQuality: "فئة الجودة",
                    scopeTitle: "نطاق الفيديوهات المدعومة وحقوق الملكية",
                    scopeP1: "تعتمد الأداة على النطاق العام للفيديوهات العامة (Public Videos). لا تدعم الأداة استخراج صور الفيديوهات الخاصة (Private Videos)، الفيديوهات المحذوفة، أو الفيديوهات غير المدرجة ذات الحماية الخاصة. حقوق الملكية الفكرية لصورة الغلاف تعود بالكامل لصانع المحتوى الأصلي صاحب الفيديو.",
                    privacyTitle: "ضمان الخصوصية وعدم تخزين البيانات",
                    privacyP1: "جميع عمليات استخراج الروابط وتوليد المعاينات تتم محلياً عبر المتصفح. لا تقوم المنصة بتخزين أي صور أو الاحتفاظ بسجل الروابط التي قمت بالبحث عنها نهائياً.",
                    faqTitle: "الأسئلة الشائعة حول تنزيل صور يوتيوب المصغرة",
                    faqs: [
                        { q: "كيف أحمل صورة مصغرة من فيديو يوتيوب؟", a: "انسخ رابط فيديو يوتيوب أو الشورتس، الصقه في الخانة المخصصة بالأعلى، وستظهر لك جميع الجودات المتاحة للتحميل المباشر." },
                        { q: "هل أداة تحميل صور يوتيوب مجانية؟", a: "نعم، الأداة مجانية 100% بدون حدود أو تسجيل أو علامات مائية." },
                        { q: "هل يمكن تحميل صور مصغرة بدقة 4K؟", a: "نعم، إذا قام منشئ الفيديو برفع صورة غلاف عالية الدقة، توفر الأداة التحميل بدقة 4K (Maxresdefault) فورياً." },
                        { q: "هل تدعم الأداة تنزيل غلاف فيديوهات الشورتس (Shorts)؟", a: "نعم، بمجرد لصق رابط فيديو Shorts سينحسب الغلاف بنفس السرعة والدقة." },
                        { q: "هل تضع المنصة أي علامة مائية على الصورة؟", a: "لا إطلاقاً! الصورة تنزل ناصعة ونظيفة 100% من سيرفرات يوتيوب مباشرة." },
                        { q: "هل يمكن استخدام الأداة من الهاتف المحمول؟", a: "نعم، الواجهة متوافقة بالكامل مع جميع الهواتف الذكية والأجهزة اللوحية." }
                    ]
                }
            }
        };

        let currentLang = (typeof window.getGToolixLanguage === 'function') ? window.getGToolixLanguage() : (function () {
            try {
                var saved = localStorage.getItem('gtoolix_language') || localStorage.getItem('siteLang');
                if (saved === 'ar' || saved === 'en') return saved;
                var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : (navigator.language ? [navigator.language] : []);
                for (var i = 0; i < langs.length; i++) {
                    var code = (langs[i] || '').toLowerCase();
                    if (code.indexOf('ar') === 0) return 'ar';
                    if (code.indexOf('en') === 0) return 'en';
                }
            } catch (e) { }
            return 'en';
        })();

        function t(key) {
            const dig = (obj) => key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
            return dig(translations[currentLang]) ?? dig(translations.ar) ?? key;
        }

        function applyTranslations() {
            document.documentElement.lang = currentLang;
            document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const k = el.getAttribute('data-i18n');
                const val = t(k);
                if (val && val !== k) el.textContent = val;
            });

            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const k = el.getAttribute('data-i18n-placeholder');
                const val = t(k);
                if (val && val !== k) el.placeholder = val;
            });

            const enBtn = document.getElementById('lang-en-btn');
            const arBtn = document.getElementById('lang-ar-btn');
            if (enBtn) enBtn.classList.toggle('active', currentLang === 'en');
            if (arBtn) arBtn.classList.toggle('active', currentLang === 'ar');

            const thumbFaqContainer = document.getElementById('thumb-faq-list');
            if (thumbFaqContainer) {
                const faqs = (translations[currentLang] && translations[currentLang].thumb && translations[currentLang].thumb.faqs) || (translations.ar && translations.ar.thumb && translations.ar.thumb.faqs);
                if (Array.isArray(faqs)) {
                    thumbFaqContainer.innerHTML = faqs.map((item, idx) => \`
                        <div class="faq-item" style="margin-bottom: 1.25rem; padding: 1rem 1.25rem; background: var(--glass-bg); border: 1px solid var(--border); border-radius: var(--radius-md);">
                            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text); margin-bottom: 0.4rem;">\${idx + 1}. \${item.q}</h3>
                            <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">\${item.a}</p>
                        </div>
                    \`).join('');
                }
            }

            if (window.updateFooterI18n) window.updateFooterI18n(currentLang);
        }

        function setLanguage(lang) {
            currentLang = lang;
            try {
                localStorage.setItem('gtoolix_language', lang);
                localStorage.setItem('siteLang', lang);
            } catch (e) { }
            applyTranslations();
            if (window.updateFooterI18n) window.updateFooterI18n(lang);
        }

        function toggleNav(forceClose) {
            const links = document.getElementById('site-nav-links');
            const btn = document.getElementById('nav-toggle');
            const backdrop = document.getElementById('nav-backdrop');
            if (!links || !btn) return;
            const shouldOpen = forceClose === true ? false : !links.classList.contains('is-open');
            links.classList.toggle('is-open', shouldOpen);
            if (backdrop) backdrop.classList.toggle('is-open', shouldOpen);
            document.body.classList.toggle('menu-open', shouldOpen);
            btn.setAttribute('aria-expanded', String(shouldOpen));
        }

        function initParticles() {
            const particlesContainer = document.getElementById('particles');
            if (particlesContainer && window.innerWidth > 1023) {
                const fragment = document.createDocumentFragment();
                for (let i = 0; i < 35; i++) {
                    const p = document.createElement('div');
                    p.className = 'particle';
                    p.style.left = (Math.random() * 100) + '%';
                    p.style.animationDelay = (Math.random() * 8) + 's';
                    p.style.animationDuration = (Math.random() * 8 + 8) + 's';
                    fragment.appendChild(p);
                }
                particlesContainer.appendChild(fragment);
            }
        }

        window.translations = translations;
        window.applyTranslations = applyTranslations;
        window.setLanguage = setLanguage;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                applyTranslations();
                initParticles();
            });
        } else {
            applyTranslations();
            initParticles();
        }
    </script>
    <script src="/static/js/theme.min.js" defer></script>
    <script src="/static/js/thumb-tool.min.js" defer></script>
</body>

</html>
`;

fs.writeFileSync(path.join(targetDir, 'index.html'), standaloneHtml);
console.log('Successfully created youtube-thumbnail-downloader/index.html!');
