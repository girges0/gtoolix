/**
 * GToolix Unified Bilingual Static Page & SEO Generator
 * Architecture: Single shared template / master per page type rendered twice (Arabic unprefixed, English /en/)
 * Fully enforces Scope Lock, Missing-Translation Policy & Complete SEO Metadata Layer
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');

// Ensure directories exist
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Official Google AdSense Tag
const OFFICIAL_ADSENSE_SCRIPT = `    <!-- Google AdSense -->\n    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9332457707004456" crossorigin="anonymous"></script>`;

function ensureOfficialAdSenseInHead(htmlContent) {
    if (!htmlContent) return htmlContent;
    // 1. Remove legacy dynamic loadAdSense functions
    let cleaned = htmlContent.replace(/<!--\s*Google AdSense[^>]*-->\s*<script>\s*\(function\s*\(\)\s*\{[\s\S]*?loadAdSense[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<script>\s*\(function\s*\(\)\s*\{[\s\S]*?loadAdSense[\s\S]*?<\/script>/gi, '');

    // 2. Remove existing static AdSense tags/comments to prevent duplicates
    cleaned = cleaned.replace(/<!--\s*Google AdSense\s*-->\s*/gi, '');
    cleaned = cleaned.replace(/<script\s+async\s+src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-9332457707004456["'][^>]*><\/script>/gi, '');
    cleaned = cleaned.replace(/<script\s+crossorigin=["']anonymous["']\s+async\s+src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-9332457707004456["'][^>]*><\/script>/gi, '');
    cleaned = cleaned.replace(/<script\s+src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-9332457707004456["'][^>]*><\/script>/gi, '');

    // 3. Inject official AdSense script cleanly into <head>
    cleaned = cleaned.replace(/<\/head>/i, `${OFFICIAL_ADSENSE_SCRIPT}\n</head>`);
    return cleaned;
}

function prefixInternalLinksForEnglish(htmlContent) {
    if (!htmlContent) return htmlContent;
    // Replace internal hrefs pointing to site routes that do not already start with /en/
    // Exclude lang-ar-btn and elements marked data-no-prefix
    return htmlContent.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
        if (/id=["']lang-ar-btn["']/i.test(attrs) || /data-no-prefix=["']true["']/i.test(attrs)) {
            return match;
        }
        const updatedAttrs = attrs.replace(/\bhref=["'](\/(?:tools|blog|programs|about|contact|faq|privacy-policy|terms-of-service|cookies-policy|disclaimer|dmca|404)(?:\/[^"'\s>]*|\b|(?=["']))|(?:\/))["']/gi, (hMatch, pathVal) => {
            if (pathVal.startsWith('/en/') || pathVal === '/en') return hMatch;
            if (pathVal === '/') return 'href="/en/"';
            return `href="/en${pathVal}"`;
        });
        return `<a${updatedAttrs}>`;
    });
}

// 1. Load CMS & Fallback Data
function loadJson(file, fallback = []) {
    const fullPath = path.join(DATA_DIR, file);
    if (fs.existsSync(fullPath)) {
        try {
            return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        } catch (e) {
            console.error(`[ERROR] Failed parsing ${file}:`, e);
        }
    }
    return fallback;
}

const toolsData = loadJson('tools.json', []);
const blogData = loadJson('blog.json', []);
const programsData = loadJson('programs.json', []);
const categoriesData = loadJson('categories.json', []);
const siteSettings = loadJson('site-settings.json', {});
const staticPagesData = loadJson('static-pages.json', {});

// 2. Authoritative Missing-Translation Scanner (Correction 1)
const missingTranslations = [];
const missingTranslationsMap = new Map();

function hasArabicCharacters(str) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(str || '');
}

function scanMissingTranslations() {
    missingTranslations.length = 0;
    missingTranslationsMap.clear();

    // Check Tools
    toolsData.forEach(tool => {
        const hasEnName = tool.name && tool.name.trim() && !hasArabicCharacters(tool.name);
        const hasEnDesc = tool.description && tool.description.trim() && !hasArabicCharacters(tool.description);
        const isNotCopy = tool.name !== tool.nameAr && tool.description !== tool.descriptionAr;
        if (!hasEnName || !hasEnDesc || !isNotCopy) {
            const entry = {
                type: 'tool',
                id: tool.id,
                slug: tool.slug,
                urlAr: `/tools/${tool.slug}`,
                urlEn: `/en/tools/${tool.slug}`,
                reason: 'English name/description missing or identical to Arabic'
            };
            missingTranslations.push(entry);
            missingTranslationsMap.set(entry.urlEn, entry);
        }
    });

    // Check Blog Articles
    blogData.forEach(article => {
        if (article.is_published === false) return; // Unpublished drafts are not missing translations
        const hasEnTitle = article.title_en && article.title_en.trim() && !hasArabicCharacters(article.title_en);
        const hasEnContent = article.content_en && article.content_en.trim() && article.content_en.length > 50 && !hasArabicCharacters(article.content_en.substring(0, 100));
        const isNotCopy = article.title_en !== article.title_ar;
        if (!hasEnTitle || !hasEnContent || !isNotCopy) {
            const entry = {
                type: 'article',
                id: article.id,
                slug: article.slug,
                urlAr: `/blog/${article.slug}`,
                urlEn: `/en/blog/${article.slug}`,
                reason: 'English title/content missing or identical to Arabic'
            };
            missingTranslations.push(entry);
            missingTranslationsMap.set(entry.urlEn, entry);
        }
    });

    // Check Programs
    programsData.forEach(prog => {
        if (prog.is_published === false) return;
        const hasEnName = prog.name && prog.name.trim();
        const hasEnDesc = prog.description_en && prog.description_en.trim() && !hasArabicCharacters(prog.description_en);
        if (!hasEnName || !hasEnDesc) {
            const entry = {
                type: 'program',
                id: prog.id,
                slug: prog.slug,
                urlAr: `/programs/${prog.slug}`,
                urlEn: `/en/programs/${prog.slug}`,
                reason: 'English program description missing'
            };
            missingTranslations.push(entry);
            missingTranslationsMap.set(entry.urlEn, entry);
        }
    });

    return missingTranslations;
}

// Run initial scan
scanMissingTranslations();

function isMissingTranslation(urlEn) {
    return missingTranslationsMap.has(urlEn);
}

// 3. Shared SEO Head Meta Builder
function buildSeoHead({
    urlAr,
    urlEn,
    lang,
    title,
    description,
    keywords,
    ogType = 'website',
    ogImage = '/static/img/logo.png',
    hasTranslation = true,
    schemaJson = null
}) {
    const isAr = lang === 'ar';
    const currentUrl = isAr ? `https://www.gtoolix.com${urlAr === '/' ? '/' : urlAr}` : `https://www.gtoolix.com${urlEn}`;
    const canonicalHref = currentUrl;

    let hreflangTags = '';
    if (hasTranslation) {
        const arHref = `https://www.gtoolix.com${urlAr === '/' ? '/' : urlAr}`;
        const enHref = `https://www.gtoolix.com${urlEn}`;
        hreflangTags = `    <link rel="alternate" hreflang="ar" href="${arHref}" />\n    <link rel="alternate" hreflang="en" href="${enHref}" />\n    <link rel="alternate" hreflang="x-default" href="${arHref}" />`;
    } else {
        const arHref = `https://www.gtoolix.com${urlAr === '/' ? '/' : urlAr}`;
        hreflangTags = `    <link rel="alternate" hreflang="ar" href="${arHref}" />\n    <link rel="alternate" hreflang="x-default" href="${arHref}" />`;
    }

    const ogLocale = isAr ? 'ar_EG' : 'en_US';
    const ogLocaleAlt = hasTranslation ? (isAr ? '<meta property="og:locale:alternate" content="en_US">' : '<meta property="og:locale:alternate" content="ar_EG">') : '';

    return `    <!-- ===================== SEO: Primary Meta & Technical SEO ===================== -->
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : ''}
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="author" content="GToolix">
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

    <!-- ===================== SEO: Canonical & Hreflang ===================== -->
    <link rel="canonical" href="${canonicalHref}" />
    <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
${hreflangTags}

    <!-- ===================== SEO: Open Graph ===================== -->
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="GToolix">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${currentUrl}">
    <meta property="og:locale" content="${ogLocale}">
    ${ogLocaleAlt}
    <meta property="og:image" content="https://www.gtoolix.com${ogImage}">

    <!-- ===================== SEO: Twitter Card ===================== -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="https://www.gtoolix.com${ogImage}">
    ${schemaJson ? `\n    <!-- Schema.org JSON-LD -->\n    <script type="application/ld+json">\n    ${typeof schemaJson === 'string' ? schemaJson : JSON.stringify(schemaJson, null, 2)}\n    </script>` : ''}`;
}

// 4. Shared Navbar & Footer Builder
function renderNavbar(lang, urlAr, urlEn, hasTranslation = true) {
    const isAr = lang === 'ar';
    const brandHref = isAr ? '/' : '/en/';
    const toolsHref = isAr ? '/tools' : '/en/tools';
    const blogHref = isAr ? '/blog' : '/en/blog';
    const programsHref = isAr ? '/programs' : '/en/programs';

    // Language switcher link logic
    let langSwitcherHtml = '';
    if (isAr) {
        const enHref = hasTranslation ? urlEn : urlAr;
        langSwitcherHtml = `            <div class="lang-switcher" aria-label="Language Switcher">
                <a href="${enHref}" class="lang-btn" id="lang-en-btn" onclick="try{localStorage.setItem('gtoolix_language','en');localStorage.setItem('siteLang','en');}catch(e){}">EN</a>
                <a href="${urlAr}" class="lang-btn active" id="lang-ar-btn" onclick="try{localStorage.setItem('gtoolix_language','ar');localStorage.setItem('siteLang','ar');}catch(e){}">AR</a>
            </div>`;
    } else {
        langSwitcherHtml = `            <div class="lang-switcher" aria-label="Language Switcher">
                <a href="${urlEn}" class="lang-btn active" id="lang-en-btn" onclick="try{localStorage.setItem('gtoolix_language','en');localStorage.setItem('siteLang','en');}catch(e){}">EN</a>
                <a href="${urlAr}" class="lang-btn" id="lang-ar-btn" onclick="try{localStorage.setItem('gtoolix_language','ar');localStorage.setItem('siteLang','ar');}catch(e){}">AR</a>
            </div>`;
    }

    const navToolsLabel = isAr ? 'الأدوات' : 'Tools';
    const navToolsDesc = isAr ? 'أدوات ذكية وتفاعلية مجانية' : 'Free Interactive Smart Web Tools';
    const navBlogLabel = isAr ? 'المقالات' : 'Articles';
    const navBlogDesc = isAr ? 'شروحات ومقالات حصرية ومفيدة' : 'Guides, Articles & Insights';
    const navProgramsLabel = isAr ? 'البرامج' : 'Programs';
    const navProgramsDesc = isAr ? 'تطبيقات وحلول رقمية جاهزة' : 'Desktop Apps & Software Hub';

    return `    <header class="site-nav" id="site-header">
        <a class="site-nav__brand" href="${brandHref}" aria-label="GToolix Home">
            <span class="site-nav__brand-mark">
                <picture>
                    <source srcset="/static/img/logo.webp" type="image/webp">
                    <img src="/static/img/logo.webp" alt="GToolix Logo" class="site-nav__logo-img" width="38"
                        height="38" loading="eager" fetchpriority="high">
                </picture>
            </span>
            <span>GToolix</span>
        </a>
        <nav class="site-nav__links" id="site-nav-links" aria-label="Main Navigation">
            <a href="${toolsHref}" class="nav-item-link" data-nav="tools">
                <span class="nav-item-icon nav-icon-tools">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect></svg>
                </span>
                <span class="nav-item-body">
                    <span class="nav-item-label" data-i18n="common.navTools">${navToolsLabel}</span>
                    <span class="nav-item-desc" data-i18n="common.navToolsDesc">${navToolsDesc}</span>
                </span>
                <span class="nav-item-chevron" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
            </a>
            <a href="${blogHref}" class="nav-item-link" data-nav="blog">
                <span class="nav-item-icon nav-icon-blog">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><line x1="10" y1="6" x2="16" y2="6"></line><line x1="10" y1="10" x2="16" y2="10"></line></svg>
                </span>
                <span class="nav-item-body">
                    <span class="nav-item-label" data-i18n="common.navBlog">${navBlogLabel}</span>
                    <span class="nav-item-desc" data-i18n="common.navBlogDesc">${navBlogDesc}</span>
                </span>
                <span class="nav-item-chevron" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
            </a>
            <a href="${programsHref}" class="nav-item-link" data-nav="programs">
                <span class="nav-item-icon nav-icon-programs">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M8 10l3 3-3 3"></path><line x1="13" y1="16" x2="17" y2="16"></line></svg>
                </span>
                <span class="nav-item-body">
                    <span class="nav-item-label" data-i18n="common.navPrograms">${navProgramsLabel}</span>
                    <span class="nav-item-desc" data-i18n="common.navProgramsDesc">${navProgramsDesc}</span>
                </span>
                <span class="nav-item-chevron" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
            </a>
        </nav>
        <div class="site-nav__right">
            <button class="theme-toggle-btn" id="theme-toggle-btn" type="button" aria-label="Toggle theme">
                <span class="theme-toggle-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                </span>
            </button>
${langSwitcherHtml}
            <button class="nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false"
                aria-controls="site-nav-links" onclick="toggleNav()">
                <span></span><span></span><span></span>
            </button>
        </div>
    </header>
    <div class="nav-backdrop" id="nav-backdrop" onclick="toggleNav(true)"></div>`;
}

function renderFooter(lang) {
    const isAr = lang === 'ar';
    const brandHref = isAr ? '/' : '/en/';
    const pfx = isAr ? '' : '/en';

    const footerNote = isAr
        ? 'GToolix مخصص للاستخدام الشخصي مع محتوى تملك حقوقه أو مرخّص للاستخدام العام.'
        : 'GToolix is intended for personal use with content you own or licensed for public use.';

    const footerToolsTitle = isAr ? 'الأدوات المميزة' : 'Featured Tools';
    const footerSectionsTitle = isAr ? 'أقسام المنصة' : 'Platform Sections';
    const footerTrustTitle = isAr ? 'عن المنصة والثقة' : 'About Platform & Trust';
    const footerLegalTitle = isAr ? 'الخصوصية والشروط' : 'Privacy & Terms';

    const toolQr = isAr ? 'مولد رمز QR' : 'QR Code Generator';
    const toolThumb = isAr ? 'تحميل الصور المصغرة لليوتيوب' : 'YouTube Thumbnail Downloader';
    const toolRecorder = isAr ? 'مسجل الشاشة' : 'Screen Recorder';
    const toolCompressor = isAr ? 'ضاغط ومحوّل الصور الرقمي' : 'Image Compressor & Converter';

    const secTools = isAr ? 'الأدوات' : 'Tools';
    const secBlog = isAr ? 'المقالات' : 'Articles';
    const secPrograms = isAr ? 'البرامج' : 'Programs';

    const linkAbout = isAr ? 'عن المنصة' : 'About Us';
    const linkFaq = isAr ? 'الأسئلة الشائعة' : 'FAQ';
    const linkContact = isAr ? 'اتصل بنا' : 'Contact Us';

    const linkPrivacy = isAr ? 'سياسة الخصوصية' : 'Privacy Policy';
    const linkTerms = isAr ? 'شروط الاستخدام' : 'Terms of Service';
    const linkCookies = isAr ? 'سياسة الكوكيز' : 'Cookies Policy';
    const linkDisclaimer = isAr ? 'إخلاء المسؤولية' : 'Disclaimer';
    const linkDmca = isAr ? 'حقوق النشر (DMCA)' : 'Copyright (DMCA)';

    return `    <footer>
        <div class="footer-inner">
            <div class="footer-grid">
                <div class="footer-col footer-col--brand">
                    <a class="footer-brand" href="${brandHref}" aria-label="GToolix Home">
                        <span class="site-nav__brand-mark">
                            <picture>
                                <source srcset="/static/img/logo.webp" type="image/webp">
                                <img src="/static/img/logo.webp" alt="GToolix Logo" class="site-nav__logo-img" width="38" height="38" loading="lazy">
                            </picture>
                        </span>
                        <span>GToolix</span>
                    </a>
                    <p class="footer-note">${footerNote}</p>
                </div>

                <div class="footer-col">
                    <h4 class="footer-col__title">${footerToolsTitle}</h4>
                    <nav class="footer-links">
                        <a href="${pfx}/tools/qr-code-generator">${toolQr}</a>
                        <a href="${pfx}/tools/youtube-thumbnail-downloader">${toolThumb}</a>
                        <a href="${pfx}/tools/screen-recorder-studio">${toolRecorder}</a>
                        <a href="${pfx}/tools/image-compressor">${toolCompressor}</a>
                    </nav>
                </div>

                <div class="footer-col">
                    <h4 class="footer-col__title">${footerSectionsTitle}</h4>
                    <nav class="footer-links">
                        <a href="${pfx}/tools">${secTools}</a>
                        <a href="${pfx}/blog">${secBlog}</a>
                        <a href="${pfx}/programs">${secPrograms}</a>
                    </nav>
                </div>

                <div class="footer-col">
                    <h4 class="footer-col__title">${footerTrustTitle}</h4>
                    <nav class="footer-links">
                        <a href="${pfx}/about">${linkAbout}</a>
                        <a href="${pfx}/faq">${linkFaq}</a>
                        <a href="${pfx}/contact">${linkContact}</a>
                    </nav>
                </div>

                <div class="footer-col">
                    <h4 class="footer-col__title">${footerLegalTitle}</h4>
                    <nav class="footer-links">
                        <a href="${pfx}/privacy-policy">${linkPrivacy}</a>
                        <a href="${pfx}/terms-of-service">${linkTerms}</a>
                        <a href="${pfx}/cookies-policy">${linkCookies}</a>
                        <a href="${pfx}/disclaimer">${linkDisclaimer}</a>
                        <a href="${pfx}/dmca">${linkDmca}</a>
                    </nav>
                </div>
            </div>
            <div class="footer-bottom-bar">
                <p>&copy; 2026 GToolix. All rights reserved.</p>
            </div>
        </div>
    </footer>`;
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// 5. Page Generators

// ==========================================
// A. HOMEPAGE GENERATOR
// ==========================================
function generateHomePage(lang) {
    const isAr = lang === 'ar';
    const templatePath = path.join(TEMPLATES_DIR, 'home.html');
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
    }

    const tpl = fs.readFileSync(templatePath, 'utf8');

    const title = isAr
        ? 'GToolix – أدوات ويب تفاعلية مجانية، برامج ومقالات تقنية'
        : 'GToolix – Free Online Web Tools, Software & Guides';

    const description = isAr
        ? 'منصة GToolix المتكاملة: استوديو أدوات ويب تفاعلية فائقة الأداء، مكتبة برامج وتطبيقات مكتبية موثوقة، ومقالات ودلائل متخصصة — مجاناً 100% وبأعلى معايير الخصوصية.'
        : 'GToolix platform: High-performance interactive online tools, trusted downloadable software library, and insightful articles & guides — 100% free with privacy first.';

    const keywords = isAr
        ? 'online tools, free tools, web utilities, software library, articles, GToolix, أدوات مجانية, أدوات ويب, برامج كمبيوتر, مقالات, شروحات, أدوات إنتاجية'
        : 'online tools, free tools, web utilities, software library, articles, guides, GToolix, qr generator, youtube thumbnail downloader, screen recorder, image compressor';

    const schemaJson = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": "https://www.gtoolix.com/#website",
                "name": "GToolix",
                "url": "https://www.gtoolix.com/",
                "description": isAr ? description : "Free Online Tools: QR Code Generator, YouTube Thumbnail Downloader, Screen Recorder Studio, and Image Compressor.",
                "inLanguage": isAr ? ["ar", "en"] : ["en", "ar"]
            },
            {
                "@type": "Organization",
                "@id": "https://www.gtoolix.com/#organization",
                "name": "GToolix",
                "url": "https://www.gtoolix.com/",
                "logo": "https://www.gtoolix.com/static/img/logo.png"
            }
        ]
    };

    const seoHead = buildSeoHead({
        urlAr: '/',
        urlEn: '/en/',
        lang,
        title,
        description,
        keywords,
        ogType: 'website',
        ogImage: '/static/img/logo.png',
        hasTranslation: true
    });

    const jsonLdScript = `    <script type="application/ld+json">\n${JSON.stringify(schemaJson, null, 4)}\n    </script>`;

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/', '/en/', true);
    const siteFooter = renderFooter(lang);

    const pfx = isAr ? '' : '/en';
    const arrow = isAr ? '←' : '→';

    // Hero Section
    const heroBadge = isAr ? 'أدوات أونلاين وحلول رقمية' : 'Online Tools & Digital Solutions';
    const heroTitleAr = 'كل أدواتك <span class="gt-flip-word" tabindex="0" role="button" aria-label="الرقمية"><span class="gt-flip-inner"><span class="gt-flip-front">الرقمية</span><span class="gt-flip-back">المجانية</span></span><span class="gt-flip-glow" aria-hidden="true"></span><span class="gt-flip-sparkles" aria-hidden="true"><span class="gt-sparkle s1"></span><span class="gt-sparkle s2"></span><span class="gt-sparkle s3"></span></span></span>.<br>في مكان واحد.';
    const heroTitleEn = 'All Your <span class="gt-flip-word" tabindex="0" role="button" aria-label="Digital"><span class="gt-flip-inner"><span class="gt-flip-front">Digital</span><span class="gt-flip-back">Free</span></span><span class="gt-flip-glow" aria-hidden="true"></span><span class="gt-flip-sparkles" aria-hidden="true"><span class="gt-sparkle s1"></span><span class="gt-sparkle s2"></span><span class="gt-sparkle s3"></span></span></span> Tools.<br>In One Place.';
    const heroTitle = isAr ? heroTitleAr : heroTitleEn;
    const heroSub = isAr
        ? 'اكتشف أدوات بسيطة وسريعة وعملية لمهامك الرقمية اليومية.'
        : 'Discover simple, fast, and practical tools for your daily digital workflows.';

    const heroCtaToolsHref = `${pfx}/tools`;
    const heroCtaToolsLabel = isAr ? 'استكشف الأدوات ←' : 'Explore Tools →';
    const heroCtaBlogHref = `${pfx}/blog`;
    const heroCtaBlogLabel = isAr ? 'استكشف المقالات ←' : 'Explore Articles →';

    // Popular Tools Section
    const popularToolsTitle = isAr ? 'أشهر الأدوات' : 'Popular Tools';

    const popularToolsGrid = `                        <!-- Tool 1: QR Code Generator -->
                        <a href="${pfx}/tools/qr-code-generator" class="gt-tool-tile gt-tool-tile--qr" aria-label="${isAr ? 'مولد رمز QR' : 'QR Code Generator'}">
                            <div class="gt-tool-tile-top">
                                <div class="gt-tool-icon-wrap icon-qr">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                        <path d="M14 14h3v3h-3z" />
                                        <path d="M18 18h3v3h-3z" />
                                        <path d="M14 18h3v3h-3z" />
                                        <path d="M18 14h3v3h-3z" />
                                    </svg>
                                </div>
                                <span class="gt-tool-badge">SVG / PNG</span>
                            </div>
                            <h3 class="gt-tool-tile-title">${isAr ? 'مولد رمز QR' : 'QR Code Generator'}</h3>
                            <p class="gt-tool-tile-desc">${isAr ? 'توليد وتخصيص أكواد QR عالية الدقة فورياً بدون علامة مائية.' : 'Generate & customize high-res vector QR codes instantly with zero watermark.'}</p>
                            <span class="gt-tool-tile-link">
                                <span>${isAr ? 'استكشف الأداة' : 'Explore Tool'}</span>
                                <span class="dir-arrow">${arrow}</span>
                            </span>
                        </a>

                        <!-- Tool 2: YouTube Thumbnail Downloader -->
                        <a href="${pfx}/tools/youtube-thumbnail-downloader" class="gt-tool-tile gt-tool-tile--thumb" aria-label="${isAr ? 'تحميل الصور المصغرة لليوتيوب' : 'YouTube Thumbnail Downloader'}">
                            <div class="gt-tool-tile-top">
                                <div class="gt-tool-icon-wrap icon-thumb">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"></polygon>
                                    </svg>
                                </div>
                                <span class="gt-tool-badge">4K / HD</span>
                            </div>
                            <h3 class="gt-tool-tile-title">${isAr ? 'تحميل الصور المصغرة لليوتيوب' : 'YouTube Thumbnail Downloader'}</h3>
                            <p class="gt-tool-tile-desc">${isAr ? 'استخراج وتحميل صور أغلفة فيديوهات يوتيوب بدقة HD و 4K.' : 'Extract & download YouTube video cover thumbnails in HD and 4K.'}</p>
                            <span class="gt-tool-tile-link">
                                <span>${isAr ? 'استكشف الأداة' : 'Explore Tool'}</span>
                                <span class="dir-arrow">${arrow}</span>
                            </span>
                        </a>

                        <!-- Tool 3: Screen Recorder -->
                        <a href="${pfx}/tools/screen-recorder-studio" class="gt-tool-tile gt-tool-tile--recorder" aria-label="${isAr ? 'مسجل الشاشة' : 'Screen Recorder'}">
                            <div class="gt-tool-tile-top">
                                <div class="gt-tool-icon-wrap icon-rec">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                    </svg>
                                </div>
                                <span class="gt-tool-badge">HD 60FPS</span>
                            </div>
                            <h3 class="gt-tool-tile-title">${isAr ? 'مسجل الشاشة' : 'Screen Recorder'}</h3>
                            <p class="gt-tool-tile-desc">${isAr ? 'تسجيل الشاشة والصوت والكاميرا بجودة استوديو مباشرة من المتصفح.' : 'Record screen, audio, and webcam in studio quality directly in your browser.'}</p>
                            <span class="gt-tool-tile-link">
                                <span>${isAr ? 'استكشف الأداة' : 'Explore Tool'}</span>
                                <span class="dir-arrow">${arrow}</span>
                            </span>
                        </a>

                        <!-- Tool 4: Image Compressor & Converter -->
                        <a href="${pfx}/tools/image-compressor" class="gt-tool-tile gt-tool-tile--compressor" aria-label="${isAr ? 'ضاغط ومحوّل الصور' : 'Image Compressor & Converter'}">
                            <div class="gt-tool-tile-top">
                                <div class="gt-tool-icon-wrap icon-compressor">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </div>
                                <span class="gt-tool-badge">JPG / PNG / WebP</span>
                            </div>
                            <h3 class="gt-tool-tile-title">${isAr ? 'ضاغط ومحوّل الصور' : 'Image Compressor & Converter'}</h3>
                            <p class="gt-tool-tile-desc">${isAr ? 'ضغط وتحويل صور JPG و PNG و WebP و GIF بجودة فائقة مباشرة في متصفحك بدون رفع أي ملفات.' : 'Compress and convert JPG, PNG, WebP, and GIF images directly in your browser with zero uploads.'}</p>
                            <span class="gt-tool-tile-link">
                                <span>${isAr ? 'استكشف الأداة' : 'Explore Tool'}</span>
                                <span class="dir-arrow">${arrow}</span>
                            </span>
                        </a>

                        <!-- 5th Card: View All Tools -->
                        <a href="${pfx}/tools" class="gt-tool-tile gt-tool-tile--all" aria-label="${isAr ? 'عرض جميع الأدوات' : 'View All Tools'}">
                            <div class="gt-tool-all-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                </svg>
                            </div>
                            <span class="gt-tool-all-label">
                                <span>${isAr ? 'عرض جميع الأدوات' : 'View All Tools'}</span>
                                <span class="dir-arrow">${arrow}</span>
                            </span>
                        </a>`;

    // Platform Sections
    const sectionsKicker = isAr ? 'استكشف GToolix' : 'Explore GToolix';
    const sectionsGrid = `                <!-- Section 1: Online Tools -->
                <a href="${pfx}/tools" class="gt-section-card stagger-item stagger-delay-1" aria-label="${isAr ? 'أدوات أونلاين' : 'Online Tools'}">
                    <div class="gt-section-icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                    </div>
                    <h3 class="gt-section-title">${isAr ? 'أدوات أونلاين' : 'Online Tools'}</h3>
                    <p class="gt-section-desc">${isAr ? 'أدوات مفيدة تعمل من المتصفح للمهام الرقمية اليومية.' : 'Useful browser-based tools for your daily digital workflows.'}</p>
                    <span class="gt-section-cta">
                        <span>${isAr ? 'استكشف الأدوات' : 'Explore Tools'} ${arrow}</span>
                    </span>
                </a>

                <!-- Section 2: Blog -->
                <a href="${pfx}/blog" class="gt-section-card stagger-item stagger-delay-2" aria-label="${isAr ? 'المقالات' : 'Articles'}">
                    <div class="gt-section-icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    <h3 class="gt-section-title">${isAr ? 'المقالات' : 'Articles'}</h3>
                    <p class="gt-section-desc">${isAr ? 'أدلة وشروحات ومقالات مفيدة عن الأدوات الرقمية والتكنولوجيا.' : 'Guides, walkthroughs, and practical insights on tools and tech.'}</p>
                    <span class="gt-section-cta">
                        <span>${isAr ? 'تصفح المقالات' : 'Browse Articles'} ${arrow}</span>
                    </span>
                </a>

                <!-- Section 3: Programs -->
                <a href="${pfx}/programs" class="gt-section-card stagger-item stagger-delay-3" aria-label="${isAr ? 'البرامج' : 'Programs'}">
                    <div class="gt-section-icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <line x1="12" y1="11" x2="12" y2="17"></line>
                            <polyline points="9 14 12 17 15 14"></polyline>
                        </svg>
                    </div>
                    <h3 class="gt-section-title">${isAr ? 'البرامج' : 'Programs'}</h3>
                    <p class="gt-section-desc">${isAr ? 'اكتشف البرامج القابلة للتنزيل والأدوات الرقمية المفيدة.' : 'Discover downloadable software and essential desktop utilities.'}</p>
                    <span class="gt-section-cta">
                        <span>${isAr ? 'اكتشف البرامج' : 'Explore Programs'} ${arrow}</span>
                    </span>
                </a>`;

    // Feature Blocks
    const featureBlocks = `            <!-- FEATURE BLOCK 1 — ONLINE TOOLS (Text Left / Visual Right) -->
            <div class="gt-feature-block gt-feature-block--tools reveal-on-scroll" data-feature="tools">
                <div class="gt-feature-text">
                    <h2 class="gt-feature-heading gt-heading">
                        ${isAr ? 'أدوات قوية، بطريقة بسيطة' : 'Powerful Tools, Built Simply'}
                    </h2>
                    <p class="gt-feature-p">
                        ${isAr ? 'استخدم أدوات أونلاين عملية مباشرة من متصفحك بدون تعقيد غير ضروري.' : 'Use practical web tools right from your browser without unnecessary friction or complexity.'}
                    </p>
                    <ul class="gt-checklist">
                        <li class="gt-checklist-item stagger-item stagger-delay-1">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'أدوات سريعة تعمل من المتصفح' : 'Fast browser-based performance'}</span>
                        </li>
                        <li class="gt-checklist-item stagger-item stagger-delay-2">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'واجهات بسيطة وسهلة الاستخدام' : 'Clean and intuitive user interfaces'}</span>
                        </li>
                        <li class="gt-checklist-item stagger-item stagger-delay-3">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'مفيدة للمهام الرقمية اليومية' : 'Built for daily productivity tasks'}</span>
                        </li>
                        <li class="gt-checklist-item stagger-item stagger-delay-4">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'دعم العربية والإنجليزية' : 'Full English & Arabic support'}</span>
                        </li>
                    </ul>
                    <a href="${pfx}/tools" class="gt-btn gt-btn-outline gt-magnetic-btn" aria-label="${isAr ? 'استكشف الأدوات' : 'Explore Tools'}">
                        <span>${isAr ? 'استكشف الأدوات ←' : 'Explore Tools →'}</span>
                    </a>
                </div>

                <div class="gt-feature-visual-wrap">
                    <div class="gt-floating-pill gt-parallax-badge">
                        <span class="gt-pill-pulse-dot"></span>
                        <span>${isAr ? 'خصوصية محلية 100%' : '100% Local Privacy'}</span>
                    </div>
                    <div class="gt-mockup-card">
                        <div class="gt-highlight-tile">
                            <div class="gt-tool-icon-wrap gt-parallax-icon icon-qr">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                    <path d="M14 14h3v3h-3z" />
                                    <path d="M18 18h3v3h-3z" />
                                    <path d="M14 18h3v3h-3z" />
                                    <path d="M18 14h3v3h-3z" />
                                </svg>
                            </div>
                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="font-weight: 700; font-size: 0.95rem; color: var(--gt-text);">${isAr ? 'مولد رمز QR' : 'QR Code Generator'}</div>
                                <div style="font-size: 0.8rem; color: var(--gt-text-muted);">${isAr ? 'محرك متجهي يعمل في المتصفح' : 'Client-side vector QR engine'}</div>
                            </div>
                            <span class="gt-parallax-badge" style="font-size: 0.75rem; color: #38BDF8; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.2rem 0.65rem; border-radius: 9999px; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;">${isAr ? 'نشط' : 'Active'}</span>
                        </div>

                        <div class="gt-sub-tile gt-parallax-sub">
                            <div class="gt-tool-icon-wrap gt-parallax-icon icon-thumb">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"></polygon>
                                </svg>
                            </div>
                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="font-weight: 700; font-size: 0.95rem; color: var(--gt-text);">${isAr ? 'تحميل الصور المصغرة لليوتيوب' : 'YouTube Thumbnail Downloader'}</div>
                                <div style="font-size: 0.8rem; color: var(--gt-text-muted);">${isAr ? 'بدون أي فقدان للجودة' : 'Lossless HD & 4K quality'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FEATURE BLOCK 2 — BLOG (Visual Left / Text Right) -->
            <div class="gt-feature-block gt-feature-block--reverse gt-feature-block--blog reveal-on-scroll" data-feature="blog">
                <div class="gt-feature-text">
                    <h2 class="gt-feature-heading gt-heading">
                        ${isAr ? 'تعلّم المزيد مع GToolix' : 'Learn & Explore with GToolix'}
                    </h2>
                    <p class="gt-feature-p">
                        ${isAr ? 'استكشف الأدلة والشروحات والمقالات المفيدة حول الأدوات الرقمية والتكنولوجيا والحلول العملية.' : 'Explore step-by-step guides, tutorials, and practical articles on web tools and digital solutions.'}
                    </p>
                    <ul class="gt-checklist">
                        <li class="gt-checklist-item stagger-item stagger-delay-1">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'أدلة عملية' : 'Step-by-step guides'}</span>
                        </li>
                        <li class="gt-checklist-item stagger-item stagger-delay-2">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'شروحات مفيدة' : 'Actionable tutorials'}</span>
                        </li>
                        <li class="gt-checklist-item stagger-item stagger-delay-3">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'مقالات ودلائل شاملة' : 'Articles & guides'}</span>
                        </li>
                        <li class="gt-checklist-item stagger-item stagger-delay-4">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'نصائح رقمية مفيدة' : 'Useful productivity tips'}</span>
                        </li>
                    </ul>
                    <a href="${pfx}/blog" class="gt-btn gt-btn-outline gt-magnetic-btn" aria-label="${isAr ? 'تصفح المقالات' : 'Browse Articles'}">
                        <span>${isAr ? 'تصفح المقالات ←' : 'Browse Articles →'}</span>
                    </a>
                </div>

                <div class="gt-feature-visual-wrap">
                    <div class="gt-floating-pill gt-parallax-badge">
                        <span class="gt-pill-pulse-dot" style="background: #A855F7; box-shadow: 0 0 8px #A855F7;"></span>
                        <span>${isAr ? 'مقالات متجددة' : 'Regular Updates'}</span>
                    </div>
                    <div class="gt-mockup-card">
                        <div class="gt-highlight-tile">
                            <div class="gt-tool-icon-wrap gt-parallax-icon" style="background: rgba(168, 85, 247, 0.2); color: #C084FC; border: 1px solid rgba(168, 85, 247, 0.4);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                </svg>
                            </div>
                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="font-weight: 700; font-size: 0.95rem; color: var(--gt-text);">${isAr ? 'أدوات الويب الحديثة والخصوصية' : 'Modern Web Tools & Privacy'}</div>
                                <div style="font-size: 0.8rem; color: var(--gt-text-muted);">${isAr ? 'أدلة تفصيلية وتطبيقات عملية' : 'Detailed guides & real applications'}</div>
                            </div>
                            <span class="gt-parallax-badge" style="font-size: 0.75rem; color: #C084FC; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); padding: 0.2rem 0.65rem; border-radius: 9999px; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;">${isAr ? 'دليل' : 'Guide'}</span>
                        </div>

                        <div class="gt-sub-tile gt-parallax-sub" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
                            <div class="gt-parallax-tags" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <span style="font-size: 0.75rem; background: rgba(168, 85, 247, 0.12); color: #C084FC; border: 1px solid rgba(168, 85, 247, 0.25); padding: 0.2rem 0.5rem; border-radius: 6px;"># AI</span>
                                <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.12); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.25); padding: 0.2rem 0.5rem; border-radius: 6px;"># Privacy</span>
                                <span style="font-size: 0.75rem; background: rgba(56, 189, 248, 0.12); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.25); padding: 0.2rem 0.5rem; border-radius: 6px;"># WebTools</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FEATURE BLOCK 3 — PROGRAMS (Text Left / Visual Right) -->
            <div class="gt-feature-block gt-feature-block--programs reveal-on-scroll" data-feature="programs">
                <div class="gt-feature-text">
                    <h2 class="gt-feature-heading gt-heading">
                        ${isAr ? 'اكتشف برامج GToolix' : 'Discover GToolix Software'}
                    </h2>
                    <p class="gt-feature-p">
                        ${isAr ? 'استكشف البرامج القابلة للتنزيل والبرمجيات المفيدة المصممة للاحتياجات الرقمية العملية.' : 'Explore downloadable applications and utilities tailored for offline digital needs.'}
                    </p>
                    <ul class="gt-checklist">
                        <li class="gt-checklist-item stagger-item stagger-delay-1">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'برامج قابلة للتنزيل' : 'Downloadable applications'}</span>
                        </li>
                        <li class="gt-checklist-item stagger-item stagger-delay-2">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'برمجيات مفيدة' : 'Handy utilities'}</span>
                        </li>
                        <li class="gt-checklist-item stagger-item stagger-delay-3">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'معلومات واضحة عن البرامج' : 'Clear documentation & specs'}</span>
                        </li>
                        <li class="gt-checklist-item stagger-item stagger-delay-4">
                            <span class="gt-check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${isAr ? 'مكتبة برامج منظمة' : 'Organized software library'}</span>
                        </li>
                    </ul>
                    <a href="${pfx}/programs" class="gt-btn gt-btn-outline gt-magnetic-btn" aria-label="${isAr ? 'استكشف البرامج' : 'Explore Programs'}">
                        <span>${isAr ? 'استكشف البرامج ←' : 'Explore Programs →'}</span>
                    </a>
                </div>

                <div class="gt-feature-visual-wrap">
                    <div class="gt-floating-pill gt-parallax-badge">
                        <span class="gt-pill-pulse-dot" style="background: #22C55E; box-shadow: 0 0 8px #22C55E;"></span>
                        <span>${isAr ? 'برامج مفحوصة' : 'Verified Software'}</span>
                    </div>
                    <div class="gt-mockup-card">
                        <div class="gt-highlight-tile">
                            <div class="gt-tool-icon-wrap gt-parallax-icon" style="background: rgba(34, 197, 94, 0.2); color: #4ADE80; border: 1px solid rgba(34, 197, 94, 0.4);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="font-weight: 700; font-size: 0.95rem; color: var(--gt-text);">${isAr ? 'برمجيات وأدوات للعمل بدون إنترنت' : 'Offline Software & Utilities'}</div>
                                <div style="font-size: 0.8rem; color: var(--gt-text-muted);">${isAr ? 'روابط تحميل مباشرة وموثوقة' : 'Direct & verified download links'}</div>
                            </div>
                            <span class="gt-parallax-badge" style="font-size: 0.75rem; color: #4ADE80; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); padding: 0.2rem 0.65rem; border-radius: 9999px; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;">${isAr ? 'مفحوص' : 'Verified'}</span>
                        </div>

                        <div class="gt-sub-tile gt-parallax-sub">
                            <div class="gt-tool-icon-wrap gt-parallax-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="font-weight: 700; font-size: 0.95rem; color: var(--gt-text);">${isAr ? 'فحص أمني شامل ونظيف' : 'Clean & Secure Scan'}</div>
                                <div style="font-size: 0.8rem; color: var(--gt-text-muted);">${isAr ? 'خالٍ من أي برامج إضافية' : 'No adware or bloatware'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

    const notFoundTitle = isAr ? 'الصفحة غير موجودة' : 'Page Not Found';
    const notFoundDesc = isAr ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.' : 'Sorry, the page you are looking for does not exist or has been moved.';
    const notFoundHomeBtn = isAr ? 'الرئيسية' : 'Home';
    const notFoundToolsBtn = isAr ? 'جميع الأدوات' : 'All Tools';

    let rendered = tpl
        .replace(/<!--HTML_TAG-->/g, htmlTag)
        .replace(/<!--SEO_HEAD-->/g, seoHead)
        .replace(/<!--JSON_LD-->/g, jsonLdScript)
        .replace(/<!--SITE_NAV-->/g, siteNav)
        .replace(/<!--HERO_BADGE-->/g, heroBadge)
        .replace(/<!--HERO_TITLE-->/g, heroTitle)
        .replace(/<!--HERO_SUB-->/g, heroSub)
        .replace(/<!--HERO_CTA_TOOLS_HREF-->/g, heroCtaToolsHref)
        .replace(/<!--HERO_CTA_TOOLS_LABEL-->/g, heroCtaToolsLabel)
        .replace(/<!--HERO_CTA_BLOG_HREF-->/g, heroCtaBlogHref)
        .replace(/<!--HERO_CTA_BLOG_LABEL-->/g, heroCtaBlogLabel)
        .replace(/<!--POPULAR_TOOLS_TITLE-->/g, popularToolsTitle)
        .replace(/<!--POPULAR_TOOLS_GRID-->/g, popularToolsGrid)
        .replace(/<!--SECTIONS_KICKER-->/g, sectionsKicker)
        .replace(/<!--SECTIONS_GRID-->/g, sectionsGrid)
        .replace(/<!--FEATURE_BLOCKS-->/g, featureBlocks)
        .replace(/<!--NOT_FOUND_TITLE-->/g, notFoundTitle)
        .replace(/<!--NOT_FOUND_DESC-->/g, notFoundDesc)
        .replace(/<!--BRAND_HREF-->/g, isAr ? '/' : '/en/')
        .replace(/<!--NOT_FOUND_HOME_BTN-->/g, notFoundHomeBtn)
        .replace(/<!--TOOLS_HREF-->/g, `${pfx}/tools`)
        .replace(/<!--NOT_FOUND_TOOLS_BTN-->/g, notFoundToolsBtn)
        .replace(/<!--DEFAULT_LANG-->/g, isAr ? 'ar' : 'en')
        .replace(/<!--SITE_FOOTER-->/g, siteFooter);

    rendered = ensureOfficialAdSenseInHead(rendered);
    const outPath = isAr ? path.join(ROOT_DIR, 'index.html') : path.join(ROOT_DIR, 'en', 'index.html');
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log(`[GEN] Generated Home: ${outPath}`);
}

// ==========================================
// B. TOOLS DIRECTORY GENERATOR
// ==========================================
function generateToolsIndexPage(lang) {
    const isAr = lang === 'ar';
    const templatePath = path.join(TEMPLATES_DIR, 'tools-index.html');
    const tpl = fs.readFileSync(templatePath, 'utf8');

    const title = isAr
        ? 'جميع الأدوات الرقمية المجانية أونلاين | GToolix'
        : 'All Free Online Web Tools Directory | GToolix';

    const description = isAr
        ? 'مكتبة شاملة للأدوات الرقمية المجانية: توليد أكواد QR، استخراج صور يوتيوب، تسجيل الشاشة، وضغط الصور — بدون تسجيل وبأعلى سرعة.'
        : 'Explore GToolix directory of free online tools: QR Code Generator, YouTube Thumbnail Grabber, Screen Recorder Studio, and Image Compressor.';

    const keywords = isAr
        ? 'أدوات مجانية, مكتبة الأدوات, توليد QR, تنزيل صور يوتيوب, مسجل الشاشة, ضغط الصور, GToolix'
        : 'free online tools, web utilities directory, qr generator, youtube thumbnail downloader, screen recorder, image compressor, GToolix';

    const schemaJson = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "description": description,
        "url": isAr ? "https://www.gtoolix.com/tools" : "https://www.gtoolix.com/en/tools",
        "publisher": {
            "@type": "Organization",
            "name": "GToolix",
            "url": "https://www.gtoolix.com",
            "logo": "https://www.gtoolix.com/static/img/logo.webp"
        }
    };

    const seoHead = buildSeoHead({
        urlAr: '/tools',
        urlEn: '/en/tools',
        lang,
        title,
        description,
        keywords,
        ogType: 'website',
        ogImage: '/static/img/logo.png',
        hasTranslation: true,
        schemaJson
    });

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/tools', '/en/tools', true);
    const siteFooter = renderFooter(lang);

    const pfx = isAr ? '' : '/en';

    // Tool Cards
    const toolsCardsHtml = toolsData.map(tool => {
        const name = isAr ? (tool.nameAr || tool.name) : (tool.name || tool.nameAr);
        const desc = isAr ? (tool.descriptionAr || tool.description) : (tool.description || tool.descriptionAr);
        const badge = isAr ? (tool.badgeAr || tool.badge || '') : (tool.badge || tool.badgeAr || '');
        const slug = tool.slug;
        const icon = tool.icon || 'qr';
        const catSlug = tool.category || 'utilities';

        let iconSvg = '';
        let iconClass = `icon-${icon}`;
        if (icon === 'qr') {
            iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 14h3v3h-3z" /><path d="M18 18h3v3h-3z" /><path d="M14 18h3v3h-3z" /><path d="M18 14h3v3h-3z" /></svg>`;
        } else if (icon === 'youtube' || icon === 'thumb') {
            iconClass = 'icon-thumb';
            iconSvg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"></polygon></svg>`;
        } else if (icon === 'recorder' || icon === 'rec') {
            iconClass = 'icon-rec';
            iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
        } else if (icon === 'compressor') {
            iconClass = 'icon-compressor';
            iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
        } else {
            iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`;
        }

        const ctaText = isAr ? 'فتح الأداة' : 'Open tool';
        const keywordsAttr = `${name} ${desc} ${slug} ${catSlug}`.toLowerCase();

        return `            <a href="${pfx}/tools/${slug}" class="tool-card reveal in-view" data-category="${catSlug}" data-keywords="${keywordsAttr}">
                ${badge ? `<span class="tool-card__badge">${badge}</span>` : ''}
                <div class="tool-card__icon ${iconClass}">
                    ${iconSvg}
                </div>
                <h3>${escapeHtml(name)}</h3>
                <p>${escapeHtml(desc)}</p>
                <span class="tool-card__cta">
                    <span>${ctaText}</span>
                    <svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </span>
            </a>`;
    }).join('\n\n');

    let rendered = tpl
        .replace(/<!--HTML_TAG-->/g, htmlTag)
        .replace(/<!--SEO_HEAD-->/g, seoHead)
        .replace(/<!--SITE_NAV-->/g, siteNav)
        .replace(/<!--BRAND_HREF-->/g, isAr ? '/' : '/en/')
        .replace(/<!--BREADCRUMB_HOME-->/g, isAr ? 'الرئيسية' : 'Home')
        .replace(/<!--BREADCRUMB_TOOLS-->/g, isAr ? 'الأدوات' : 'Tools')
        .replace(/<!--TOOLS_KICKER-->/g, isAr ? 'مكتبة الأدوات' : 'The Toolbox')
        .replace(/<!--TOOLS_H1-->/g, isAr ? 'جميع الأدوات الرقمية المجانية' : 'All Free Online Tools')
        .replace(/<!--TOOLS_LEAD-->/g, isAr ? 'أدوات عالية الأداء ومصممة بعناية لتعمل بالكامل في متصفحك — بدون تسجيل وبدون علامات مائية وبأعلى سرعة ممكنة.' : 'High-performance tools built to execute directly inside your browser — zero accounts, zero watermarks, and maximum processing speed.')
        .replace(/<!--SEARCH_PLACEHOLDER-->/g, isAr ? 'ابحث في الأدوات...' : 'Search tools...')
        .replace(/<!--TOTAL_TOOLS_COUNT-->/g, isAr ? `إجمالي الأدوات: ${toolsData.length}` : `Total Tools: ${toolsData.length}`)
        .replace(/<!--TOOLS_GRID_CARDS-->/g, toolsCardsHtml)
        .replace(/<!--NO_RESULTS_TITLE-->/g, isAr ? 'لم يتم العثور على أدوات تطابق بحثك' : 'No tools found matching your search')
        .replace(/<!--NO_RESULTS_DESC-->/g, isAr ? 'جرب البحث بكلمات أو مصطلحات أخرى.' : 'Try searching with different terms or keywords.')
        .replace(/<!--RESET_BTN-->/g, isAr ? 'إعادة ضبط الفلترة' : 'Clear Search')
        .replace(/<!--WHY_KICKER-->/g, isAr ? 'لماذا GToolix' : 'Why GToolix')
        .replace(/<!--WHY_TITLE-->/g, isAr ? 'مصممة لخدمتك بسرعة وبدون تعقيد' : 'Built to stay out of your way')
        .replace(/<!--FEAT_1_TITLE-->/g, isAr ? 'بدون حسابات' : 'No accounts')
        .replace(/<!--FEAT_1_DESC-->/g, isAr ? 'لا تسجيل ولا كلمات مرور ولا بيانات مطلوبة. افتح الأداة واستخدمها فوراً.' : 'Nothing to sign up for and nothing to remember. Open a tool and use it.')
        .replace(/<!--FEAT_2_TITLE-->/g, isAr ? 'نتائج فورية' : 'Instant results')
        .replace(/<!--FEAT_2_DESC-->/g, isAr ? 'كل أداة مطوّرة لتعطيك النتيجة خلال أجزاء من الثانية بمعالجة محلية داخل جهازك.' : 'Every tool is built to respond in seconds, not spinners.')
        .replace(/<!--FEAT_3_TITLE-->/g, isAr ? 'بدون علامات مائية' : 'No watermarks')
        .replace(/<!--FEAT_3_DESC-->/g, isAr ? 'ما تقوم بتنزيله نظيف تماماً وأصلي 100% بدون أي شعارات أو قيود مضافة.' : 'What you download is exactly what you asked for — nothing added.')
        .replace(/<!--FEAT_4_TITLE-->/g, isAr ? 'تعمل في كل مكان' : 'Works everywhere')
        .replace(/<!--FEAT_4_DESC-->/g, isAr ? 'متوافقة بالكامل مع الهواتف الذكية، الأجهزة اللوحية، وأجهزة الكمبيوتر المكتبية.' : 'Phone, tablet, or desktop — every tool is built mobile-first.')
        .replace(/<!--SITE_FOOTER-->/g, siteFooter);

    rendered = ensureOfficialAdSenseInHead(rendered);
    const outPath = isAr ? path.join(ROOT_DIR, 'tools', 'index.html') : path.join(ROOT_DIR, 'en', 'tools', 'index.html');
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log(`[GEN] Generated Tools Index: ${outPath}`);
}

function sanitizeAndLocalizeToolSchema(htmlContent, slug, lang, toolMeta) {
    if (!htmlContent) return htmlContent;
    const isAr = lang === 'ar';
    const schemaMatch = htmlContent.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
    if (!schemaMatch) return htmlContent;

    try {
        let schemaObj = JSON.parse(schemaMatch[1]);

        function purgeFakeRatings(obj) {
            if (!obj || typeof obj !== 'object') return;
            if (obj.aggregateRating) {
                delete obj.aggregateRating;
            }
            if (Array.isArray(obj)) {
                obj.forEach(purgeFakeRatings);
            } else {
                for (const k in obj) {
                    if (k === 'aggregateRating' || k === 'review') {
                        delete obj[k];
                    } else if (typeof obj[k] === 'object') {
                        purgeFakeRatings(obj[k]);
                    }
                }
            }
        }
        purgeFakeRatings(schemaObj);

        const arBase = `https://www.gtoolix.com/tools/${slug}`;
        const enBase = `https://www.gtoolix.com/en/tools/${slug}`;
        const currentBase = isAr ? arBase : enBase;

        if (schemaObj['@graph'] && Array.isArray(schemaObj['@graph'])) {
            schemaObj['@graph'].forEach(entity => {
                if (entity['@type'] === 'BreadcrumbList' && Array.isArray(entity.itemListElement)) {
                    entity['@id'] = `${currentBase}#breadcrumb`;
                    entity.itemListElement = [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": isAr ? "الرئيسية" : "Home",
                            "item": isAr ? "https://www.gtoolix.com/" : "https://www.gtoolix.com/en/"
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": isAr ? "الأدوات" : "Tools",
                            "item": isAr ? "https://www.gtoolix.com/tools" : "https://www.gtoolix.com/en/tools"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": isAr ? (toolMeta.nameAr || toolMeta.name) : (toolMeta.name || toolMeta.nameAr),
                            "item": currentBase
                        }
                    ];
                }

                if (entity['@type'] === 'WebPage') {
                    entity['@id'] = `${currentBase}#webpage`;
                    entity.url = currentBase;
                    if (!isAr) {
                        entity.name = `${toolMeta.name || slug} Free Online | GToolix`;
                        entity.description = toolMeta.description || 'Free high-performance online web utility by GToolix.';
                    }
                }

                if (entity['@type'] === 'SoftwareApplication' || entity['@type'] === 'WebApplication') {
                    entity.url = currentBase;
                    if (entity['@id'] && entity['@id'].includes('/tools/')) {
                        entity['@id'] = isAr ? entity['@id'].replace('/en/tools/', '/tools/') : entity['@id'].replace('https://www.gtoolix.com/tools/', 'https://www.gtoolix.com/en/tools/');
                    }
                }
            });
        }

        const newJsonStr = JSON.stringify(schemaObj, null, 2);
        return htmlContent.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i, `<script type="application/ld+json">\n${newJsonStr}\n    </script>`);
    } catch (e) {
        console.warn(`[WARN] Failed to parse/localize schema for ${slug}:`, e.message);
        return htmlContent;
    }
}

// ==========================================
// C. INDIVIDUAL TOOL PAGE GENERATOR
// ==========================================
function generateToolPage(slug, lang) {
    const isAr = lang === 'ar';
    const sourcePath = path.join(ROOT_DIR, 'tools', slug, 'index.html');
    if (!fs.existsSync(sourcePath)) {
        console.warn(`[WARN] Tool file not found: ${sourcePath}`);
        return;
    }

    let content = fs.readFileSync(sourcePath, 'utf8');

    const toolMeta = toolsData.find(t => t.slug === slug) || {};
    const titleAr = toolMeta.nameAr ? `${toolMeta.nameAr} مجاناً أونلاين | GToolix` : `${slug} | GToolix`;
    const titleEn = toolMeta.name ? `${toolMeta.name} Free Online | GToolix` : `${slug} | GToolix`;
    const descAr = toolMeta.descriptionAr || 'أداة ويب تفاعلية مجانية عالية الأداء من GToolix.';
    const descEn = toolMeta.description || 'Free high-performance online web utility by GToolix.';

    const title = isAr ? titleAr : titleEn;
    const description = isAr ? descAr : descEn;

    const seoHead = buildSeoHead({
        urlAr: `/tools/${slug}`,
        urlEn: `/en/tools/${slug}`,
        lang,
        title,
        description,
        keywords: `${toolMeta.name}, ${toolMeta.nameAr}, ${slug}, GToolix`,
        ogType: 'website',
        ogImage: `/static/img/og-${slug}.png`,
        hasTranslation: true
    });

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, `/tools/${slug}`, `/en/tools/${slug}`, true);
    const siteFooter = renderFooter(lang);

    // Replace <html ...>
    content = content.replace(/<html[^>]*>/i, htmlTag);

    // Replace <head> SEO block
    // Inject lang-detect script right at the start of head
    if (!content.includes('lang-detect.min.js')) {
        content = content.replace(/<head>/i, `<head>\n    <script src="/static/js/lang-detect.min.js"></script>`);
    }

    // Replace title and meta description
    content = content.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    content = content.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);

    // Replace canonical and hreflangs
    const canonicalPattern = /<link\s+rel=["']canonical["'][^>]*>/gi;
    const hreflangPattern = /<link\s+rel=["']alternate["']\s+hreflang[^>]*>/gi;
    content = content.replace(canonicalPattern, '');
    content = content.replace(hreflangPattern, '');

    const arHref = `https://www.gtoolix.com/tools/${slug}`;
    const enHref = `https://www.gtoolix.com/en/tools/${slug}`;
    const currentHref = isAr ? arHref : enHref;
    const canonicalAndHreflang = `    <link rel="canonical" href="${currentHref}" />\n    <link rel="alternate" hreflang="ar" href="${arHref}" />\n    <link rel="alternate" hreflang="en" href="${enHref}" />\n    <link rel="alternate" hreflang="x-default" href="${arHref}" />`;
    content = content.replace(/<\/head>/i, `${canonicalAndHreflang}\n</head>`);

    // Remove any old legacy localStorage-first scripts in head
    content = content.replace(/<script>\s*\(function\s*\(\)\s*\{[\s\S]*?localStorage\.getItem\(['"]gtoolix_language['"]\)[\s\S]*?<\/script>/gi, '');

    if (!isAr) {
        content = prefixInternalLinksForEnglish(content);
        content = content.replace(/<meta\s+property=["']og:title["']\s+content=["'][^"']*["']/i, `<meta property="og:title" content="${escapeHtml(titleEn)}"`);
        content = content.replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*["']/i, `<meta property="og:description" content="${escapeHtml(descEn)}"`);
        content = content.replace(/<meta\s+property=["']og:url["']\s+content=["'][^"']*["']/i, `<meta property="og:url" content="${enHref}"`);
        content = content.replace(/<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']/i, `<meta name="twitter:title" content="${escapeHtml(titleEn)}"`);
        content = content.replace(/<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']/i, `<meta name="twitter:description" content="${escapeHtml(descEn)}"`);
        content = content.replace(/<meta\s+name=["']twitter:url["']\s+content=["'][^"']*["']/i, `<meta name="twitter:url" content="${enHref}"`);
    }

    // Replace Navbar and any duplicate backdrops
    content = content.replace(/<header\s+class=["']site-nav["'][\s\S]*?<\/header>(\s*<div\s+class=["']nav-backdrop["'][^>]*><\/div>)*/i, siteNav);

    // Replace Footer
    content = content.replace(/<footer>[\s\S]*?<\/footer>/i, siteFooter);

    // Ensure currentLang in tool script matches language directly
    content = content.replace(/let\s+currentLang\s*=\s*(?:['"][a-z]{2}['"]|(?:\(function\s*\(\)[\s\S]*?\}\)\(\)|\([^)]*\)\s*=>\s*\{[\s\S]*?\}\)\(\)))[;\s]*/i, `let currentLang = '${lang}';\n`);

    if (!isAr) {
        // Pre-render static English strings for zero FOUC and pristine initial HTML
        const matchTrans = content.match(/const\s+translations\s*=\s*(\{[\s\S]*?\n\s*\};)/);
        if (matchTrans) {
            try {
                let transObj;
                eval('transObj = ' + matchTrans[1]);
                if (transObj && transObj.en) {
                    const getVal = (key) => {
                        const parts = key.split('.');
                        let cur = transObj.en;
                        for (const p of parts) {
                            if (cur && cur[p] !== undefined) {
                                cur = cur[p];
                            } else {
                                return null;
                            }
                        }
                        return cur;
                    };

                    content = content.replace(/(<([a-zA-Z0-9\-]+)[^>]*\sdata-i18n=["']([^"']+)["'][^>]*>)([\s\S]*?)(<\/\2>)/g, (full, openTag, tag, key, inner, closeTag) => {
                        const val = getVal(key);
                        if (val && typeof val === 'string') {
                            return `${openTag}${escapeHtml(val)}${closeTag}`;
                        }
                        return full;
                    });
                }
            } catch (e) {
                console.warn(`[WARN] Failed to pre-render i18n for ${slug}:`, e.message);
            }
        }
    }

    content = ensureOfficialAdSenseInHead(content);
    content = sanitizeAndLocalizeToolSchema(content, slug, lang, toolMeta);

    const outPath = isAr
        ? path.join(ROOT_DIR, 'tools', slug, 'index.html')
        : path.join(ROOT_DIR, 'en', 'tools', slug, 'index.html');

    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`[GEN] Generated Tool [${slug}]: ${outPath}`);
}

// ==========================================
// D. BLOG INDEX GENERATOR
// ==========================================
function generateBlogIndexPage(lang) {
    const isAr = lang === 'ar';
    const templatePath = path.join(TEMPLATES_DIR, 'blog-index.html');
    const tpl = fs.readFileSync(templatePath, 'utf8');

    const title = isAr
        ? 'المقالات والشروحات | GToolix Articles & Guides'
        : 'Articles, Guides & Tutorials | GToolix Blog';

    const description = isAr
        ? 'مقالات وشروحات تفصيلية في مختلف المجالات، أدوات الويب، والإنتاجية الرقمية والأداء من فريق GToolix.'
        : 'Explore comprehensive guides, articles, and tutorials on web tools, digital productivity, and web performance by GToolix.';

    const keywords = isAr
        ? 'GToolix blog, articles, guides, tutorials, web tools articles, مدونة, شروحات أدوات, مقالات متنوعة'
        : 'GToolix blog, articles, guides, online tools tutorials, web utilities articles, productivity guides';

    const schemaJson = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": title,
        "description": description,
        "url": isAr ? "https://www.gtoolix.com/blog" : "https://www.gtoolix.com/en/blog",
        "publisher": {
            "@type": "Organization",
            "name": "GToolix",
            "url": "https://www.gtoolix.com",
            "logo": "https://www.gtoolix.com/static/img/logo.webp"
        }
    };

    const seoHead = buildSeoHead({
        urlAr: '/blog',
        urlEn: '/en/blog',
        lang,
        title,
        description,
        keywords,
        ogType: 'website',
        ogImage: '/static/img/logo.png',
        hasTranslation: true,
        schemaJson
    });

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/blog', '/en/blog', true);
    const siteFooter = renderFooter(lang);

    const pfx = isAr ? '' : '/en';

    // Articles Cards (published only)
    const publishedArticles = blogData.filter(a => a.is_published !== false);
    const totalCount = publishedArticles.length;
    const countText = isAr ? `إجمالي المقالات: ${totalCount}` : `Total Guides: ${totalCount}`;

    const articlesCardsHtml = publishedArticles.map(art => {
        const artTitle = isAr ? (art.title_ar || art.title_en) : (art.title_en || art.title_ar);
        const artExcerpt = isAr ? (art.excerpt_ar || art.excerpt_en) : (art.excerpt_en || art.excerpt_ar);
        const imgUrl = isAr
            ? (art.featured_image_url || '/static/img/blog/qr-code-guide.jpg')
            : (art.featured_image_url_en || art.featured_image_url || '/static/img/blog/qr-code-guide-en.jpg');
        const readMore = isAr ? 'اقرأ الدليل الكامل' : 'Read Full Guide';
        const primaryTag = (art.tags && art.tags.length > 0) ? art.tags[0] : (isAr ? 'دليل شامل' : 'Guide');
        const keywordsAttr = escapeHtml([(art.tags || []).join(' '), artTitle, artExcerpt].join(' '));

        return `            <article class="article-card reveal in-view" data-keywords="${keywordsAttr}">
                <a href="${pfx}/blog/${art.slug}" class="article-card__thumb-link" aria-label="${escapeHtml(artTitle)}">
                    <img src="${imgUrl}" alt="${escapeHtml(artTitle)}" class="article-card__thumb-img" width="400" height="225" loading="lazy">
                </a>
                <div class="article-card__body">
                    <div class="article-card__meta">
                        <span class="article-card__tag">${escapeHtml(primaryTag)}</span>
                    </div>
                    <h2 class="article-card__title">
                        <a href="${pfx}/blog/${art.slug}">${escapeHtml(artTitle)}</a>
                    </h2>
                    <p class="article-card__excerpt">
                        ${escapeHtml(artExcerpt)}
                    </p>
                    <div class="article-card__footer">
                        <a href="${pfx}/blog/${art.slug}" class="article-card__cta">
                            <span>${readMore}</span>
                            <span class="cta-arrow">${isAr ? '←' : '→'}</span>
                        </a>
                    </div>
                </div>
            </article>`;
    }).join('\n\n');

    let rendered = tpl
        .replace(/<!--HTML_TAG-->/g, htmlTag)
        .replace(/<!--SEO_HEAD-->/g, seoHead)
        .replace(/<!--SITE_NAV-->/g, siteNav)
        .replace(/<!--BRAND_HREF-->/g, isAr ? '/' : '/en/')
        .replace(/<!--BREADCRUMB_HOME-->/g, isAr ? 'الرئيسية' : 'Home')
        .replace(/<!--BREADCRUMB_BLOG-->/g, isAr ? 'المقالات' : 'Articles')
        .replace(/<!--BLOG_KICKER-->/g, isAr ? 'مكتبة المقالات' : 'Knowledge Hub')
        .replace(/<!--BLOG_H1-->/g, isAr ? 'المقالات والشروحات' : 'Articles & Guides')
        .replace(/<!--BLOG_LEAD-->/g, isAr ? 'شروحات وأدلة متقدمة وشاملة في مختلف المجالات وأدوات الويب والإنتاجية الرقمية.' : 'Comprehensive guides and tutorials covering modern utilities and digital productivity.')
        .replace(/<!--SEARCH_PLACEHOLDER-->/g, isAr ? 'ابحث في المقالات والشروحات...' : 'Search articles, guides & tutorials...')
        .replace(/<!--TOTAL_ARTICLES_COUNT-->/g, countText)
        .replace(/<!--TOTAL_ARTICLES_RAW-->/g, String(totalCount))
        .replace(/<!--NO_RESULTS_TITLE-->/g, isAr ? 'لم يتم العثور على مقالات تطابق بحثك' : 'No articles found matching your search')
        .replace(/<!--NO_RESULTS_DESC-->/g, isAr ? 'جرّب استخدام كلمات بحثية أخرى أو تصفح كافة المقالات المتاحة.' : 'Try searching for different keywords or explore all available guides.')
        .replace(/<!--RESET_BTN-->/g, isAr ? 'عرض جميع المقالات' : 'Browse All Articles')
        .replace(/<!--BLOG_GRID_CARDS-->/g, articlesCardsHtml)
        .replace(/<!--SITE_FOOTER-->/g, siteFooter);

    rendered = ensureOfficialAdSenseInHead(rendered);
    const outPath = isAr ? path.join(ROOT_DIR, 'blog', 'index.html') : path.join(ROOT_DIR, 'en', 'blog', 'index.html');
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log(`[GEN] Generated Blog Index: ${outPath}`);
}

// ==========================================
// E. BLOG ARTICLE GENERATOR (qr-code + fallback)
// ==========================================
function generateBlogArticleQr(lang) {
    const isAr = lang === 'ar';
    const sourcePath = path.join(ROOT_DIR, 'blog', 'qr-code', 'index.html');
    if (!fs.existsSync(sourcePath)) {
        console.warn(`[WARN] Article qr-code not found: ${sourcePath}`);
        return;
    }

    let content = fs.readFileSync(sourcePath, 'utf8');

    const titleAr = "QR Code: الدليل الشامل لإنشاء واستخدام وقراءة رموز QR مجاناً أونلاين | GToolix";
    const titleEn = "QR Code: The Ultimate Guide to Creating, Using & Scanning QR Codes Online | GToolix";
    const descAr = "اكتشف كل ما تحتاج لمعرفته عن QR Code: تاريخه، كيف يعمل، الفرق بين Static و Dynamic، وطريقة إنشاء رمز QR مجاناً للروابط وشبكات WiFi والبيانات بأعلى جودة مع GToolix.";
    const descEn = "Complete comprehensive guide to QR Codes: history, how they work, Static vs Dynamic, and generating free high-res vector QR codes with GToolix.";

    const title = isAr ? titleAr : titleEn;
    const description = isAr ? descAr : descEn;

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/blog/qr-code', '/en/blog/qr-code', true);
    const siteFooter = renderFooter(lang);

    content = content.replace(/<html[^>]*>/i, htmlTag);

    if (!content.includes('lang-detect.min.js')) {
        content = content.replace(/<head>/i, `<head>\n    <script src="/static/js/lang-detect.min.js"></script>`);
    }

    content = content.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    content = content.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);

    const arHref = `https://www.gtoolix.com/blog/qr-code`;
    const enHref = `https://www.gtoolix.com/en/blog/qr-code`;
    const currentHref = isAr ? arHref : enHref;
    const canonicalAndHreflang = `    <link rel="canonical" href="${currentHref}" />\n    <link rel="alternate" hreflang="ar" href="${arHref}" />\n    <link rel="alternate" hreflang="en" href="${enHref}" />\n    <link rel="alternate" hreflang="x-default" href="${arHref}" />`;
    
    content = content.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
    content = content.replace(/<link\s+rel=["']alternate["']\s+hreflang[^>]*>/gi, '');
    content = content.replace(/<\/head>/i, `${canonicalAndHreflang}\n</head>`);

    // Update OpenGraph & Twitter
    const ogLocale = isAr ? 'ar_EG' : 'en_US';
    const ogImg = isAr ? 'https://www.gtoolix.com/static/img/blog/qr-code-guide.jpg' : 'https://www.gtoolix.com/static/img/blog/qr-code-guide-en.jpg';
    const ogMeta = `    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${currentHref}">
    <meta property="og:locale" content="${ogLocale}">
    <meta property="og:image" content="${ogImg}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${ogImg}">`;

    content = content.replace(/<meta\s+property=["']og:title["'][^>]*>/i, '');
    content = content.replace(/<meta\s+property=["']og:description["'][^>]*>/i, '');
    content = content.replace(/<meta\s+property=["']og:url["'][^>]*>/i, '');
    content = content.replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, '');
    content = content.replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, '');
    content = content.replace(/<\/head>/i, `${ogMeta}\n</head>`);

    if (isAr) {
        // Remove English article content block for clean single H1 and optimal HTML size
        content = content.replace(/<!--[\s\S]*?ENGLISH ARTICLE CONTENT[\s\S]*?<div\s+class=["']article-content-en["']>[\s\S]*?<\/main>\s*<\/div>/i, '');
        // Also ensure article-content-en standalone is removed if comments differ
        content = content.replace(/<div\s+class=["']article-content-en["']>[\s\S]*?<\/main>\s*<\/div>/i, '');
    } else {
        // Remove Arabic article content block for clean single H1 and optimal HTML size
        content = content.replace(/<!--[\s\S]*?ARABIC ARTICLE CONTENT[\s\S]*?<div\s+class=["']article-content-ar["']>[\s\S]*?<\/main>\s*<\/div>/i, '');
        content = content.replace(/<div\s+class=["']article-content-ar["']>[\s\S]*?<\/main>\s*<\/div>/i, '');
        content = prefixInternalLinksForEnglish(content);
    }

    content = content.replace(/<header\s+class=["']site-nav["'][\s\S]*?<\/header>/i, siteNav);
    content = content.replace(/<footer>[\s\S]*?<\/footer>/i, siteFooter);

    content = ensureOfficialAdSenseInHead(content);

    const outPath = isAr
        ? path.join(ROOT_DIR, 'blog', 'qr-code', 'index.html')
        : path.join(ROOT_DIR, 'en', 'blog', 'qr-code', 'index.html');

    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`[GEN] Generated Blog Article [qr-code]: ${outPath}`);
}

function generateBlogArticleDynamic(lang) {
    const isAr = lang === 'ar';
    const sourcePath = path.join(ROOT_DIR, 'blog', 'article.html');
    if (!fs.existsSync(sourcePath)) return;

    let content = fs.readFileSync(sourcePath, 'utf8');
    const title = isAr ? 'المقالات والشروحات | GToolix' : 'Articles & Guides | GToolix';
    const description = isAr ? 'مقالات وشروحات تفصيلية في مختلف المجالات وأدوات الويب من فريق GToolix.' : 'In-depth articles, guides, and tutorials on web tools and digital productivity by GToolix.';

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/blog/article.html', '/en/blog/article.html', true);
    const siteFooter = renderFooter(lang);

    content = content.replace(/<html[^>]*>/i, htmlTag);
    if (!content.includes('lang-detect.min.js')) {
        content = content.replace(/<head>/i, `<head>\n    <script src="/static/js/lang-detect.min.js"></script>`);
    }

    content = content.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    content = content.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);

    const currentHref = isAr ? 'https://www.gtoolix.com/blog' : 'https://www.gtoolix.com/en/blog';
    const arHref = 'https://www.gtoolix.com/blog';
    const enHref = 'https://www.gtoolix.com/en/blog';

    const seoTags = `    <link rel="canonical" href="${currentHref}" />
    <link rel="alternate" hreflang="ar" href="${arHref}" />
    <link rel="alternate" hreflang="en" href="${enHref}" />
    <link rel="alternate" hreflang="x-default" href="${arHref}" />
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="GToolix">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${currentHref}">
    <meta property="og:locale" content="${isAr ? 'ar_EG' : 'en_US'}">
    <meta property="og:image" content="https://www.gtoolix.com/static/img/logo.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="https://www.gtoolix.com/static/img/logo.png">`;

    content = content.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
    content = content.replace(/<link\s+rel=["']alternate["']\s+hreflang[^>]*>/gi, '');
    content = content.replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '');
    content = content.replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '');
    content = content.replace(/<\/head>/i, `${seoTags}\n</head>`);

    if (!isAr) {
        content = prefixInternalLinksForEnglish(content);
    }

    content = content.replace(/<header\s+class=["']site-nav["'][\s\S]*?<\/header>/i, siteNav);
    content = content.replace(/<footer>[\s\S]*?<\/footer>/i, siteFooter);

    content = ensureOfficialAdSenseInHead(content);

    const outPath = isAr
        ? path.join(ROOT_DIR, 'blog', 'article.html')
        : path.join(ROOT_DIR, 'en', 'blog', 'article.html');

    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`[GEN] Generated Dynamic Blog Fallback: ${outPath}`);
}

// ==========================================
// F. PROGRAMS INDEX GENERATOR
// ==========================================
function generateProgramsIndexPage(lang) {
    const isAr = lang === 'ar';
    const templatePath = path.join(TEMPLATES_DIR, 'programs-index.html');
    const tpl = fs.readFileSync(templatePath, 'utf8');

    const title = isAr
        ? 'قسم البرامج والتطبيقات القابلة للتنزيل | GToolix'
        : 'Downloadable Software & Desktop Utilities | GToolix';

    const description = isAr
        ? 'قسم البرامج والتطبيقات القابلة للتنزيل من GToolix: أدوات وتطبيقات مكتبية سريعة ومجانية، تعمل محلياً بخصوصية 100% وبدون اتصال بالإنترنت.'
        : 'Explore downloadable desktop software and tools from GToolix: fast, free, 100% private offline utilities for Windows, Mac, and Linux.';

    const keywords = isAr
        ? 'GToolix downloads, downloadable software, desktop tools, offline utilities, برامج كمبيوتر, تنزيل برامج, أدوات بدون نت'
        : 'GToolix downloads, downloadable software, desktop tools, offline utilities, PC apps, free software';

    const programsSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "description": description,
        "url": isAr ? "https://www.gtoolix.com/programs" : "https://www.gtoolix.com/en/programs",
        "isPartOf": {
            "@type": "WebSite",
            "name": "GToolix",
            "url": "https://www.gtoolix.com"
        },
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": isAr ? "الرئيسية" : "Home", "item": isAr ? "https://www.gtoolix.com/" : "https://www.gtoolix.com/en/" },
                { "@type": "ListItem", "position": 2, "name": isAr ? "البرامج" : "Programs", "item": isAr ? "https://www.gtoolix.com/programs" : "https://www.gtoolix.com/en/programs" }
            ]
        }
    };

    const seoHead = buildSeoHead({
        urlAr: '/programs',
        urlEn: '/en/programs',
        lang,
        title,
        description,
        keywords,
        ogType: 'website',
        ogImage: '/static/img/logo.png',
        hasTranslation: true,
        schemaJson: programsSchema
    });

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/programs', '/en/programs', true);
    const siteFooter = renderFooter(lang);

    const pfx = isAr ? '' : '/en';

    // Programs Cards (published only)
    const publishedPrograms = programsData.filter(p => p.is_published !== false);
    const programsCardsHtml = publishedPrograms.length > 0
        ? publishedPrograms.map(prog => {
            const progName = prog.name || 'GToolix Desktop Suite';
            const progDesc = isAr ? (prog.description_ar || prog.description_en) : (prog.description_en || prog.description_ar);
            const ver = prog.version || 'v1.2.0';
            const os = prog.os_support || 'Windows / macOS / Linux';
            const downloadBtnText = isAr ? 'تفاصيل وتنزيل البرنامج ←' : 'Details & Download →';

            return `            <div class="program-card" style="background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.75rem; box-shadow: 0 4px 20px -4px rgba(0,0,0,0.05); display: flex; flex-direction: column;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(37,99,235,0.15); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <line x1="12" y1="11" x2="12" y2="17"></line>
                            <polyline points="9 14 12 17 15 14"></polyline>
                        </svg>
                    </div>
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text); margin: 0;">${escapeHtml(progName)}</h2>
                        <span style="font-size: 0.82rem; color: var(--primary); font-weight: 600;">${escapeHtml(ver)}</span>
                    </div>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.25rem; flex-grow: 1;">
                    ${escapeHtml(progDesc)}
                </p>
                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
                    <strong>${isAr ? 'الأنظمة المدعومة:' : 'OS Support:'}</strong> ${escapeHtml(os)}
                </div>
                <a href="${pfx}/programs/${prog.slug}" class="btn btn-primary" style="display: block; text-align: center; text-decoration: none; padding: 0.65rem 1rem; font-size: 0.92rem; font-weight: 600;">
                    ${downloadBtnText}
                </a>
            </div>`;
        }).join('\n\n')
        : (isAr ? `            <div class="no-programs-card" style="grid-column: 1 / -1; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: clamp(2.5rem, 5vw, 3.5rem) 1.5rem; text-align: center; max-width: 620px; margin: 1.5rem auto; box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06);">
                <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(37,99,235,0.12); color: var(--primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                </div>
                <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text); margin: 0 0 0.75rem;">برامج وتطبيقات جديدة قادمة قريباً</h2>
                <p style="color: var(--text-secondary); font-size: 0.98rem; line-height: 1.65; margin: 0 auto 1.75rem; max-width: 480px;">
                    نعمل حالياً على تطوير وتجهيز مجموعة برامج وتطبيقات مكتبية سريعة ومجانية تعمل دون اتصال بالإنترنت. تابعنا للحصول على التحديثات فور إطلاقها!
                </p>
                <a href="/tools" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.7rem 1.5rem; font-size: 0.95rem; font-weight: 600; text-decoration: none; border-radius: var(--radius-md);">
                    استكشف أدوات الويب المتاحة ←
                </a>
            </div>` : `            <div class="no-programs-card" style="grid-column: 1 / -1; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: clamp(2.5rem, 5vw, 3.5rem) 1.5rem; text-align: center; max-width: 620px; margin: 1.5rem auto; box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06);">
                <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(37,99,235,0.12); color: var(--primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                </div>
                <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text); margin: 0 0 0.75rem;">New Desktop Software Coming Soon</h2>
                <p style="color: var(--text-secondary); font-size: 0.98rem; line-height: 1.65; margin: 0 auto 1.75rem; max-width: 480px;">
                    We are currently developing fast, free, and privacy-focused offline desktop tools. Stay tuned for our upcoming software releases!
                </p>
                <a href="/en/tools" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.7rem 1.5rem; font-size: 0.95rem; font-weight: 600; text-decoration: none; border-radius: var(--radius-md);">
                    Explore Online Web Tools →
                </a>
            </div>`);

    let rendered = tpl
        .replace(/<!--HTML_TAG-->/g, htmlTag)
        .replace(/<!--SEO_HEAD-->/g, seoHead)
        .replace(/<!--SITE_NAV-->/g, siteNav)
        .replace(/<!--BRAND_HREF-->/g, isAr ? '/' : '/en/')
        .replace(/<!--BREADCRUMB_HOME-->/g, isAr ? 'الرئيسية' : 'Home')
        .replace(/<!--BREADCRUMB_PROGRAMS-->/g, isAr ? 'البرامج' : 'Programs')
        .replace(/<!--PROGRAMS_KICKER-->/g, isAr ? 'مكتبة البرامج' : 'Software Hub')
        .replace(/<!--PROGRAMS_H1-->/g, isAr ? 'قسم البرامج والتطبيقات' : 'Programs & Software')
        .replace(/<!--PROGRAMS_LEAD-->/g, isAr ? 'تطبيقات وبرامج مكتبية سريعة ومجانية تعمل محلياً وبدون اتصال بالإنترنت.' : 'Fast, reliable offline desktop software engineered for maximum privacy and performance.')
        .replace(/<!--PROGRAMS_GRID_CARDS-->/g, programsCardsHtml)
        .replace(/<!--SITE_FOOTER-->/g, siteFooter);

    rendered = ensureOfficialAdSenseInHead(rendered);
    const outPath = isAr ? path.join(ROOT_DIR, 'programs', 'index.html') : path.join(ROOT_DIR, 'en', 'programs', 'index.html');
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log(`[GEN] Generated Programs Index: ${outPath}`);
}

// ==========================================
// G. PROGRAM DETAILS GENERATOR (desktop-suite + fallback)
// ==========================================
function generateProgramDesktopSuite(lang) {
    const isAr = lang === 'ar';
    const sourcePath = path.join(ROOT_DIR, 'programs', 'desktop-suite', 'index.html');
    if (!fs.existsSync(sourcePath)) {
        console.warn(`[WARN] Program desktop-suite not found: ${sourcePath}`);
        return;
    }

    let content = fs.readFileSync(sourcePath, 'utf8');

    const titleAr = "GToolix Desktop Suite – حزمة البرامج المكتبية الشاملة | GToolix";
    const titleEn = "GToolix Desktop Suite – Complete Offline Utilities Suite | GToolix";
    const descAr = "حزمة برامج GToolix المكتبية الشاملة للعمل دون اتصال بالإنترنت، تشمل أدوات توليد كود QR، تسجيل الشاشة بدقة 4K، وتنزيل الوسائط بأعلى سرعة.";
    const descEn = "Complete offline desktop suite for GToolix tools including offline QR generation, 4K screen recording, and high-speed media processing.";

    const title = isAr ? titleAr : titleEn;
    const description = isAr ? descAr : descEn;

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/programs/desktop-suite', '/en/programs/desktop-suite', true);
    const siteFooter = renderFooter(lang);

    content = content.replace(/<html[^>]*>/i, htmlTag);
    if (!content.includes('lang-detect.min.js')) {
        content = content.replace(/<head>/i, `<head>\n    <script src="/static/js/lang-detect.min.js"></script>`);
    }

    content = content.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    content = content.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);

    const arHref = `https://www.gtoolix.com/programs/desktop-suite`;
    const enHref = `https://www.gtoolix.com/en/programs/desktop-suite`;
    const currentHref = isAr ? arHref : enHref;
    const canonicalAndHreflang = `    <link rel="canonical" href="${currentHref}" />\n    <link rel="alternate" hreflang="ar" href="${arHref}" />\n    <link rel="alternate" hreflang="en" href="${enHref}" />\n    <link rel="alternate" hreflang="x-default" href="${arHref}" />`;

    content = content.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
    content = content.replace(/<link\s+rel=["']alternate["']\s+hreflang[^>]*>/gi, '');
    content = content.replace(/<\/head>/i, `${canonicalAndHreflang}\n</head>`);

    // Add OpenGraph & Twitter
    const ogLocale = isAr ? 'ar_EG' : 'en_US';
    const ogMeta = `    <meta property="og:type" content="software">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${currentHref}">
    <meta property="og:locale" content="${ogLocale}">
    <meta property="og:image" content="https://www.gtoolix.com/static/img/logo.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="https://www.gtoolix.com/static/img/logo.png">`;

    content = content.replace(/<meta\s+property=["']og:title["'][^>]*>/i, '');
    content = content.replace(/<meta\s+property=["']og:description["'][^>]*>/i, '');
    content = content.replace(/<meta\s+property=["']og:url["'][^>]*>/i, '');
    content = content.replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, '');
    content = content.replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, '');
    content = content.replace(/<\/head>/i, `${ogMeta}\n</head>`);

    if (!isAr) {
        content = prefixInternalLinksForEnglish(content);
    }

    content = content.replace(/<header\s+class=["']site-nav["'][\s\S]*?<\/header>/i, siteNav);
    content = content.replace(/<footer>[\s\S]*?<\/footer>/i, siteFooter);

    content = ensureOfficialAdSenseInHead(content);

    const outPath = isAr
        ? path.join(ROOT_DIR, 'programs', 'desktop-suite', 'index.html')
        : path.join(ROOT_DIR, 'en', 'programs', 'desktop-suite', 'index.html');

    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`[GEN] Generated Program Details [desktop-suite]: ${outPath}`);
}

function generateProgramDynamic(lang) {
    const isAr = lang === 'ar';
    const sourcePath = path.join(ROOT_DIR, 'programs', 'program.html');
    if (!fs.existsSync(sourcePath)) return;

    let content = fs.readFileSync(sourcePath, 'utf8');
    const title = isAr ? 'قسم البرامج والتطبيقات | GToolix' : 'Programs & Software Hub | GToolix';
    const description = isAr ? 'تطبيقات وبرامج مكتبية سريعة ومجانية تعمل محلياً وبدون اتصال بالإنترنت.' : 'Fast, reliable offline desktop software engineered for maximum privacy and performance.';

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/programs/program.html', '/en/programs/program.html', true);
    const siteFooter = renderFooter(lang);

    content = content.replace(/<html[^>]*>/i, htmlTag);
    if (!content.includes('lang-detect.min.js')) {
        content = content.replace(/<head>/i, `<head>\n    <script src="/static/js/lang-detect.min.js"></script>`);
    }

    content = content.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    content = content.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);

    const currentHref = isAr ? 'https://www.gtoolix.com/programs' : 'https://www.gtoolix.com/en/programs';
    const arHref = 'https://www.gtoolix.com/programs';
    const enHref = 'https://www.gtoolix.com/en/programs';

    const seoTags = `    <link rel="canonical" href="${currentHref}" />
    <link rel="alternate" hreflang="ar" href="${arHref}" />
    <link rel="alternate" hreflang="en" href="${enHref}" />
    <link rel="alternate" hreflang="x-default" href="${arHref}" />
    <meta property="og:type" content="software">
    <meta property="og:site_name" content="GToolix">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${currentHref}">
    <meta property="og:locale" content="${isAr ? 'ar_EG' : 'en_US'}">
    <meta property="og:image" content="https://www.gtoolix.com/static/img/logo.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="https://www.gtoolix.com/static/img/logo.png">`;

    content = content.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
    content = content.replace(/<link\s+rel=["']alternate["']\s+hreflang[^>]*>/gi, '');
    content = content.replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '');
    content = content.replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '');
    content = content.replace(/<\/head>/i, `${seoTags}\n</head>`);

    if (!isAr) {
        content = prefixInternalLinksForEnglish(content);
    }

    content = content.replace(/<header\s+class=["']site-nav["'][\s\S]*?<\/header>/i, siteNav);
    content = content.replace(/<footer>[\s\S]*?<\/footer>/i, siteFooter);

    content = ensureOfficialAdSenseInHead(content);

    const outPath = isAr
        ? path.join(ROOT_DIR, 'programs', 'program.html')
        : path.join(ROOT_DIR, 'en', 'programs', 'program.html');

    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`[GEN] Generated Dynamic Programs Fallback: ${outPath}`);
}

// ==========================================
// H. STATIC / LEGAL PAGE GENERATOR (about, faq, privacy-policy, terms-of-service, disclaimer, cookies-policy, dmca)
// ==========================================
function generateStaticPage(slug, lang) {
    const isAr = lang === 'ar';
    const pageData = staticPagesData[slug];
    if (!pageData) {
        console.warn(`[WARN] Static page data not found for slug: ${slug}`);
        return;
    }

    const templatePath = path.join(TEMPLATES_DIR, 'static-page.html');
    const tpl = fs.readFileSync(templatePath, 'utf8');

    const title = isAr ? pageData.title_ar : pageData.title_en;
    const description = isAr ? pageData.meta_desc_ar : pageData.meta_desc_en;
    const h1 = isAr ? pageData.h1_ar : pageData.h1_en;
    const lead = isAr ? pageData.lead_ar : pageData.lead_en;

    const kickerHtml = slug === 'faq'
        ? `<span class="faq-kicker">${isAr ? 'كل ما تود معرفته' : 'EVERYTHING YOU NEED TO KNOW'}</span>`
        : '';

    let sectionsHtml = '';
    if (slug === 'faq' && Array.isArray(pageData.faqs)) {
        const faqItemsHtml = pageData.faqs.map((faq, idx) => {
            const q = isAr ? faq.q_ar : faq.q_en;
            const a = isAr ? faq.a_ar : faq.a_en;
            return `            <div class="faq-item ${idx === 0 ? 'open' : ''}" id="faq-item-${idx}">
                <button type="button" class="faq-question">
                    <span>${escapeHtml(q)}</span>
                    <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="faq-answer">
                    <p>${escapeHtml(a)}</p>
                </div>
            </div>`;
        }).join('\n');

        sectionsHtml = `        <div class="faq-accordion" id="faqAccordion">
${faqItemsHtml}
        </div>`;
    } else {
        const sections = isAr ? (pageData.sections_ar || []) : (pageData.sections_en || []);
        sectionsHtml = sections.map(sec => `
        <section class="legal-section">
            <h2 class="legal-section-title">${escapeHtml(sec.title)}</h2>
            <div class="legal-section-body">${sec.content.replace(/\n/g, '<br>')}</div>
        </section>
        `).join('\n');
    }

    let staticSchema = null;
    if (slug === 'faq') {
        staticSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "name": title,
            "description": description,
            "url": isAr ? "https://www.gtoolix.com/faq" : "https://www.gtoolix.com/en/faq",
            "mainEntity": (pageData.faqs || []).map(f => ({
                "@type": "Question",
                "name": isAr ? f.q_ar : f.q_en,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": isAr ? f.a_ar : f.a_en
                }
            }))
        };
    } else if (slug === 'about') {
        staticSchema = {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": title,
            "description": description,
            "url": isAr ? "https://www.gtoolix.com/about" : "https://www.gtoolix.com/en/about",
            "mainEntity": {
                "@type": "Organization",
                "name": "GToolix",
                "url": "https://www.gtoolix.com",
                "logo": "https://www.gtoolix.com/static/img/logo.webp"
            }
        };
    } else {
        staticSchema = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": title,
            "description": description,
            "url": isAr ? `https://www.gtoolix.com/${slug}` : `https://www.gtoolix.com/en/${slug}`,
            "isPartOf": {
                "@type": "WebSite",
                "name": "GToolix",
                "url": "https://www.gtoolix.com"
            }
        };
    }

    const seoHead = buildSeoHead({
        urlAr: `/${slug}`,
        urlEn: `/en/${slug}`,
        lang,
        title,
        description,
        ogType: 'article',
        ogImage: '/static/img/logo.png',
        hasTranslation: true,
        schemaJson: staticSchema
    });

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, `/${slug}`, `/en/${slug}`, true);
    const siteFooter = renderFooter(lang);

    let rendered = tpl
        .replace(/<!--HTML_TAG-->/g, htmlTag)
        .replace(/<!--SEO_HEAD-->/g, seoHead)
        .replace(/<!--JSON_LD-->/g, '')
        .replace(/<!--SITE_NAV-->/g, siteNav)
        .replace(/<!--BRAND_HREF-->/g, isAr ? '/' : '/en/')
        .replace(/<!--BREADCRUMB_HOME-->/g, isAr ? 'الرئيسية' : 'Home')
        .replace(/<!--PAGE_BREADCRUMB-->/g, escapeHtml(h1))
        .replace(/<!--PAGE_KICKER-->/g, kickerHtml)
        .replace(/<!--PAGE_H1-->/g, escapeHtml(h1))
        .replace(/<!--PAGE_LEAD-->/g, escapeHtml(lead))
        .replace(/<!--PAGE_SECTIONS-->/g, sectionsHtml)
        .replace(/<!--SITE_FOOTER-->/g, siteFooter);

    if (!isAr) {
        rendered = prefixInternalLinksForEnglish(rendered);
    }

    rendered = ensureOfficialAdSenseInHead(rendered);

    const outPath = isAr
        ? path.join(ROOT_DIR, slug, 'index.html')
        : path.join(ROOT_DIR, 'en', slug, 'index.html');

    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log(`[GEN] Generated Static Page [${slug}]: ${outPath}`);
}

// ==========================================
// I. CONTACT PAGE GENERATOR
// ==========================================
function generateContactPage(lang) {
    const isAr = lang === 'ar';
    const templatePath = path.join(TEMPLATES_DIR, 'contact.html');
    const tpl = fs.readFileSync(templatePath, 'utf8');

    const title = isAr ? 'اتصل بنا والدعم الفني | GToolix' : 'Contact Us & Support | GToolix';
    const description = isAr
        ? 'تواصل مع فريق الدعم الفني والاستفسارات الخاصة بمنصة GToolix. نحن هنا لمساعدتك والإجابة على تساؤلاتك خلال 24 ساعة.'
        : 'Contact the GToolix technical support team. We are here to assist you with inquiries within 24 hours.';

    const contactSchema = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": title,
        "description": description,
        "url": isAr ? "https://www.gtoolix.com/contact" : "https://www.gtoolix.com/en/contact",
        "mainEntity": {
            "@type": "Organization",
            "name": "GToolix",
            "url": "https://www.gtoolix.com",
            "logo": "https://www.gtoolix.com/static/img/logo.webp",
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "email": "support@gtoolix.com",
                "availableLanguage": ["Arabic", "English"]
            }
        }
    };

    const seoHead = buildSeoHead({
        urlAr: '/contact',
        urlEn: '/en/contact',
        lang,
        title,
        description,
        ogType: 'website',
        ogImage: '/static/img/logo.png',
        hasTranslation: true,
        schemaJson: contactSchema
    });

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/contact', '/en/contact', true);
    const siteFooter = renderFooter(lang);

    const pfx = isAr ? '' : '/en';

    let rendered = tpl
        .replace(/<!--HTML_TAG-->/g, htmlTag)
        .replace(/<!--SEO_HEAD-->/g, seoHead)
        .replace(/<!--JSON_LD-->/g, '')
        .replace(/<!--SITE_NAV-->/g, siteNav)
        .replace(/<!--BRAND_HREF-->/g, isAr ? '/' : '/en/')
        .replace(/<!--BREADCRUMB_HOME-->/g, isAr ? 'الرئيسية' : 'Home')
        .replace(/<!--PAGE_BREADCRUMB-->/g, isAr ? 'اتصل بنا' : 'Contact Us')
        .replace(/<!--PAGE_H1-->/g, isAr ? 'اتصل بنا والدعم الفني' : 'Contact Us & Support')
        .replace(/<!--PAGE_LEAD-->/g, isAr ? 'نحن هنا لمساعدتك! يسعدنا تلقي استفساراتك واقتراحاتك وملاحظاتك حول المنصة.' : 'We are here to help! Send us your inquiries, feedback, or suggestions anytime.')
        .replace(/<!--INFO_TITLE-->/g, isAr ? 'معلومات التواصل' : 'Contact Information')
        .replace(/<!--EMAIL_TITLE-->/g, isAr ? 'البريد الإلكتروني للدعم' : 'Support Email')
        .replace(/<!--SLA_TAG-->/g, isAr ? 'الرد عادةً في أقل من 24 ساعة' : 'Average response time < 24 hours')
        .replace(/<!--FAQ_PROMPT_TITLE-->/g, isAr ? 'هل تبحث عن إجابة سريعة؟' : 'Looking for quick answers?')
        .replace(/<!--FAQ_PROMPT_DESC-->/g, isAr ? 'تفضل بزيارة صفحة الأسئلة الشائعة لمعرفة الإجابات الفورية.' : 'Check our FAQ section for instant solutions to common questions.')
        .replace(/<!--FAQ_HREF-->/g, `${pfx}/faq`)
        .replace(/<!--FAQ_PROMPT_BTN-->/g, isAr ? 'عرض الأسئلة الشائعة ←' : 'Browse FAQ →')
        .replace(/<!--FORM_TITLE-->/g, isAr ? 'أرسل لنا رسالة' : 'Send Us a Message')
        .replace(/<!--LBL_NAME-->/g, isAr ? 'الاسم الكامل' : 'Full Name')
        .replace(/<!--PH_NAME-->/g, isAr ? 'أدخل اسمك...' : 'Enter your name...')
        .replace(/<!--LBL_EMAIL-->/g, isAr ? 'البريد الإلكتروني' : 'Email Address')
        .replace(/<!--PH_EMAIL-->/g, isAr ? 'name@example.com' : 'name@example.com')
        .replace(/<!--LBL_SUBJECT-->/g, isAr ? 'الموضوع' : 'Subject')
        .replace(/<!--PH_SUBJECT-->/g, isAr ? 'عنوان الاستفسار أو المشكلة...' : 'Inquiry subject...')
        .replace(/<!--LBL_MSG-->/g, isAr ? 'نص الرسالة' : 'Message Details')
        .replace(/<!--PH_MSG-->/g, isAr ? 'اكتب تفاصيل استفسارك أو اقتراحك هنا...' : 'Write your inquiry details or feedback here...')
        .replace(/<!--BTN_SUBMIT-->/g, isAr ? 'إرسال الرسالة' : 'Send Message')
        .replace(/<!--SITE_FOOTER-->/g, siteFooter);

    if (!isAr) {
        rendered = prefixInternalLinksForEnglish(rendered);
    }

    rendered = ensureOfficialAdSenseInHead(rendered);

    const outPath = isAr
        ? path.join(ROOT_DIR, 'contact', 'index.html')
        : path.join(ROOT_DIR, 'en', 'contact', 'index.html');

    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log(`[GEN] Generated Contact Page: ${outPath}`);
}

// ==========================================
// J. 404 ERROR PAGE GENERATOR
// ==========================================
function generate404Page(lang) {
    const isAr = lang === 'ar';
    const templatePath = path.join(TEMPLATES_DIR, '404.html');
    const tpl = fs.readFileSync(templatePath, 'utf8');

    const title = isAr ? '404 - الصفحة غير موجودة | GToolix' : '404 - Page Not Found | GToolix';
    const desc = isAr ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. استكشف أدوات GToolix المجانية.' : 'Sorry, the page you are looking for does not exist or has been moved. Explore free GToolix tools.';

    const htmlTag = isAr ? '<html lang="ar" dir="rtl" data-theme="light">' : '<html lang="en" dir="ltr" data-theme="light">';
    const siteNav = renderNavbar(lang, '/404', '/en/404', true);
    const siteFooter = renderFooter(lang);

    const pfx = isAr ? '' : '/en';

    const searchPlaceholder = isAr ? 'ابحث عن أي أداة أو مقال... ثم اضغط Enter' : 'Search tools or guides... then press Enter';
    const popToolsTitle = isAr ? 'أشهر الأدوات المجانية' : 'Popular Online Tools';

    const catPills = isAr
        ? `
            <a href="/tools" class="gt-404-pill"><span>⚡</span><span>أدوات أونلاين</span></a>
            <a href="/blog" class="gt-404-pill"><span>📚</span><span>المقالات والشروحات</span></a>
            <a href="/programs" class="gt-404-pill"><span>💻</span><span>البرامج والتطبيقات</span></a>
            <a href="/faq" class="gt-404-pill"><span>❓</span><span>الأسئلة الشائعة</span></a>
            <a href="/contact" class="gt-404-pill"><span>📩</span><span>تواصل معنا</span></a>`
        : `
            <a href="/en/tools" class="gt-404-pill"><span>⚡</span><span>Online Tools</span></a>
            <a href="/en/blog" class="gt-404-pill"><span>📚</span><span>Articles & Guides</span></a>
            <a href="/en/programs" class="gt-404-pill"><span>💻</span><span>Desktop Programs</span></a>
            <a href="/en/faq" class="gt-404-pill"><span>❓</span><span>FAQ</span></a>
            <a href="/en/contact" class="gt-404-pill"><span>📩</span><span>Contact Us</span></a>`;

    const popToolsCards = isAr
        ? `
            <a href="/tools/qr-code-generator" class="gt-404-card">
                <div class="gt-404-card-icon icon-qr">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3z"/><path d="M18 18h3v3h-3z"/></svg>
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.98rem;">مولد كود QR</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">إنشاء باركود فوري عالي الدقة</div>
                </div>
            </a>
            <a href="/tools/youtube-thumbnail-downloader" class="gt-404-card">
                <div class="gt-404-card-icon icon-thumb">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"/></svg>
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.98rem;">تحميل صور يوتيوب</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">استخراج صور الغلاف بدقة 4K</div>
                </div>
            </a>
            <a href="/tools/screen-recorder-studio" class="gt-404-card">
                <div class="gt-404-card-icon icon-rec">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.98rem;">مسجل الشاشة الاحترافي</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">تسجيل الشاشة والصوت والكاميرا</div>
                </div>
            </a>
            <a href="/tools/image-compressor" class="gt-404-card">
                <div class="gt-404-card-icon icon-compressor">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.98rem;">ضاغط ومحوّل الصور</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">تقليل حجم JPG, PNG, WebP محلياً</div>
                </div>
            </a>`
        : `
            <a href="/en/tools/qr-code-generator" class="gt-404-card">
                <div class="gt-404-card-icon icon-qr">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3z"/><path d="M18 18h3v3h-3z"/></svg>
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.98rem;">QR Code Generator</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Instant vector & PNG QR codes</div>
                </div>
            </a>
            <a href="/en/tools/youtube-thumbnail-downloader" class="gt-404-card">
                <div class="gt-404-card-icon icon-thumb">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"/></svg>
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.98rem;">YouTube Thumbnail Downloader</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">4K Maxres & HD cover grabber</div>
                </div>
            </a>
            <a href="/en/tools/screen-recorder-studio" class="gt-404-card">
                <div class="gt-404-card-icon icon-rec">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.98rem;">Screen Recorder Studio</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Screen, audio & webcam capture</div>
                </div>
            </a>
            <a href="/en/tools/image-compressor" class="gt-404-card">
                <div class="gt-404-card-icon icon-compressor">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.98rem;">Image Compressor</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Lossless JPG, PNG & WebP compression</div>
                </div>
            </a>`;

    let rendered = tpl
        .replace(/<!--HTML_TAG-->/g, htmlTag)
        .replace(/<!--PAGE_TITLE-->/g, title)
        .replace(/<!--PAGE_DESC-->/g, desc)
        .replace(/<!--SITE_NAV-->/g, siteNav)
        .replace(/<!--ERR_TITLE-->/g, isAr ? 'الصفحة غير موجودة' : 'Page Not Found')
        .replace(/<!--ERR_DESC-->/g, isAr ? 'عذراً، الرابط الذي تحاول الوصول إليه غير متاح أو تم نقله. يمكنك البحث أو استكشاف مكتبة الأدوات والأقسام أدناه.' : 'Sorry, the page you requested could not be found. You can search or explore our tools catalog and categories below.')
        .replace(/<!--SEARCH_PLACEHOLDER-->/g, searchPlaceholder)
        .replace(/<!--CATEGORY_PILLS-->/g, catPills)
        .replace(/<!--POPULAR_TOOLS_TITLE-->/g, popToolsTitle)
        .replace(/<!--POPULAR_TOOLS_CARDS-->/g, popToolsCards)
        .replace(/<!--HOME_HREF-->/g, isAr ? '/' : '/en/')
        .replace(/<!--TOOLS_HREF-->/g, `${pfx}/tools`)
        .replace(/<!--BTN_HOME-->/g, isAr ? 'الصفحة الرئيسية' : 'Back to Home')
        .replace(/<!--BTN_TOOLS-->/g, isAr ? 'مكتبة الأدوات' : 'Explore Tools')
        .replace(/<!--SITE_FOOTER-->/g, siteFooter);

    if (!isAr) {
        rendered = prefixInternalLinksForEnglish(rendered);
    }

    rendered = ensureOfficialAdSenseInHead(rendered);

    const outPath = isAr
        ? path.join(ROOT_DIR, '404.html')
        : path.join(ROOT_DIR, 'en', '404.html');

    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log(`[GEN] Generated 404 Page: ${outPath}`);
}

// ==========================================
// K. SITEMAP.XML GENERATOR
// ==========================================
function generateSitemapXml() {
    const urls = [];
    const now = new Date().toISOString().split('T')[0];

    function addUrl(urlAr, urlEn, priority = '0.8', changefreq = 'weekly') {
        const hasEn = !isMissingTranslation(urlEn);
        urls.push({
            urlAr: `https://www.gtoolix.com${urlAr === '/' ? '/' : urlAr}`,
            urlEn: hasEn ? `https://www.gtoolix.com${urlEn}` : null,
            priority,
            changefreq,
            lastmod: now
        });
    }

    // Homepage
    addUrl('/', '/en/', '1.0', 'daily');

    // Section Indexes
    addUrl('/tools', '/en/tools', '0.9', 'daily');
    addUrl('/blog', '/en/blog', '0.9', 'daily');
    addUrl('/programs', '/en/programs', '0.9', 'weekly');

    // Active Tools
    toolsData.forEach(t => {
        addUrl(`/tools/${t.slug}`, `/en/tools/${t.slug}`, '0.9', 'weekly');
    });

    // Published Blog Articles
    blogData.forEach(a => {
        if (a.is_published !== false) {
            addUrl(`/blog/${a.slug}`, `/en/blog/${a.slug}`, '0.8', 'monthly');
        }
    });

    // Published Programs
    programsData.forEach(p => {
        if (p.is_published !== false) {
            addUrl(`/programs/${p.slug}`, `/en/programs/${p.slug}`, '0.8', 'monthly');
        }
    });

    // Static Pages
    const staticSlugs = [
        'about',
        'contact',
        'faq',
        'privacy-policy',
        'terms-of-service',
        'disclaimer',
        'cookies-policy',
        'dmca'
    ];
    staticSlugs.forEach(s => {
        addUrl(`/${s}`, `/en/${s}`, '0.6', 'monthly');
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    urls.forEach(entry => {
        // Arabic entry
        xml += `  <url>
    <loc>${entry.urlAr}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>\n`;

        // English entry (only if translation exists!)
        if (entry.urlEn) {
            xml += `  <url>
    <loc>${entry.urlEn}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>\n`;
        }
    });

    xml += `</urlset>\n`;

    const outPath = path.join(ROOT_DIR, 'sitemap.xml');
    fs.writeFileSync(outPath, xml, 'utf8');
    console.log(`[GEN] Generated Sitemap: ${outPath} (${urls.length} bilingual entries)`);
}

// ==========================================
// L. ROBOTS.TXT GENERATOR
// ==========================================
function generateRobotsTxt() {
    const content = `User-agent: *
Allow: /
Disallow: /data/
Disallow: /templates/
Disallow: /scripts/

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Mediapartners-Google
Allow: /

# Sitemaps
Sitemap: https://www.gtoolix.com/sitemap.xml
`;
    const outPath = path.join(ROOT_DIR, 'robots.txt');
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`[GEN] Generated robots.txt: ${outPath}`);
}

// ==========================================
// MASTER BUILD ORCHESTRATOR
// ==========================================
function buildAll() {
    console.log('====================================================');
    console.log('  GToolix Full Bilingual Migration Build Starting  ');
    console.log('====================================================');

    const missing = scanMissingTranslations();
    console.log(`[SCAN] Authoritative Missing Translations: ${missing.length}`);
    missing.forEach(m => console.log(`  - [${m.type}] ${m.urlEn} (${m.reason})`));

    // 1. Homepage
    generateHomePage('ar');
    generateHomePage('en');

    // 2. Tools Index
    generateToolsIndexPage('ar');
    generateToolsIndexPage('en');

    // 3. Active Tool Pages
    const activeToolSlugs = toolsData.map(t => t.slug);
    activeToolSlugs.forEach(slug => {
        generateToolPage(slug, 'ar');
        generateToolPage(slug, 'en');
    });

    // 4. Blog Index & Articles
    generateBlogIndexPage('ar');
    generateBlogIndexPage('en');
    try {
        const { execSync } = require('child_process');
        execSync('node scripts/generate-blog-articles.js', { stdio: 'inherit' });
    } catch (e) {
        console.warn('[WARN] Could not run generate-blog-articles:', e.message);
    }
    generateBlogArticleDynamic('ar');
    generateBlogArticleDynamic('en');

    // 5. Programs Index & Details
    generateProgramsIndexPage('ar');
    generateProgramsIndexPage('en');
    generateProgramDynamic('ar');
    generateProgramDynamic('en');

    // 6. Static / Legal Pages
    const staticSlugs = [
        'about',
        'faq',
        'privacy-policy',
        'terms-of-service',
        'disclaimer',
        'cookies-policy',
        'dmca'
    ];
    staticSlugs.forEach(slug => {
        generateStaticPage(slug, 'ar');
        generateStaticPage(slug, 'en');
    });

    // 7. Contact Page
    generateContactPage('ar');
    generateContactPage('en');

    // 8. 404 Error Pages
    generate404Page('ar');
    generate404Page('en');

    // 9. SEO Root Files
    generateSitemapXml();
    generateRobotsTxt();

    console.log('====================================================');
    console.log('  GToolix Full Bilingual Migration Build Complete!  ');
    console.log('====================================================');
}

if (require.main === module) {
    buildAll();
}

module.exports = {
    buildAll,
    scanMissingTranslations,
    isMissingTranslation,
    buildSeoHead,
    renderNavbar,
    renderFooter
};
