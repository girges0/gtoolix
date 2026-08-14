const fs = require('fs');
const path = require('path');

// Extract Screen Recorder block from index.html (before we deleted it from index.html)
const indexHtml = fs.readFileSync('index.html', 'utf8');

const startMarker = '<!-- ===================== SCREEN RECORDER STUDIO ===================== -->';
const startIdx = indexHtml.indexOf(startMarker);
const pageRecIdx = indexHtml.indexOf('<div id="page-recorder"', startIdx);

// Extract from <div id="page-recorder" ...> until </div></div> before <footer> or next section
const endMarker = '<footer>';
let nextSectionIdx = indexHtml.indexOf(endMarker, pageRecIdx);

const origRecHtml = indexHtml.slice(pageRecIdx, nextSectionIdx).trim();

// Ensure output directory exists
const targetDir = path.join(__dirname, '..', 'screen-recorder-studio');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Modify outer div to active and display:block
let activeRecHtml = origRecHtml.replace('<div id="page-recorder" class="page-view">', '<div id="page-recorder" class="page-view active" style="display: block;">');

// Add in-view to all reveal elements inside
activeRecHtml = activeRecHtml.replace(/class="([^"]*)\breveal\b(?!\s+in-view)([^"]*)"/g, 'class="$1reveal in-view$2"');

// Replace hash links inside related tools
activeRecHtml = activeRecHtml.replace('href="#qr-code" data-page="qr"', 'href="/qr-code-generator"');
activeRecHtml = activeRecHtml.replace('href="#youtube-thumbnail" data-page="thumb"', 'href="/youtube-thumbnail-downloader"');
activeRecHtml = activeRecHtml.replace('href="#gemini-watermark" data-page="gemini"', 'href="/gemini/watermark-remover"');
activeRecHtml = activeRecHtml.replace('data-page="home"', 'href="/"');

const standaloneHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>مسجل الشاشة الاحترافي مجانًا | تسجيل شاشة وصوت وكاميرا بدون برنامج - GToolix</title>
    <meta name="description" content="سجّل شاشتك بجودة استوديو مباشرة من متصفحك — شاشة، كاميرا، صوت النظام والميكروفون معًا. بدون تثبيت، بدون رفع، بدون حساب. تسجيلك يفضل على جهازك فقط.">
    <meta name="keywords" content="مسجل شاشة احترافي, تسجيل شاشة بجودة عالية مجانًا, مسجل شاشة وكاميرا وصوت معًا, تسجيل شاشة بدون برنامج, استوديو تسجيل شاشة اونلاين, مسجل شاشة بدون علامة مائية, افضل مسجل شاشة للمحاضرات اونلاين, تسجيل شرح فيديو بالصوت والكاميرا مجانا, مسجل شاشة للمعلمين وصناع المحتوى, تسجيل اجتماع اونلاين من المتصفح مباشرة, مسجل شاشة يحفظ الفيديو على جهازي فقط, professional screen recorder online, free screen and webcam recorder, record screen with system audio free, studio quality screen recorder browser, screen recorder no watermark free">
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
    <link rel="canonical" href="https://www.gtoolix.com/screen-recorder-studio" />

    <!-- OpenGraph Tags -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="GToolix">
    <meta property="og:title" content="Free Professional Screen Recorder | Record Screen, Camera & Audio">
    <meta property="og:description" content="Studio-quality screen recording, right in your browser — screen, camera, system audio and mic together. No install, no upload, no account. Stays on your device.">
    <meta property="og:url" content="https://www.gtoolix.com/screen-recorder-studio">
    <meta property="og:image" content="https://www.gtoolix.com/static/img/og-screen-recorder-studio.jpg">
    <meta property="og:locale" content="ar_EG">
    <meta property="og:locale:alternate" content="en_US">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Free Professional Screen Recorder | Record Screen, Camera & Audio">
    <meta name="twitter:description" content="Studio-quality screen recording, right in your browser — screen, camera, system audio and mic together. No install, no upload, no account. Stays on your device.">
    <meta name="twitter:image" content="https://www.gtoolix.com/static/img/og-screen-recorder-studio.jpg">

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
          "inLanguage": ["ar", "en"]
        },
        {
          "@type": "SoftwareApplication",
          "@id": "https://www.gtoolix.com/screen-recorder-studio#software",
          "name": "Professional Screen Recorder",
          "alternateName": "مسجل الشاشة الاحترافي",
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Any (Web Browser)",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "description": "Free browser-based tool to record screen, camera, and audio simultaneously in high quality, with 100% local privacy and no upload.",
          "url": "https://www.gtoolix.com/screen-recorder-studio",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "1420",
            "bestRating": "5",
            "worstRating": "1"
          }
        },
        {
          "@type": "WebApplication",
          "@id": "https://www.gtoolix.com/screen-recorder-studio#webapp",
          "name": "Professional Screen Recorder Studio",
          "browserRequirements": "Requires HTML5 Canvas, getDisplayMedia, MediaRecorder, and Web Audio API",
          "featureList": "Screen Recording, Webcam PIP Overlay, Audio Mixer, 60 FPS, 100% Client-Side Privacy, No Watermarks"
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://www.gtoolix.com/screen-recorder-studio#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://www.gtoolix.com/" },
            { "@type": "ListItem", "position": 2, "name": "مسجل الشاشة الاحترافي", "item": "https://www.gtoolix.com/screen-recorder-studio" }
          ]
        },
        {
          "@type": "FAQPage",
          "@id": "https://www.gtoolix.com/screen-recorder-studio#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is my recording uploaded to any server? / هل التسجيل بيترفع على أي سيرفر؟",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No, recording happens entirely inside your browser — nothing is ever uploaded or stored externally."
              }
            },
            {
              "@type": "Question",
              "name": "Can I record screen, camera, and system audio together?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, all sources can be enabled simultaneously, each independently controllable."
              }
            },
            {
              "@type": "Question",
              "name": "Does the exported video have a watermark?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No, the final video is completely clean, with no watermark or logo."
              }
            }
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
            <a href="/youtube-thumbnail-downloader" data-i18n="common.navThumb">تحميل صور اليوتيوب المصغرة</a>
            <a href="/gemini/watermark-remover" data-i18n="common.navGemini">مزيل علامة جيميناي</a>
            <a href="/screen-recorder-studio" class="active" data-i18n="common.navRecorder">مسجل الشاشة الاحترافي</a>
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
        ${activeRecHtml}
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
                rec: {
                    breadcrumbCurrent: "Screen Recorder Studio",
                    privacyBadge: "Your recording stays on your device • 100% Client-Side Privacy",
                    h1: "Screen Recorder Studio",
                    tagline: "Record screen, webcam, and audio in high quality right from your browser — 100% private, zero upload, no signup.",
                    noticeBrowserText: "Your browser does not support full MediaRecorder capture. Please use desktop Google Chrome, Microsoft Edge, or Brave for best results.",
                    tabDevices: "Devices & Quality", tabDesign: "Webcam Design", tabOptions: "Timer & Audio",
                    grpSources: "Capture Sources", lblRecMode: "🎬 Recording Mode",
                    modeScreenCam: "🖥️+📷 Screen + Camera Overlay", modeScreenOnly: "🖥️ Screen Only", modeCamOnly: "📷 Camera Only",
                    btnPickScreen: "Select / Pick Recording Screen",
                    mobileTip: "On mobile, your browser will prompt for permission to select screen or app. If direct screen capture is unsupported, camera mode will be used automatically.",
                    lblWebcam: "Enable Webcam", lblMic: "Enable Microphone", lblSysAudio: "System / Tab Audio",
                    grpDevices: "Devices & Quality", lblCameraDev: "Camera Device", lblMicDev: "Microphone Device",
                    lblQuality: "Output Quality", optHigh: "High (4K / 1080p)", optMedium: "Medium (720p)", optLow: "Low (480p)",
                    lblFps: "Frame Rate",
                    grpOverlay: "Webcam Overlay Design",
                    dragTip: "You can drag and move the camera overlay anywhere on the screen using mouse or touch.",
                    lblCamSize: "Camera Size", lblCamShape: "Camera Shape", shapeRounded: "Rounded Box", shapeCircle: "Circle", shapeRect: "Rectangle",
                    lblCamBorder: "Camera Border", optGlow: "Glow Border",
                    grpTiming: "Options & Audio Level", lblCountdown: "3-Second Countdown", lblMicMeter: "Microphone Activity Level",
                    previewTitle: "Live Stage & Webcam Preview", btnExpand: "Fullscreen", btnExitFullscreen: "Exit Fullscreen",
                    emptyTitle: "Ready to Record", emptyDesc: "Configure camera and audio settings on the left, then click Start Recording.",
                    btnStart: "Start Recording", btnPause: "Pause", btnResume: "Resume", btnStop: "Stop Recording", btnReset: "Reset",
                    finalTitle: "🎉 Recording Ready! Preview & Download", btnClose: "Close & Discard",
                    lblDuration: "Duration", lblFormat: "Format", lblSize: "File Size", lblResolution: "Resolution",
                    btnDownload: "Download Video", btnRecordAgain: "Record Again", getReady: "Get Ready...",
                    feat1Title: "100% Local & Private", feat1Desc: "Your video stream never leaves your computer. Canvas rendering and MediaRecorder execute 100% client-side.",
                    feat2Title: "Webcam Picture-in-Picture", feat2Desc: "Overlay your webcam feed live on screen recordings with custom position, size, margin, and shape options.",
                    feat3Title: "Multi-Channel Audio Mixer", feat3Desc: "Seamlessly mix microphone narration with system or tab audio using Web Audio API nodes.",
                    feat4Title: "High Quality & 60 FPS", feat4Desc: "Record crisp screen captures up to 60 FPS and high bitrates supported by hardware acceleration.",
                    feat5Title: "Free Without Watermarks", feat5Desc: "Unlimited recording length and zero forced watermarks, logos, or forced user registrations.",
                    feat6Title: "Zero Software Installs", feat6Desc: "Runs instantly in standard web browsers without needing Chrome extensions or desktop apps.",
                    whyTitle: "Why Choose GToolix Screen Recorder Studio?",
                    whyP1: "Traditional screen recording software requires heavy desktop installs, paid monthly subscriptions, or uploads your screen captures to remote servers with strict limits. GToolix Screen Recorder Studio provides a 100% browser-native studio experience. Capture tutorials, demos, presentations, and gaming sessions with zero server latency and absolute privacy.",
                    howTitle: "How to Record Screen & Webcam in 4 Easy Steps",
                    step1Title: "Configure Sources & Devices", step1Desc: "Choose webcam, microphone, camera position, shape, and audio settings in the left control panel.",
                    step2Title: "Click Start & Select Screen", step2Desc: "Click Start Recording and choose whether to capture your full monitor, application window, or browser tab.",
                    step3Title: "Record & Control", step3Desc: "Use Pause/Resume controls or live audio activity indicators while recording your presentation.",
                    step4Title: "Preview & Save", step4Desc: "Stop recording to preview your video immediately and download the high-quality WebM/MP4 file.",
                    faqTitle: "Frequently Asked Questions (FAQ)",
                    faqs: [
                        { q: "Is my recording uploaded to any server?", a: "No, recording happens entirely inside your browser — nothing is ever uploaded or stored externally." },
                        { q: "Can I record screen, camera, and system audio together?", a: "Yes, all sources can be enabled simultaneously, each independently controllable." },
                        { q: "Is there a maximum recording length limit?", a: "There is no artificial limit — duration depends only on your device capability and available storage." },
                        { q: "Does the exported video have a watermark?", a: "No, the final video is completely clean, with zero watermark or logo." },
                        { q: "Do I need to install software or create an account?", a: "No, the tool runs directly inside your web browser with no installation or sign-up required." }
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
                rec: {
                    breadcrumbCurrent: "مسجل الشاشة الاحترافي",
                    privacyBadge: "تسجيلك يحفظ محلياً على جهازك فقط • خصوصية كاملة 100%",
                    h1: "مسجل الشاشة الاحترافي",
                    tagline: "سجّل شاشتك والكاميرا والصوت بجودة استوديو مباشرة من المتصفح — مجاني 100%، بدون رفع، وبدون تسجيل حساب.",
                    noticeBrowserText: "متصفحك لا يدعم تسجيل الشاشة الكامل عبر MediaRecorder. يرجى استخدام متصفح كروم، إيدج، أو بريف على الكمبيوتر للحصول على أفضل تجربة.",
                    tabDevices: "الأجهزة والجودة", tabDesign: "تصميم الكاميرا", tabOptions: "المؤقت والصوت",
                    grpSources: "مصادر التسجيل", lblRecMode: "🎬 وضع التسجيل",
                    modeScreenCam: "🖥️+📷 شاشة + كاميرا معاً", modeScreenOnly: "🖥️ الشاشة فقط", modeCamOnly: "📷 الكاميرا فقط",
                    btnPickScreen: "اختر / حدد الشاشة المراد تسجيلها",
                    mobileTip: "على الهواتف، سيطلب المتصفح إذناً لتحديد الشاشة أو التطبيق. إذا كان التسجيل المباشر للشاشة غير مدعوم، سيتم استخدام الكاميرا تلقائياً.",
                    lblWebcam: "تفعيل الكاميرا", lblMic: "تفعيل الميكروفون", lblSysAudio: "صوت النظام / التبويب",
                    grpDevices: "الأجهزة والجودة", lblCameraDev: "جهاز الكاميرا", lblMicDev: "جهاز الميكروفون",
                    lblQuality: "جودة الفيديو", optHigh: "عالية (4K / 1080p)", optMedium: "متوسطة (720p)", optLow: "منخفضة (480p)",
                    lblFps: "معدل الإطارات",
                    grpOverlay: "تصميم غلاف الكاميرا",
                    dragTip: "يمكنك سحب وتحريك مربع الكاميرا إلى أي مكان على الشاشة باستخدام الماوس أو اللمس.",
                    lblCamSize: "حجم الكاميرا", lblCamShape: "شكل الكاميرا", shapeRounded: "مربع منحني الأطراف", shapeCircle: "دائري", shapeRect: "مستطيل",
                    lblCamBorder: "إطار الكاميرا", optGlow: "إطار مضيء",
                    grpTiming: "خيارات التسجيل وتأثيرات الصوت", lblCountdown: "عد تنازلي (3 ثوانٍ)", lblMicMeter: "مستوى نشاط الميكروفون",
                    previewTitle: "معاينة البث المباشر والكاميرا", btnExpand: "ملء الشاشة", btnExitFullscreen: "خروج من ملء الشاشة",
                    emptyTitle: "جاهز لبدء التسجيل", emptyDesc: "اضبط إعدادات الكاميرا والصوت من اللوحة الجانبية، ثم اضغط على بدء التسجيل.",
                    btnStart: "بدء التسجيل", btnPause: "إيقاف مؤقت", btnResume: "استئناف", btnStop: "إيقاف التسجيل", btnReset: "إعادة ضبط",
                    finalTitle: "🎉 التسجيل جاهز! معاينة وتحميل", btnClose: "إغلاق وإلغاء",
                    lblDuration: "مدة التسجيل", lblFormat: "الصيغة", lblSize: "حجم الملف", lblResolution: "الأبعاد والبدقة",
                    btnDownload: "تنزيل الفيديو", btnRecordAgain: "تسجيل فيديو جديد", getReady: "استعد...",
                    feat1Title: "محلي وخاص 100%", feat1Desc: "بث الفيديو لا يغادر جهازك نهائياً. المعالجة تكتمل بالكامل داخل المتصفح.",
                    feat2Title: "كاميرا داخل الشاشة PIP", feat2Desc: "دمج بث الكاميرا الحية فوق الشاشة مع خيارات تحكم كاملة في الحجم والشكل والموقع.",
                    feat3Title: "مدمج صوت متعدد القنوات", feat3Desc: "دمج التعليق الصوتي للميكروفون مع صوت النظام أو التبويب بوضوح تام.",
                    feat4Title: "جودة فائقة و 60 إطار", feat4Desc: "تسجيل فيديو ناعم يصل إلى 60 إطاراً في الثانية وبسرعة تدفق عالية.",
                    feat5Title: "مجاني وبدون علامة مائية", feat5Desc: "مدة تسجيل غير محدودة بدون أي علامات مائية مضافة أو قيود.",
                    feat6Title: "بدون تثبيت برامج", feat6Desc: "يعمل فورياً في متصفحات الويب بدون حاجة لتثبيت إضافة Chrome أو تطبيق.",
                    whyTitle: "لماذا تختار مسجل الشاشة الاحترافي من GToolix؟",
                    whyP1: "برامج تسجيل الشاشة التقليدية تتطلب تثبيت برامج ثقيلة، اشتراكات شهرية مدفوعة، أو تقوم برفع مقاطعك إلى سيرفرات خارجية بحدود ضيقة. يقدم GToolix Screen Recorder Studio استوديو متكامل يعمل 100% داخل متصفحك لتسجيل الشروحات والاجتماعات والألعاب بخصوصية مطلقة وبدون أي تأخير.",
                    howTitle: "كيف تسجل الشاشة والكاميرا في 4 خطوات؟",
                    step1Title: "ضبط المصادر والأجهزة", step1Desc: "اختر الكاميرا والميكروفون وموقع الكاميرا وشكلها من لوحة التحكم الجانبية.",
                    step2Title: "اضغط بدء واقتطع الشاشة", step2Desc: "اضغط على بدء التسجيل واختر ما إذا كنت تريد تسجيل كامل الشاشة، نافذة برنامج، أو تبويب المتصفح.",
                    step3Title: "التسجيل والتحكم الحقيقي", step3Desc: "استخدم أزرار الإيقاف المؤقت/الاستئناف ومؤشر الصوت الحي أثناء تقديم عرضك.",
                    step4Title: "المعاينة والحفظ", step4Desc: "أوقف التسجيل لمعاينة الفيديو فورياً وتحميل الملف بجودة عالية بصيغة WebM أو MP4.",
                    faqTitle: "الأسئلة الشائعة حول تسجيل الشاشة",
                    faqs: [
                        { q: "هل بيتم رفع تسجيلاتي على أي سيرفر؟", a: "لا إطلاقاً! التسجيل بالكامل يتم محلياً داخل متصفحك، ولا يُرفع أو يُخزن على أي سيرفر خارجي." },
                        { q: "هل أستطيع تسجيل الشاشة والكاميرا وصوت النظام معاً؟", a: "نعم، يمكنك تفعيل كافة المصادر في نفس الوقت والتحكم في مستوياتها بشكل مستقل." },
                        { q: "هل هناك حد أقصى لمدة التسجيل؟", a: "لا يوجد حد مصطنع، المدة تعتمد فقط على إمكانيات جهازك والمساحة المتاحة." },
                        { q: "هل يحتوي الفيديو الناتج على علامة مائية؟", a: "لا، الفيديو النهائي ناصع ونظيف تماماً بدون أي علامة مائية أو شعار." },
                        { q: "هل يحتاج البرنامج لتثبيت أو تسجيل حساب؟", a: "لا، الأداة تعمل مباشرة من المتصفح بدون تثبيت أي تطبيق أو إنشاء حساب." }
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

            const recFaqContainer = document.getElementById('rec-faq-list');
            if (recFaqContainer) {
                const faqs = (translations[currentLang] && translations[currentLang].rec && translations[currentLang].rec.faqs) || (translations.ar && translations.ar.rec && translations.ar.rec.faqs);
                if (Array.isArray(faqs)) {
                    recFaqContainer.innerHTML = faqs.map((item, idx) => \`
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
    <script src="/static/js/screen-recorder-tool.min.js" defer></script>
</body>

</html>
`;

fs.writeFileSync(path.join(targetDir, 'index.html'), standaloneHtml);
console.log('Successfully created screen-recorder-studio/index.html!');
