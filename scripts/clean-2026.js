const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Clean generate-blog-articles.js
function cleanGenerateBlogArticles() {
    const filePath = path.join(ROOT_DIR, 'scripts', 'generate-blog-articles.js');
    let code = fs.readFileSync(filePath, 'utf8');

    const exactReplacements = [
        ['title_ar: \'أفضل طريقة لضغط الصور بدون فقدان الجودة: الدليل التقني الشامل 2026 | GToolix\',', 'title_ar: \'أفضل طريقة لضغط الصور بدون فقدان الجودة: الدليل الشامل | GToolix\','],
        ['title_en: \'Best Way to Compress Images Without Losing Quality: Complete Technical Guide 2026 | GToolix\',', 'title_en: \'Best Way to Compress Images Without Losing Quality: Complete Guide | GToolix\','],
        ['h1_ar: \'أفضل طريقة لضغط الصور بدون فقدان الجودة: الدليل التقني الشامل 2026\',', 'h1_ar: \'أفضل طريقة لضغط الصور بدون فقدان الجودة: الدليل الشامل\','],
        ['h1_en: \'The Ultimate Guide to Image Compression Without Losing Quality (2026)\',', 'h1_en: \'The Ultimate Guide to Image Compression Without Losing Quality\','],
        ['title: \'1. ما هو ضغط الصور الرقمية ولماذا هو العامل الحاسم لنجاح المواقع في 2026؟\',', 'title: \'1. ما هو ضغط الصور الرقمية ولماذا هو العامل الحاسم لنجاح المواقع الحديثة؟\','],
        ['في المشهد الرقمي لعام 2026، تشير تقارير', 'في المشهد الرقمي المعاصر، تشير تقارير'],
        ['بين أبرز 5 تنسيقات للويب في 2026:', 'بين أبرز 5 تنسيقات للويب الحديث:'],
        ['alt="أفضل طريقة لضغط الصور بدون فقدان الجودة 2026"', 'alt="أفضل طريقة لضغط الصور بدون فقدان الجودة"'],
        ['title: \'1. What is Digital Image Compression and Why Does It Define Web Success in 2026?\',', 'title: \'1. What is Digital Image Compression and Why Does It Define Modern Web Success?\','],
        ['In 2026, data from the global HTTP Archive reveals', 'In the modern digital landscape, data from the global HTTP Archive reveals'],
        ["evaluates the web's 5 dominant image codecs in 2026:", "evaluates the web's 5 dominant image codecs:"],
        ['alt="Best Way to Compress Images Without Losing Quality 2026"', 'alt="Best Way to Compress Images Without Losing Quality"'],
        ['title_ar: \'الفرق بين JPG و PNG و WebP: أيهما تختار ولمواقع الويب في 2026؟ | GToolix\',', 'title_ar: \'الفرق بين JPG و PNG و WebP: أيهما تختار ولمواقع الويب؟ | GToolix\','],
        ['title_en: \'JPG vs PNG vs WebP: Which Image Format Should You Choose in 2026? | GToolix\',', 'title_en: \'JPG vs PNG vs WebP: Which Image Format Should You Choose? | GToolix\','],
        ['h1_ar: \'الفرق بين JPG و PNG و WebP: أيهما تختار ولمواقع الويب في 2026؟\',', 'h1_ar: \'الفرق بين JPG و PNG و WebP: أيهما تختار ولمواقع الويب؟\','],
        ['h1_en: \'JPG vs PNG vs WebP: Which Image Format Should You Choose in 2026?\',', 'h1_en: \'JPG vs PNG vs WebP: Which Image Format Should You Choose?\','],
        ['title: \'5. الوافد الجديد AVIF: هل يطيح بـ WebP في عام 2026؟\',', 'title: \'5. الوافد الجديد AVIF: هل يطيح بـ WebP في بيئات الويب الحديثة؟\','],
        ['title: \'5. The Next-Gen Challenger: Will AVIF Surpass WebP in 2026?\',', 'title: \'5. The Next-Gen Challenger: Will AVIF Surpass WebP in Modern Web Platforms?\','],
        ['q_ar: "لماذا تعتبر صيغة WebP الخيار الأفضل لمواقع الويب في 2026؟",', 'q_ar: "لماذا تعتبر صيغة WebP الخيار الأفضل لمواقع الويب الحديثة؟",'],
        ['q_en: "Why is WebP the recommended format for modern websites in 2026?",', 'q_en: "Why is WebP the recommended format for modern websites?",'],
        ['q_ar: "هل تدعم جميع المتصفحات صيغة WebP في 2026؟",', 'q_ar: "هل تدعم جميع المتصفحات صيغة WebP؟",'],
        ['q_en: "Is WebP universally supported across all browsers in 2026?",', 'q_en: "Is WebP universally supported across all browsers?",']
    ];

    exactReplacements.forEach(([from, to]) => {
        if (!code.includes(from)) {
            console.warn('[WARN] exact string not found:', from.slice(0, 45));
        } else {
            code = code.split(from).join(to);
            console.log('[OK] Replaced:', from.slice(0, 45));
        }
    });

    // Replace Catalog
    const catalogString = `const ALL_BLOG_ARTICLES_CATALOG = [
    {
        slug: 'free-youtube-thumbnail-downloader-hd-4k',
        title_ar: 'تحميل الصور المصغرة لليوتيوب بجودة HD و4K: الدليل الشامل',
        title_en: 'Free YouTube Thumbnail Downloader HD & 4K: Complete Guide',
        desc_ar: 'دليل شامل لاستخراج وتحميل صور اليوتيوب وشورتس بدقة 1080p و 720p MaxRes وهندسة الـ CTR وجداول الأبعاد.',
        desc_en: 'Complete technical guide to downloading YouTube and Shorts thumbnails in MaxRes HD with zero software installation.',
        tag_ar: 'يوتيوب',
        tag_en: 'YouTube Tools',
        img_ar: '/static/img/blog/youtube-thumbnails-guide.jpg',
        img_en: '/static/img/blog/youtube-thumbnails-guide.jpg'
    },
    {
        slug: 'qr-code',
        title_ar: 'دليل رموز QR Code الشامل: إنشاء واستخدام وقراءة الباركود',
        title_en: 'QR Code: The Ultimate Guide to Creating, Scanning & Using QR Codes',
        desc_ar: 'دليل هندسي موسوعي يغطي البنية التشريحية وتصحيح الأخطاء واستخدام مولد QR المجاني لتوليد رموز بدقة فائقة.',
        desc_en: 'Comprehensive technical guide exploring QR anatomy, Reed-Solomon error correction, and vector QR generation with zero upload.',
        tag_ar: 'أدوات الويب',
        tag_en: 'Web Tools',
        img_ar: '/static/img/blog/qr-code-guide.jpg',
        img_en: '/static/img/blog/qr-code-guide-en.jpg'
    },
    {
        slug: 'image-compression-guide',
        title_ar: 'أفضل طريقة لضغط الصور بدون فقدان الجودة: الدليل الشامل',
        title_en: 'Best Way to Compress Images Without Losing Quality: Complete Guide',
        desc_ar: 'دليل موسوعي يشرح خوارزميات الضغط وفصل الفضاء اللوني وتحسين Core Web Vitals وسرعة المتاجر مع GToolix.',
        desc_en: 'Encyclopedic guide on compression mathematics, SSIM fidelity metrics, responsive HTML5, and Core Web Vitals optimization.',
        tag_ar: 'ضغط الصور',
        tag_en: 'Image Optimization',
        img_ar: '/static/img/blog/image-compression.jpg',
        img_en: '/static/img/blog/image-compression.jpg'
    },
    {
        slug: 'jpg-vs-png-vs-webp',
        title_ar: 'الفرق بين JPG و PNG و WebP: أيهما تختار ولمواقع الويب؟',
        title_en: 'JPG vs PNG vs WebP: Which Image Format Should You Choose?',
        desc_ar: 'مقارنة تقنية شاملة بين JPG و PNG و WebP و AVIF و SVG: الفروق في الحجم، دعم الشفافية، وعمق الألوان وسرعة التحميل.',
        desc_en: 'Technical benchmark comparing JPG, PNG, WebP, AVIF, and SVG for modern web performance, alpha transparency, and SEO.',
        tag_ar: 'تنسيقات الويب',
        tag_en: 'Web Formats',
        img_ar: '/static/img/blog/formats-comparison.jpg',
        img_en: '/static/img/blog/formats-comparison.jpg'
    }
];`;

    const catalogRegex = /const ALL_BLOG_ARTICLES_CATALOG = \[[\s\S]*?\];/;
    if (catalogRegex.test(code)) {
        code = code.replace(catalogRegex, catalogString);
        console.log('[OK] Catalog replaced successfully');
    } else {
        console.warn('[WARN] Catalog regex did not match');
    }

    // Replace buildAllBlogArticles body
    const buildFnRegex = /function buildAllBlogArticles\(\) \{[\s\S]*?buildAllBlogArticles\(\);/;
    const newBuildFn = `function buildAllBlogArticles() {
    let qrCodeArticle = null;
    try {
        qrCodeArticle = require('./build-qr-clean.js').qrCodeArticle;
    } catch (e) {
        console.warn('[WARN] Could not load qrCodeArticle:', e.message);
    }

    let youtubeThumbnailArticle = null;
    try {
        youtubeThumbnailArticle = require('./create-youtube-thumbnail-article.js').youtubeThumbnailArticle;
    } catch (e) {
        console.warn('[WARN] Could not load youtubeThumbnailArticle:', e.message);
    }

    const articles = [imageCompressionArticle, formatsComparisonArticle];
    if (qrCodeArticle) {
        articles.unshift(qrCodeArticle);
    }
    if (youtubeThumbnailArticle) {
        articles.push(youtubeThumbnailArticle);
    }

    articles.forEach(art => {
        // Arabic HTML
        const arHtml = generateFullBlogArticlePage(art, 'ar');
        const arPath = path.join(ROOT_DIR, 'blog', art.slug, 'index.html');
        ensureDir(path.dirname(arPath));
        fs.writeFileSync(arPath, arHtml, 'utf8');
        console.log(\`[GEN] Generated Deep Blog Article (AR): \${arPath}\`);

        // English HTML
        const enHtml = generateFullBlogArticlePage(art, 'en');
        const enPath = path.join(ROOT_DIR, 'en', 'blog', art.slug, 'index.html');
        ensureDir(path.dirname(enPath));
        fs.writeFileSync(enPath, enHtml, 'utf8');
        console.log(\`[GEN] Generated Deep Blog Article (EN): \${enPath}\`);
    });
}

buildAllBlogArticles();`;

    if (buildFnRegex.test(code)) {
        code = code.replace(buildFnRegex, newBuildFn);
        console.log('[OK] buildAllBlogArticles replaced successfully');
    } else {
        console.warn('[WARN] buildAllBlogArticles regex did not match');
    }

    fs.writeFileSync(filePath, code, 'utf8');
    console.log('[SUCCESS] Cleaned generate-blog-articles.js');
}

// 2. Clean data/blog.json
function cleanBlogJson() {
    const blogJsonPath = path.join(ROOT_DIR, 'data', 'blog.json');
    let blogData = JSON.parse(fs.readFileSync(blogJsonPath, 'utf8'));

    blogData = blogData.map(item => {
        if (item.title_ar) {
            item.title_ar = item.title_ar
                .replace(/:\s*الدليل التقني الشامل 2026/g, ': الدليل الشامل')
                .replace(/:\s*الدليل الشامل 2026/g, ': الدليل الشامل')
                .replace(/في 2026/g, '')
                .replace(/2026/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }
        if (item.title_en) {
            item.title_en = item.title_en
                .replace(/:\s*Complete Technical Guide 2026/g, ': Complete Guide')
                .replace(/:\s*Complete Guide 2026/g, ': Complete Guide')
                .replace(/\(2026\)/g, '')
                .replace(/in 2026/g, '')
                .replace(/2026/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }
        if (item.excerpt_ar) {
            item.excerpt_ar = item.excerpt_ar.replace(/2026/g, '').replace(/\s+/g, ' ').trim();
        }
        if (item.excerpt_en) {
            item.excerpt_en = item.excerpt_en.replace(/2026/g, '').replace(/\s+/g, ' ').trim();
        }
        return item;
    });

    fs.writeFileSync(blogJsonPath, JSON.stringify(blogData, null, 2), 'utf8');
    console.log('[SUCCESS] Cleaned data/blog.json');
}

// 3. Clean blog/index.html and en/blog/index.html
function cleanBlogIndexPages() {
    const arIndex = path.join(ROOT_DIR, 'blog', 'index.html');
    const enIndex = path.join(ROOT_DIR, 'en', 'blog', 'index.html');

    [arIndex, enIndex].forEach(f => {
        if (fs.existsSync(f)) {
            let html = fs.readFileSync(f, 'utf8');
            html = html
                .replace(/الدليل التقني الشامل 2026/g, 'الدليل الشامل')
                .replace(/الدليل الشامل 2026/g, 'الدليل الشامل')
                .replace(/Complete Technical Guide 2026/g, 'Complete Guide')
                .replace(/Complete Guide 2026/g, 'Complete Guide')
                .replace(/في 2026/g, '')
                .replace(/in 2026/g, '')
                .replace(/\(2026\)/g, '');
            fs.writeFileSync(f, html, 'utf8');
            console.log('[SUCCESS] Cleaned:', f);
        }
    });
}

cleanGenerateBlogArticles();
cleanBlogJson();
cleanBlogIndexPages();
