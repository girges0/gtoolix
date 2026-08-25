// ===================================================================
// GToolix — Theme Switcher
// Supports Dark / Light mode with localStorage persistence,
// prefers-color-scheme detection, smooth icon transitions,
// debounced toggling, and robust global event delegation.
// ===================================================================

(function () {
    'use strict';

    const STORAGE_KEY = 'theme';
    const DARK = 'dark';
    const LIGHT = 'light';

    // Icons:
    // When DARK mode is active -> Show SUN (Click to switch to light)
    // When LIGHT mode is active -> Show MOON (Click to switch to dark)
    const SUN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const MOON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    let isToggling = false;

    /**
     * Determine initial theme:
     * 1. Check if user set an explicit manual override (theme_manual)
     * 2. Otherwise always follow device/system preference (prefers-color-scheme)
     * 3. Default to light
     */
    function getInitialTheme() {
        try {
            const isManual = localStorage.getItem('theme_manual') === 'true';
            const saved = localStorage.getItem(STORAGE_KEY);
            if (isManual && (saved === DARK || saved === LIGHT)) return saved;
        } catch (e) { }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return DARK;
        }
        return LIGHT;
    }

    /**
     * Apply theme to HTML root element
     */
    function applyTheme(theme, animateIcon, isManual) {
        if (theme !== DARK && theme !== LIGHT) theme = LIGHT;
        document.documentElement.setAttribute('data-theme', theme);
        try {
            if (isManual) {
                localStorage.setItem('theme_manual', 'true');
                localStorage.setItem(STORAGE_KEY, theme);
            }
        } catch (e) { }
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === DARK ? '#020817' : '#F8FAFC');
        }
        updateIcons(theme, animateIcon);

        // Notify any active listeners or canvas elements
        try {
            window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
        } catch (e) { }
    }

    /**
     * Toggle theme state with debounce protection
     */
    function toggleTheme() {
        if (isToggling) return;
        isToggling = true;
        setTimeout(() => { isToggling = false; }, 250);

        document.documentElement.classList.add('theme-transitioning');
        const current = document.documentElement.getAttribute('data-theme') || LIGHT;
        const next = current === DARK ? LIGHT : DARK;
        applyTheme(next, true, true);
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 350);
    }

    /**
     * Update icon text and smooth rotation/scale animation
     */
    function updateIcons(theme, animate) {
        const iconSvg = theme === DARK ? SUN_SVG : MOON_SVG;
        const isAr = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
        const labelText = theme === DARK
            ? (isAr ? 'التبديل إلى الوضع النهاري (الفاتح)' : 'Switch to light mode')
            : (isAr ? 'التبديل إلى الوضع الليلي (الداكن)' : 'Switch to dark mode');

        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.setAttribute('aria-label', labelText);
            btn.setAttribute('title', labelText);

            let iconSpan = btn.querySelector('.theme-toggle-icon');
            if (!iconSpan) {
                iconSpan = document.createElement('span');
                iconSpan.className = 'theme-toggle-icon';
                btn.innerHTML = '';
                btn.appendChild(iconSpan);
            }

            if (animate) {
                iconSpan.style.transform = 'scale(0) rotate(-90deg)';
                setTimeout(() => {
                    iconSpan.innerHTML = iconSvg;
                    iconSpan.style.transform = 'scale(1) rotate(0deg)';
                }, 120);
            } else {
                iconSpan.innerHTML = iconSvg;
                iconSpan.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    }

    /**
     * Create Theme Toggle button if missing in navbar
     */
    function createButton() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || getInitialTheme();
        const navRight = document.querySelector('.site-nav__right');
        if (!navRight) {
            updateIcons(currentTheme, false);
            return;
        }

        // If not already in DOM, create it
        if (!document.querySelector('.theme-toggle-btn')) {
            const btn = document.createElement('button');
            btn.className = 'theme-toggle-btn';
            btn.id = 'theme-toggle-btn';
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Toggle theme');

            const iconSpan = document.createElement('span');
            iconSpan.className = 'theme-toggle-icon';
            btn.appendChild(iconSpan);

            // Place immediately beside lang-switcher inside .site-nav__right
            const langSwitcher = navRight.querySelector('.lang-switcher');
            if (langSwitcher) {
                navRight.insertBefore(btn, langSwitcher);
            } else {
                navRight.prepend(btn);
            }
        }

        updateIcons(currentTheme, false);
    }

    /**
     * Watch OS/device color scheme changes in real-time
     */
    function watchSystemPreference() {
        if (!window.matchMedia) return;
        try {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const systemChangeHandler = function (e) {
                let isManual = false;
                try { isManual = localStorage.getItem('theme_manual') === 'true'; } catch (err) { }
                if (!isManual) {
                    applyTheme(e.matches ? DARK : LIGHT, true, false);
                }
            };
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', systemChangeHandler);
            } else if (mediaQuery.addListener) {
                mediaQuery.addListener(systemChangeHandler);
            }
        } catch (e) { }
    }

    /**
     * Global Event Delegation: Guarantees ANY .theme-toggle-btn works reliably
     */
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.theme-toggle-btn');
        if (btn) {
            e.preventDefault();
            toggleTheme();
            return;
        }

        const langBtn = e.target.closest('.lang-btn');
        if (langBtn) {
            try {
                const isEn = langBtn.id === 'lang-en-btn' || langBtn.textContent.trim().toUpperCase() === 'EN' || (langBtn.getAttribute('href') || '').includes('/en');
                localStorage.setItem('gtoolix_manual_lang', 'true');
                localStorage.setItem('gtoolix_language', isEn ? 'en' : 'ar');
                localStorage.setItem('siteLang', isEn ? 'en' : 'ar');
            } catch (err) { }
        }
    });

    /**
     * Initialize
     */
    function init() {
        const theme = getInitialTheme();
        applyTheme(theme, false, false);
        createButton();
        watchSystemPreference();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose globals for direct invocation or external modules
    window.toggleTheme = toggleTheme;
    window.setTheme = applyTheme;
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
            'common.backLink': '← العودة لكل الأدوات',
            'common.footerNote': 'GToolix مخصص للاستخدام الشخصي مع محتوى تملك حقوقه أو مرخّص للاستخدام العام.',
            'common.footerToolsTitle': 'الأدوات المميزة',
            'common.footerSectionsTitle': 'أقسام المنصة',
            'common.navTools': 'الأدوات',
            'common.navToolsDesc': 'أدوات ذكية وتفاعلية مجانية',
            'common.navBlog': 'المقالات',
            'common.navBlogDesc': 'شروحات ومقالات حصرية ومفيدة',
            'common.navPrograms': 'البرامج',
            'common.navProgramsDesc': 'تطبيقات وحلول رقمية جاهزة',
            'common.footerTools': 'الأدوات',
            'common.footerBlog': 'المقالات',
            'common.footerPrograms': 'البرامج',
            'common.navQr': 'مولد رمز QR',
            'common.navThumb': 'تحميل الصور المصغرة لليوتيوب',
            'common.navRecorder': 'مسجل الشاشة',
            'common.navCompressor': 'ضاغط ومحوّل الصور الرقمي',
            'common.footerTrustTitle': 'عن المنصة والثقة',
            'common.linkAbout': 'عن المنصة',
            'common.linkContact': 'اتصل بنا',
            'common.linkFaq': 'الأسئلة الشائعة',
            'common.footerLegalTitle': 'الخصوصية والشروط',
            'common.linkPrivacy': 'سياسة الخصوصية',
            'common.linkTerms': 'شروط الاستخدام',
            'common.linkCookies': 'سياسة الكوكيز',
            'common.linkDisclaimer': 'إخلاء المسؤولية',
            'common.linkDmca': 'حقوق النشر (DMCA)',
            'common.footerCopyright': '© 2026 GToolix. All rights reserved.',
            
            // Hero Section
            'home.heroBadge': 'أدوات أونلاين وحلول رقمية',
            'home.heroTitle': 'كل أدواتك الرقمية. في مكان واحد.',
            'home.heroTitleHtml': 'كل أدواتك <span class="gt-flip-word" tabindex="0" role="button" aria-label="الرقمية"><span class="gt-flip-inner"><span class="gt-flip-front">الرقمية</span><span class="gt-flip-back">المجانية</span></span><span class="gt-flip-glow" aria-hidden="true"></span><span class="gt-flip-sparkles" aria-hidden="true"><span class="gt-sparkle s1"></span><span class="gt-sparkle s2"></span><span class="gt-sparkle s3"></span></span></span>.<br>في مكان واحد.',
            'home.heroSub': 'اكتشف أدوات بسيطة وسريعة وعملية لمهامك الرقمية اليومية.',
            'home.heroCtaTools': 'استكشف الأدوات ←',
            'home.heroCtaBlog': 'استكشف المقالات ←',

            // Popular Tools Section
            'home.popularToolsTitle': 'أشهر الأدوات',
            'home.viewAllTools': 'عرض جميع الأدوات',
            'home.previewExploreBtn': 'استكشف الأداة',
            'home.toolQrTitle': 'مولد رمز QR',
            'home.toolThumbTitle': 'تحميل الصور المصغرة لليوتيوب',
            'home.toolRecorderTitle': 'مسجل الشاشة',
            'home.toolCompressorTitle': 'ضاغط ومحوّل الصور',
            'home.toolQrDesc': 'توليد وتخصيص أكواد QR عالية الدقة فورياً بدون علامة مائية.',
            'home.toolThumbDesc': 'استخراج وتحميل صور أغلفة فيديوهات يوتيوب بدقة HD و 4K.',
            'home.toolRecorderDesc': 'تسجيل الشاشة والصوت والكاميرا بجودة استوديو مباشرة من المتصفح.',
            'home.toolCompressorDesc': 'ضغط وتحويل صور JPG و PNG و WebP و GIF بجودة فائقة مباشرة في متصفحك بدون رفع أي ملفات.',
            'home.previewBadge': 'معالجة محلية 100%',

            // Platform Sections
            'home.sectionsKicker': 'استكشف GToolix',
            'home.secToolsTitle': 'أدوات أونلاين',
            'home.secToolsDesc': 'أدوات مفيدة تعمل من المتصفح للمهام الرقمية اليومية.',
            'home.secToolsCta': 'استكشف الأدوات ←',
            'home.secBlogTitle': 'المقالات',
            'home.secBlogDesc': 'أدلة وشروحات ومقالات مفيدة عن مختلف الموضوعات والأدوات الرقمية.',
            'home.secBlogCta': 'تصفح المقالات ←',
            'home.secProgramsTitle': 'البرامج',
            'home.secProgramsDesc': 'اكتشف البرامج القابلة للتنزيل والأدوات الرقمية المفيدة.',
            'home.secProgramsCta': 'اكتشف البرامج ←',

            // Feature Block 1 - Online Tools
            'home.feat1Heading': 'أدوات قوية، بطريقة بسيطة',
            'home.feat1Paragraph': 'استخدم أدوات أونلاين عملية مباشرة من متصفحك بدون تعقيد غير ضروري.',
            'home.feat1Check1': 'أدوات سريعة تعمل من المتصفح',
            'home.feat1Check2': 'واجهات بسيطة وسهلة الاستخدام',
            'home.feat1Check3': 'مفيدة للمهام الرقمية اليومية',
            'home.feat1Check4': 'دعم العربية والإنجليزية',
            'home.feat1Button': 'استكشف الأدوات ←',
            'home.feat1Badge': 'خصوصية محلية 100%',
            'home.feat1Tile1Sub': 'محرك متجهي يعمل في المتصفح',
            'home.feat1Tile1Status': 'نشط',
            'home.feat1Tile2Sub': 'بدون أي فقدان للجودة',

            // Feature Block 2 - Blog
            'home.feat2Heading': 'تعلّم المزيد مع GToolix',
            'home.feat2Paragraph': 'استكشف الأدلة والشروحات والمقالات المفيدة حول الأدوات الرقمية والتكنولوجيا والحلول العملية.',
            'home.feat2Check1': 'أدلة عملية',
            'home.feat2Check2': 'شروحات مفيدة',
            'home.feat2Check3': 'مقالات ودلائل شاملة',
            'home.feat2Check4': 'نصائح رقمية مفيدة',
            'home.feat2Button': 'تصفح المقالات ←',
            'home.feat2Badge': 'مقالات متجددة',
            'home.feat2Tile1Title': 'أدوات الويب الحديثة والخصوصية',
            'home.feat2Tile1Sub': 'أدلة تفصيلية وتطبيقات عملية',
            'home.feat2Tile1Badge': 'دليل',
            'home.feat2TagAi': '# ذكاء_اصطناعي',
            'home.feat2TagPrivacy': '# خصوصية',
            'home.feat2TagWeb': '# أدوات_الويب',

            // Feature Block 3 - Programs
            'home.feat3Heading': 'برامج وتطبيقات سطح المكتب',
            'home.feat3Paragraph': 'حمّل تطبيقات وبرمجيات مكتبية موثوقة لأداء مهامك بسرعة وأمان.',
            'home.feat3Check1': 'تطبيقات مكتبية خفيفة',
            'home.feat3Check2': 'روابط تحميل مباشرة وآمنة',
            'home.feat3Check3': 'معلومات وشروحات واضحة لكل برنامج',
            'home.feat3Check4': 'مكتبة برامج منظمة ومحدثة باستمرار',
            'home.feat3Button': 'اكتشف البرامج ←',
            'home.feat3Badge': 'برامج موثوقة',
            'home.feat3Tile1Title': 'برامج وتطبيقات سطح المكتب',
            'home.feat3Tile1Sub': 'تحميل مباشر وآمن 100%',
            'home.feat3Tile1Status': 'موثوق',
            'home.feat3Tile2Title': 'فحص أمني دوري',
            'home.feat3Tile2Sub': 'خالٍ من البرمجيات الإعلانية',

            // Error / 404
            'error.title': 'الصفحة غير موجودة',
            'error.desc': 'عذراً، الصفحة التي تبحث عنها غير متوفرة أو ربما تم نقلها.',
            'error.btnHome': 'الرئيسية',
            'error.btnTools': 'الأدوات'
        },
        en: {
            'common.breadcrumbHome': 'Home',
            'common.backLink': '← Back to all tools',
            'common.footerNote': 'GToolix is intended for personal use with content you own or licensed for public use.',
            'common.footerToolsTitle': 'Featured Tools',
            'common.footerSectionsTitle': 'Platform Sections',
            'common.navTools': 'Tools',
            'common.navToolsDesc': 'Smart & interactive online tools',
            'common.navBlog': 'Articles',
            'common.navBlogDesc': 'Guides, articles & insights',
            'common.navPrograms': 'Programs',
            'common.navProgramsDesc': 'Desktop software & solutions',
            'common.footerTools': 'Tools',
            'common.footerBlog': 'Articles',
            'common.footerPrograms': 'Programs',
            'common.navQr': 'QR Code Generator',
            'common.navThumb': 'YouTube Thumbnail Downloader',
            'common.navRecorder': 'Screen Recorder',
            'common.navCompressor': 'Image Compressor & Converter',
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
            'common.footerCopyright': '© 2026 GToolix. All rights reserved.',

            // Hero Section
            'home.heroBadge': 'Online Tools & Digital Solutions',
            'home.heroTitle': 'All Your Digital Tools. One Place.',
            'home.heroTitleHtml': 'All Your <span class="gt-flip-word" tabindex="0" role="button" aria-label="Digital"><span class="gt-flip-inner"><span class="gt-flip-front">Digital</span><span class="gt-flip-back">Free</span></span><span class="gt-flip-glow" aria-hidden="true"></span><span class="gt-flip-sparkles" aria-hidden="true"><span class="gt-sparkle s1"></span><span class="gt-sparkle s2"></span><span class="gt-sparkle s3"></span></span></span> Tools.<br>In One Place.',
            'home.heroSub': 'Discover simple, fast, and practical tools for your everyday digital tasks.',
            'home.heroCtaTools': 'Explore Tools →',
            'home.heroCtaBlog': 'Explore Articles →',

            // Popular Tools Section
            'home.popularToolsTitle': 'Popular Tools',
            'home.viewAllTools': 'View All Tools',
            'home.previewExploreBtn': 'Explore Tool',
            'home.toolQrTitle': 'QR Code Generator',
            'home.toolThumbTitle': 'YouTube Thumbnail Downloader',
            'home.toolRecorderTitle': 'Screen Recorder',
            'home.toolCompressorTitle': 'Image Compressor & Converter',
            'home.toolQrDesc': 'Generate and customize high-resolution QR codes instantly without watermarks.',
            'home.toolThumbDesc': 'Extract and download YouTube video and Shorts cover images in HD and 4K.',
            'home.toolRecorderDesc': 'Record screen, webcam, and system audio in studio quality directly in your browser.',
            'home.toolCompressorDesc': 'Compress and convert JPG, PNG, WebP, and GIF images with high quality directly in your browser.',
            'home.previewBadge': '100% Client-Side Privacy',

            // Platform Sections
            'home.sectionsKicker': 'Explore GToolix',
            'home.secToolsTitle': 'Online Tools',
            'home.secToolsDesc': 'Useful browser-based tools for everyday digital tasks.',
            'home.secToolsCta': 'Explore Tools →',
            'home.secBlogTitle': 'Articles',
            'home.secBlogDesc': 'Guides, tutorials, and useful articles about digital tools and workflows.',
            'home.secBlogCta': 'Read Articles →',
            'home.secProgramsTitle': 'Programs',
            'home.secProgramsDesc': 'Discover downloadable software and useful digital programs.',
            'home.secProgramsCta': 'Explore Programs →',

            // Feature Block 1 - Online Tools
            'home.feat1Heading': 'Powerful Tools, Made Simple',
            'home.feat1Paragraph': 'Use practical online tools directly from your browser without unnecessary complexity.',
            'home.feat1Check1': 'Fast browser-based tools',
            'home.feat1Check2': 'Simple and easy-to-use interfaces',
            'home.feat1Check3': 'Useful for everyday digital tasks',
            'home.feat1Check4': 'Arabic and English support',
            'home.feat1Button': 'Explore Tools →',
            'home.feat1Badge': '100% Client-Side Privacy',
            'home.feat1Tile1Sub': 'Client-Side Vector Engine',
            'home.feat1Tile1Status': 'Active',
            'home.feat1Tile2Sub': 'Zero Quality Loss',

            // Feature Block 2 - Blog
            'home.feat2Heading': 'Learn More with GToolix',
            'home.feat2Paragraph': 'Explore useful guides, tutorials, and articles covering digital tools, productivity, and practical solutions.',
            'home.feat2Check1': 'Practical guides',
            'home.feat2Check2': 'Helpful tutorials',
            'home.feat2Check3': 'Articles & guides',
            'home.feat2Check4': 'Useful digital tips',
            'home.feat2Button': 'Read Articles →',
            'home.feat2Badge': 'Updated Weekly',
            'home.feat2Tile1Title': 'Modern Web Tools & Privacy',
            'home.feat2Tile1Sub': 'In-Depth Guides & Practical Workflows',
            'home.feat2Tile1Badge': 'Guide',
            'home.feat2TagAi': '# AI',
            'home.feat2TagPrivacy': '# Privacy',
            'home.feat2TagWeb': '# WebTools',

            // Feature Block 3 - Programs
            'home.feat3Heading': 'Discover GToolix Programs',
            'home.feat3Paragraph': 'Explore downloadable programs and useful software designed for practical digital needs.',
            'home.feat3Check1': 'Downloadable programs',
            'home.feat3Check2': 'Useful software',
            'home.feat3Check3': 'Clear program information',
            'home.feat3Check4': 'Organized program library',
            'home.feat3Button': 'Explore Programs →',
            'home.feat3Badge': 'Verified Software',
            'home.feat3Tile1Title': 'Desktop & Offline Utilities',
            'home.feat3Tile1Sub': 'Verified Direct Downloads',
            'home.feat3Tile1Status': 'Verified',
            'home.feat3Tile2Title': 'Security Scanned & Safe',
            'home.feat3Tile2Sub': 'No Bundled Software',

            // Error / 404
            'error.title': 'Page Not Found',
            'error.desc': 'Sorry, the page you are looking for does not exist or has been moved.',
            'error.btnHome': 'Home',
            'error.btnTools': 'Tools'
        }
    };

    const ROUTE_TITLES = {
        '/tools': {
            en: { title: "All Free Online Tools Directory | GToolix", desc: "Directory of free high-performance web tools: QR code generator, YouTube thumbnail downloader, and screen recorder studio." },
            ar: { title: "جميع الأدوات المجانية أونلاين | Free Online Tools – GToolix", desc: "دليل أدوات GToolix المجانية: أكواد QR، صور يوتيوب المصغرة، وتسجيل الشاشة فورياً وبخصوصية تامة." }
        },
        '/blog': {
            en: { title: "Articles, Guides & Tutorials | GToolix Blog", desc: "In-depth tutorials, guides, and articles on web tools, digital productivity, and workflows." },
            ar: { title: "المقالات والشروحات | GToolix Articles & Guides", desc: "مقالات وشروحات تفصيلية في مختلف المجالات، أدوات الويب، والإنتاجية الرقمية على مدونة GToolix." }
        },
        '/downloads': {
            en: { title: "Software & Downloads Hub | GToolix", desc: "Downloadable desktop and mobile utilities for offline processing, high speed, and 100% privacy." },
            ar: { title: "قسم البرامج والتطبيقات | GToolix Downloads", desc: "برامج وأدوات مكتبية قابلة للتنزيل من GToolix للكمبيوتر والهاتف، تعمل محلياً بخصوصية تامة." }
        },
        '/programs': {
            en: { title: "Software & Desktop Apps Hub | GToolix", desc: "Downloadable desktop and mobile utilities for offline processing, high speed, and 100% privacy." },
            ar: { title: "قسم البرامج والتطبيقات | GToolix Software", desc: "برامج وأدوات مكتبية قابلة للتنزيل من GToolix للكمبيوتر والهاتف، تعمل محلياً بخصوصية تامة." }
        },
        '/tools/qr-code-generator': {
            en: { title: "Free QR Code Generator Online | Custom Barcode & QR - GToolix", desc: "Free high-performance online QR Code Generator. Create custom high-resolution QR codes for URLs, Wi-Fi, vCards, SMS, and text instantly with zero watermarks." },
            ar: { title: "مولد كود QR مجاني أونلاين | إنشاء باركود QR بدون تسجيل – GToolix", desc: "أفضل أداة مجانية أونلاين لإنشاء وتخصيص أكواد QR عالية الدقة بدون علامة مائية. توليد فوري لأكواد الروابط والواي فاي وبطاقات الاتصال والنصوص." }
        },
        '/tools/youtube-thumbnail-downloader': {
            en: { title: "Free YouTube Thumbnail Downloader HD & 4K | Image Extractor - GToolix", desc: "Free online YouTube Thumbnail Downloader. Extract high-resolution YouTube video and Shorts cover images in HD, 1080p, and 4K instantly with zero watermark." },
            ar: { title: "تحميل صور اليوتيوب المصغرة HD و 4K مجاناً | مستخرج الصور – GToolix", desc: "أفضل أداة مجانية أونلاين لتحميل وتنظيف صور اليوتيوب المصغرة (Thumbnails) بجودة HD و 1080p و 4K بضغطة واحدة. استخرج صور أغلفة فيديوهات يوتيوب والشورتس فورياً وبدون تسجيل." }
        },
        '/tools/screen-recorder-studio': {
            en: { title: "Free Professional Screen Recorder | Record Screen, Camera & Audio - GToolix", desc: "Record screen, webcam, and audio in studio quality right from your browser — 100% private, zero upload, no signup, no watermark." },
            ar: { title: "مسجل الشاشة الاحترافي مجانًا | تسجيل شاشة وصوت وكاميرا بدون برنامج - GToolix", desc: "سجّل شاشتك بجودة استوديو مباشرة من متصفحك — شاشة، كاميرا، صوت النظام والميكروفون معًا. بدون تثبيت، بدون رفع، بدون حساب. تسجيلك يفضل على جهازك فقط." }
        },
        '/tools/image-compressor': {
            en: { title: "Free Image Compressor & Converter Online | GToolix", desc: "Compress and convert JPG, PNG, WebP, and GIF images directly in your browser with 100% privacy and zero server upload." },
            ar: { title: "ضاغط ومحوّل الصور أونلاين مجاناً | تصغير حجم الصور وتغيير الصيغ – GToolix", desc: "أداة مجانية لضغط وتحويل صور JPG وPNG وWebP وGIF بجودة عالية فورياً في متصفحك. قلل حجم الصور بدون فقدان الجودة، 100% خصوصية وأمان وبدون رفع لسيرفر." }
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
            en: { title: "GToolix - Free High-Performance Web Tools Studio", desc: "All-in-one suite of free web tools: QR Code Generator, YouTube Thumbnail Downloader, and Screen Recorder Studio. Fast, client-side, zero signup." },
            ar: { title: "GToolix - استوديو الأدوات المجانية عالية الأداء", desc: "منصة GToolix تقدم أدوات ويب مجانية فائقة السرعة: مولد كود QR، تنزيل صور يوتيوب المصغرة، ومسجل الشاشة الاحترافي." }
        }
    };

    window.getGToolixLanguage = function () {
        const path = window.location.pathname || '';
        if (path === '/en' || path.startsWith('/en/')) {
            return 'en';
        }
        const docLang = document.documentElement.getAttribute('lang') || document.documentElement.lang;
        if (docLang === 'ar' || docLang === 'en') return docLang;
        return 'ar';
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

        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (dict[key]) {
                el.innerHTML = dict[key];
            }
        });

        // Update document.title and meta description dynamically on exact match
        let rawPath = window.location.pathname.replace(/\/$/, '') || '/';
        let normalizedPath = rawPath.replace(/^\/en(\/|$)/, '$1') || '/';
        if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;

        let routeMeta = ROUTE_TITLES[rawPath] || ROUTE_TITLES[normalizedPath];
        if (routeMeta && routeMeta[currentLang]) {
            document.title = routeMeta[currentLang].title;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', routeMeta[currentLang].desc);
        }

        const enBtn = document.getElementById('lang-en-btn');
        const arBtn = document.getElementById('lang-ar-btn');
        const isEn = currentLang === 'en';

        if (enBtn) {
            enBtn.classList.toggle('active', isEn);
            const currentPath = window.location.pathname || '/';
            let targetEn = isEn ? currentPath : (currentPath === '/' ? '/en/' : ('/en' + currentPath));
            enBtn.setAttribute('href', targetEn);
        }
        if (arBtn) {
            arBtn.classList.toggle('active', !isEn);
            const currentPath = window.location.pathname || '/';
            let targetAr = isEn ? (currentPath.replace(/^\/en(\/|$)/, '$1') || '/') : currentPath;
            if (!targetAr.startsWith('/')) targetAr = '/' + targetAr;
            arBtn.setAttribute('href', targetAr);
        }

        // Update in-page links (breadcrumbs, related tools cards, back buttons)
        document.querySelectorAll('.related-tool-card').forEach(card => {
            let href = card.getAttribute('href') || '';
            if (isEn && !href.startsWith('/en/')) {
                card.setAttribute('href', '/en' + href);
            } else if (!isEn && href.startsWith('/en/')) {
                card.setAttribute('href', href.replace(/^\/en/, ''));
            }
        });
        document.querySelectorAll('.breadcrumb-nav a, .back-link, .related-tools-all-btn').forEach(link => {
            let href = link.getAttribute('href') || '';
            if (href === '/' || href === '/en' || href === '/en/') {
                link.setAttribute('href', isEn ? '/en/' : '/');
            } else if (isEn && !href.startsWith('/en/')) {
                link.setAttribute('href', '/en' + href);
            } else if (!isEn && href.startsWith('/en/')) {
                link.setAttribute('href', href.replace(/^\/en/, ''));
            }
        });

        // Dynamic directional arrows for LTR / RTL consistency
        document.querySelectorAll('.dir-arrow').forEach(arrow => {
            arrow.textContent = currentLang === 'ar' ? '←' : '→';
        });

        // Re-wrap feature headings into word masks if on homepage
        if (typeof window.prepareFeatureHeadings === 'function') {
            window.prepareFeatureHeadings();
        }
    };

    window.updateFooterI18n = window.updateI18n;

    // Global Event Delegation for Interactive 3D Flip Word (Touch & Click support)
    document.addEventListener('click', function (e) {
        const flipWord = e.target.closest('.gt-flip-word');
        if (flipWord) {
            flipWord.classList.toggle('is-flipped');
        } else {
            document.querySelectorAll('.gt-flip-word.is-flipped').forEach(el => el.classList.remove('is-flipped'));
        }
    });

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

/* ===================================================================
   GToolix — Global Universal FAQ Accordion Handler
   =================================================================== */
(function () {
    'use strict';
    function toggleFaq(btn) {
        if (!btn) return;
        const item = btn.closest('.faq-item');
        if (!item) return;
        const isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.faq-question');
        if (btn) {
            e.preventDefault();
            toggleFaq(btn);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const btn = e.target.closest('.faq-question');
            if (btn && document.activeElement === btn) {
                e.preventDefault();
                toggleFaq(btn);
            }
        }
    });
})();

/* ===================================================================
   GToolix — Global Universal Mobile Navigation (Hamburger Menu) Handler
   =================================================================== */
(function () {
    'use strict';

    let lastToggleTime = 0;

    function toggleNav(forceClose) {
        const now = Date.now();
        if (forceClose === undefined && (now - lastToggleTime < 200)) return;
        lastToggleTime = now;

        const links = document.getElementById('site-nav-links');
        const btn = document.getElementById('nav-toggle') || document.querySelector('.nav-toggle');
        const backdrop = document.getElementById('nav-backdrop') || document.querySelector('.nav-backdrop');
        if (!links) return;

        const isCurrentlyOpen = links.classList.contains('is-open');
        const shouldOpen = forceClose === true ? false : !isCurrentlyOpen;

        links.classList.toggle('is-open', shouldOpen);
        if (backdrop) backdrop.classList.toggle('is-open', shouldOpen);
        document.body.classList.toggle('menu-open', shouldOpen);
        if (btn) btn.setAttribute('aria-expanded', String(shouldOpen));
    }

    // Expose globally so inline onclick="toggleNav()" always works
    window.toggleNav = toggleNav;

    // Event Delegation: guarantees hamburger menu works reliably across all pages
    document.addEventListener('click', function (e) {
        const toggleBtn = e.target.closest('.nav-toggle');
        if (toggleBtn) {
            // Handled safely with debounce in toggleNav
            toggleNav();
            return;
        }

        const backdrop = e.target.closest('.nav-backdrop');
        if (backdrop) {
            e.preventDefault();
            toggleNav(true);
            return;
        }

        // Close menu drawer when clicking a navigation link inside it
        const navLink = e.target.closest('.site-nav__links a');
        if (navLink) {
            toggleNav(true);
        }
    });

    // Close mobile menu on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            toggleNav(true);
        }
    });

    // Close mobile menu if window resized above mobile threshold
    window.addEventListener('resize', function () {
        if (window.innerWidth > 1080) {
            toggleNav(true);
        }
    }, { passive: true });
})();
