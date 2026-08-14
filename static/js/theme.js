// ===================================================================
// GToolix — Theme Switcher
// Supports Dark / Light mode with localStorage persistence,
// prefers-color-scheme detection, smooth icon transitions,
// and side-by-side navbar placement on desktop & mobile.
// ===================================================================

(function () {
    'use strict';

    const STORAGE_KEY = 'theme';
    const DARK = 'dark';
    const LIGHT = 'light';

    // Icons
    const SUN_ICON = '☀️';
    const MOON_ICON = '🌙';

    /**
     * Determine initial theme:
     * 1. Check localStorage
     * 2. Fall back to system preference
     * 3. Default to light
     */
    function getInitialTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === DARK || saved === LIGHT) return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return DARK;
        }
        return LIGHT;
    }

    /**
     * Apply theme to HTML root element
     */
    function applyTheme(theme, animateIcon = false) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === DARK ? '#020817' : '#F8FAFC');
        }
        updateIcons(theme, animateIcon);
    }

    /**
     * Toggle theme state
     */
    function toggleTheme() {
        document.documentElement.classList.add('theme-transitioning');
        const current = document.documentElement.getAttribute('data-theme') || LIGHT;
        const next = current === DARK ? LIGHT : DARK;
        applyTheme(next, true);
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 350);
    }

    /**
     * Update icon text and smooth rotation/scale animation
     */
    function updateIcons(theme, animate) {
        const icon = theme === DARK ? MOON_ICON : SUN_ICON;
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            const iconSpan = btn.querySelector('.theme-toggle-icon');
            const labelText = theme === DARK ? 'Switch to light mode' : 'Switch to dark mode';

            btn.setAttribute('aria-label', labelText);
            btn.setAttribute('title', labelText);

            if (iconSpan) {
                if (animate) {
                    iconSpan.style.transform = 'scale(0) rotate(-90deg)';
                    setTimeout(() => {
                        iconSpan.textContent = icon;
                        iconSpan.style.transform = 'scale(1) rotate(0deg)';
                    }, 120);
                } else {
                    iconSpan.textContent = icon;
                    iconSpan.style.transform = 'scale(1) rotate(0deg)';
                }
            } else {
                btn.textContent = icon;
            }
        });
    }

    /**
     * Create Theme Toggle button immediately beside Language Switcher inside .site-nav__right
     */
    function createButton() {
        const navRight = document.querySelector('.site-nav__right');
        if (!navRight) return;

        // Prevent duplicate creation
        if (document.querySelector('.theme-toggle-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'theme-toggle-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Toggle theme');

        const iconSpan = document.createElement('span');
        iconSpan.className = 'theme-toggle-icon';
        btn.appendChild(iconSpan);

        btn.addEventListener('click', toggleTheme);

        // Place immediately beside lang-switcher inside .site-nav__right
        const langSwitcher = navRight.querySelector('.lang-switcher');
        if (langSwitcher) {
            navRight.insertBefore(btn, langSwitcher);
        } else {
            navRight.prepend(btn);
        }

        const currentTheme = document.documentElement.getAttribute('data-theme') || getInitialTheme();
        updateIcons(currentTheme, false);
    }

    /**
     * Watch OS color scheme changes
     */
    function watchSystemPreference() {
        if (!window.matchMedia) return;
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? DARK : LIGHT, true);
            }
        });
    }

    /**
     * Initialize
     */
    function init() {
        const theme = getInitialTheme();
        applyTheme(theme, false);
        createButton();
        watchSystemPreference();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.toggleTheme = toggleTheme;
})();

/* ===================================================================
   GToolix — Non-Intrusive Viewport Cursor Spotlight System
   - Smooth 60 FPS Lerp (linear interpolation) mouse tracking
   - Fixed viewport radial-gradient spotlight
   - Pointer-events: none (100% zero interference with site elements)
   =================================================================== */
(function () {
    'use strict';

    if (typeof window === 'undefined') return;

    const isPointerFine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isPointerFine || isReducedMotion || window.innerWidth <= 768) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    function initSpotlight() {
        if (document.getElementById('gtoolix-cursor-spotlight')) return;

        const spotlight = document.createElement('div');
        spotlight.id = 'gtoolix-cursor-spotlight';
        spotlight.className = 'gtoolix-cursor-spotlight';
        document.body.appendChild(spotlight);

        function updateSpotlight() {
            // Smooth lerp movement
            currentX += (targetX - currentX) * 0.12;
            currentY += (targetY - currentY) * 0.12;

            spotlight.style.setProperty('--spotlight-x', `${currentX.toFixed(1)}px`);
            spotlight.style.setProperty('--spotlight-y', `${currentY.toFixed(1)}px`);

            requestAnimationFrame(updateSpotlight);
        }

        requestAnimationFrame(updateSpotlight);

        window.addEventListener('mousemove', function (e) {
            targetX = e.clientX;
            targetY = e.clientY;
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSpotlight);
    } else {
        initSpotlight();
    }
})();

/* ===================================================================
   GToolix — Global Page & Footer i18n Handler with Smart Language Detection
   =================================================================== */
(function () {
    const GLOBAL_TRANSLATIONS = {
        ar: {
            'common.breadcrumbHome': 'الرئيسية',
            'common.footerNote': 'GToolix مخصص للاستخدام الشخصي مع محتوى تملك حقوقه أو مرخّص للاستخدام العام.',
            'common.footerToolsTitle': 'الأدوات المميزة',
            'common.navQr': 'مولد كود QR',
            'common.navThumb': 'تحميل صور اليوتيوب المصغرة',
            'common.navGemini': 'مزيل علامة جيميناي',
            'common.navRecorder': 'مسجل الشاشة الاحترافي',
            'common.footerTrustTitle': 'عن المنصة والثقة',
            'common.linkAbout': 'عن المنصة',
            'common.linkContact': 'اتصل بنا',
            'common.linkFaq': 'الأسئلة الشائعة',
            'common.footerLegalTitle': 'الخصوصية والشروط',
            'common.linkPrivacy': 'سياسة الخصوصية',
            'common.linkTerms': 'الشروط والأحكام',
            'common.linkCookies': 'سياسة الكوكيز',
            'common.linkDisclaimer': 'إخلاء المسؤولية',
            'common.linkDmca': 'حقوق النشر (DMCA)',
            'common.footerCopyright': '© 2026 GToolix. All rights reserved.'
        },
        en: {
            'common.breadcrumbHome': 'Home',
            'common.footerNote': 'GToolix is intended for personal use with content you own or licensed for public use.',
            'common.footerToolsTitle': 'Featured Tools',
            'common.navQr': 'QR Code Generator',
            'common.navThumb': 'YouTube Thumbnail Downloader',
            'common.navGemini': 'Gemini Watermark Remover',
            'common.navRecorder': 'Screen Recorder Studio',
            'common.footerTrustTitle': 'About Platform & Trust',
            'common.linkAbout': 'About Us',
            'common.linkContact': 'Contact Us',
            'common.linkFaq': 'FAQ',
            'common.footerLegalTitle': 'Privacy & Terms',
            'common.linkPrivacy': 'Privacy Policy',
            'common.linkTerms': 'Terms of Service',
            'common.linkCookies': 'Cookies Policy',
            'common.linkDisclaimer': 'Disclaimer',
            'common.linkDmca': 'Copyright (DMCA)',
            'common.footerCopyright': '© 2026 GToolix. All rights reserved.'
        }
    };

    const ROUTE_TITLES = {
        '/qr-code-generator': {
            en: { title: "Free QR Code Generator Online | Custom Barcode & QR - GToolix", desc: "Free high-performance online QR Code Generator. Create custom high-resolution QR codes for URLs, Wi-Fi, vCards, SMS, and text instantly with zero watermarks." },
            ar: { title: "مولد كود QR مجاني أونلاين | إنشاء باركود QR بدون تسجيل – GToolix", desc: "أفضل أداة مجانية أونلاين لإنشاء وتخصيص أكواد QR عالية الدقة بدون علامة مائية. توليد فوري لأكواد الروابط والواي فاي وبطاقات الاتصال والنصوص." }
        },
        '/gemini/watermark-remover': {
            en: { title: "Free Gemini Watermark Remover Online | Remove Google AI Watermark - GToolix", desc: "Remove Google Gemini AI watermark from your images instantly online. 100% free, browser-based, client-side processing, no quality loss." },
            ar: { title: "مزيل علامة جيميناي المائية مجاناً أونلاين | GToolix", desc: "أداة مجانية أونلاين لإزالة العلامة المائية من صور جيميناي (Google Gemini AI) فورياً وبأقصى جودة وبدون تسجيل." }
        },
        '/youtube-thumbnail-downloader': {
            en: { title: "Free YouTube Thumbnail Downloader HD & 4K | Image Extractor - GToolix", desc: "Free online YouTube Thumbnail Downloader. Extract high-resolution YouTube video and Shorts cover images in HD, 1080p, and 4K instantly with zero watermark." },
            ar: { title: "تحميل صور اليوتيوب المصغرة HD و 4K مجاناً | مستخرج الصور – GToolix", desc: "أفضل أداة مجانية أونلاين لتحميل وتنظيف صور اليوتيوب المصغرة (Thumbnails) بجودة HD و 1080p و 4K بضغطة واحدة. استخرج صور أغلفة فيديوهات يوتيوب والشورتس فورياً وبدون تسجيل." }
        },
        '/screen-recorder-studio': {
            en: { title: "Free Professional Screen Recorder | Record Screen, Camera & Audio - GToolix", desc: "Record screen, webcam, and audio in studio quality right from your browser — 100% private, zero upload, no signup, no watermark." },
            ar: { title: "مسجل الشاشة الاحترافي مجانًا | تسجيل شاشة وصوت وكاميرا بدون برنامج - GToolix", desc: "سجّل شاشتك بجودة استوديو مباشرة من متصفحك — شاشة، كاميرا، صوت النظام والميكروفون معًا. بدون تثبيت، بدون رفع، بدون حساب. تسجيلك يفضل على جهازك فقط." }
        },
        '/about': {
            en: { title: "About GToolix - Vision, Mission & Privacy Commitment | GToolix", desc: "Learn about GToolix, a fast and secure digital platform providing free client-side web tools." },
            ar: { title: "عن منصة GToolix – الرؤية والمهمة والالتزام | GToolix", desc: "تعرّف على منصة GToolix، الأداة الرقمية السريعة والآمنة لتوليد أكواد QR وتنزيل صور يوتيوب المصغرة بدون تسجيل ولا علامة مائية." }
        },
        '/privacy-policy': {
            en: { title: "Privacy Policy | GToolix", desc: "Read GToolix Privacy Policy to learn how we protect your data with 100% client-side local processing." },
            ar: { title: "سياسة الخصوصية | GToolix", desc: "اقرأ سياسة الخصوصية لمنصة GToolix وتعرف على كيفية حماية بياناتك ومعالجة كافة الأدوات محلياً 100%." }
        },
        '/terms-of-service': {
            en: { title: "Terms of Service | GToolix", desc: "Read GToolix Terms of Service and usage guidelines for all free web tools." },
            ar: { title: "الشروط والأحكام | GToolix", desc: "اتفق مع الشروط والأحكام الخاصة باستكشاف واستخدام أدوات منصة GToolix." }
        },
        '/cookies-policy': {
            en: { title: "Cookies Policy | GToolix", desc: "Learn how GToolix uses cookies and local storage to save your language and theme preferences." },
            ar: { title: "سياسة الكوكيز | GToolix", desc: "تعرف على كيفية استخدام منصة GToolix لملفات الكوكيز وحفظ تفضيلات اللغة والمظهر." }
        },
        '/disclaimer': {
            en: { title: "Disclaimer | GToolix", desc: "Read the official legal disclaimer for GToolix web tools." },
            ar: { title: "إخلاء المسؤولية | GToolix", desc: "إخلاء المسؤولية القانونية وتوضيح طبيعة استخدام أدوات منصة GToolix." }
        },
        '/dmca': {
            en: { title: "DMCA Copyright Policy | GToolix", desc: "GToolix DMCA Copyright Policy and copyright infringement notification guidelines." },
            ar: { title: "سياسة حقوق النشر (DMCA) | GToolix", desc: "سياسة حقوق الطبع والنشر والتأليف وإرشادات الإبلاغ عن الانتهاكات في منصة GToolix." }
        },
        '/faq': {
            en: { title: "Frequently Asked Questions (FAQ) | GToolix", desc: "Frequently asked questions about GToolix tools, privacy, and browser compatibility." },
            ar: { title: "الأسئلة الشائعة (FAQ) | GToolix", desc: "إجابات كافة الأسئلة الشائعة حول أدوات منصة GToolix والخصوصية والتوافق." }
        },
        '/contact': {
            en: { title: "Contact Us | GToolix", desc: "Get in touch with the GToolix support and development team." },
            ar: { title: "اتصل بنا | GToolix", desc: "تواصل مع فريق دعم وتطوير منصة GToolix للأسئلة والاستفسارات." }
        },
        '/': {
            en: { title: "GToolix - Free High-Performance Web Tools Studio", desc: "All-in-one suite of free web tools: QR Code Generator, YouTube Thumbnail Downloader, Gemini Watermark Remover, and Screen Recorder Studio. Fast, client-side, zero signup." },
            ar: { title: "GToolix - استوديو الأدوات المجانية عالية الأداء", desc: "منصة GToolix تقدم أدوات ويب مجانية فائقة السرعة: مولد كود QR، تنزيل صور يوتيوب المصغرة، إزالة علامة جيميناي المائية، ومسجل الشاشة الاحترافي." }
        }
    };

    window.getGToolixLanguage = function () {
        const docLang = document.documentElement.getAttribute('lang') || document.documentElement.lang;
        if (docLang === 'ar' || docLang === 'en') return docLang;
        try {
            const saved = localStorage.getItem('gtoolix_language') || localStorage.getItem('siteLang');
            if (saved === 'ar' || saved === 'en') return saved;
            const userLangs = (navigator.languages && navigator.languages.length) ? navigator.languages : (navigator.language ? [navigator.language] : []);
            for (let i = 0; i < userLangs.length; i++) {
                const code = (userLangs[i] || '').toLowerCase();
                if (code.indexOf('ar') === 0) return 'ar';
                if (code.indexOf('en') === 0) return 'en';
            }
        } catch (e) { }
        return 'en';
    };

    window.updateI18n = function (lang) {
        const currentLang = lang || window.getGToolixLanguage();
        document.documentElement.setAttribute('lang', currentLang);
        document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

        const dict = GLOBAL_TRANSLATIONS[currentLang] || GLOBAL_TRANSLATIONS.ar;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        // Update document.title and meta description dynamically
        let path = window.location.pathname.replace(/\/$/, '') || '/';
        let routeMeta = ROUTE_TITLES[path];
        if (!routeMeta) {
            for (let r in ROUTE_TITLES) {
                if (r !== '/' && path.indexOf(r) === 0) {
                    routeMeta = ROUTE_TITLES[r];
                    break;
                }
            }
        }
        if (!routeMeta) routeMeta = ROUTE_TITLES['/'];

        if (routeMeta && routeMeta[currentLang]) {
            document.title = routeMeta[currentLang].title;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', routeMeta[currentLang].desc);
        }

        const enBtn = document.getElementById('lang-en-btn');
        const arBtn = document.getElementById('lang-ar-btn');
        if (enBtn) enBtn.classList.toggle('active', currentLang === 'en');
        if (arBtn) arBtn.classList.toggle('active', currentLang === 'ar');
    };

    window.updateFooterI18n = window.updateI18n;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.updateI18n();
        });
    } else {
        window.updateI18n();
    }
})();

/* ===================================================================
   GToolix — Global Scroll Reveal System
   =================================================================== */
(function () {
    'use strict';
    function initReveal() {
        const items = document.querySelectorAll('.reveal');
        if (!items.length) return;
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion || !('IntersectionObserver' in window)) {
            items.forEach(el => el.classList.add('in-view'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('in-view'), Math.min(i * 30, 150));
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.01, rootMargin: '200px 0px 100px 0px' });
        items.forEach(el => io.observe(el));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReveal);
    } else {
        initReveal();
    }
})();




