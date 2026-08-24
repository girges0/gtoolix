const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Tool Specific Details
const TOOL_CONFIGS = {
    'qr-code-generator': {
        slug: 'qr-code-generator',
        canonical: 'https://www.gtoolix.com/tools/qr-code-generator',
        nameEn: 'QR Code Generator',
        nameAr: 'مولد كود QR',
        i18nKey: 'qr.breadcrumbCurrent',
        file: path.join(ROOT_DIR, 'tools', 'qr-code-generator', 'index.html')
    },
    'youtube-thumbnail-downloader': {
        slug: 'youtube-thumbnail-downloader',
        canonical: 'https://www.gtoolix.com/tools/youtube-thumbnail-downloader',
        nameEn: 'YouTube Thumbnail Downloader',
        nameAr: 'تحميل صور اليوتيوب المصغرة',
        i18nKey: 'thumb.breadcrumbCurrent',
        file: path.join(ROOT_DIR, 'tools', 'youtube-thumbnail-downloader', 'index.html')
    },
    'gemini-watermark-remover': {
        slug: 'gemini-watermark-remover',
        canonical: 'https://www.gtoolix.com/tools/gemini-watermark-remover',
        nameEn: 'Gemini Watermark Remover',
        nameAr: 'مزيل علامة جيميناي',
        i18nKey: 'gemini.breadcrumbCurrent',
        file: path.join(ROOT_DIR, 'tools', 'gemini-watermark-remover', 'index.html')
    },
    'screen-recorder-studio': {
        slug: 'screen-recorder-studio',
        canonical: 'https://www.gtoolix.com/tools/screen-recorder-studio',
        nameEn: 'Screen Recorder Studio',
        nameAr: 'مسجل الشاشة الاحترافي',
        i18nKey: 'rec.breadcrumbCurrent',
        file: path.join(ROOT_DIR, 'tools', 'screen-recorder-studio', 'index.html')
    }
};

// URL replacements for hrefs and URLs
function replaceToolUrlsInContent(content) {
    let updated = content;

    // Replace old hrefs
    // Notice: replace /qr-code-generator with /tools/qr-code-generator
    // Be careful with already prefixed /tools/qr-code-generator
    updated = updated.replace(/href="\/qr-code-generator"/g, 'href="/tools/qr-code-generator"');
    updated = updated.replace(/href="\/youtube-thumbnail-downloader"/g, 'href="/tools/youtube-thumbnail-downloader"');
    updated = updated.replace(/href="\/gemini\/watermark-remover"/g, 'href="/tools/gemini-watermark-remover"');
    updated = updated.replace(/href="\/screen-recorder-studio"/g, 'href="/tools/screen-recorder-studio"');

    // Replace in Schema / Canonical / OpenGraph / Twitter
    updated = updated.replace(/https:\/\/www\.gtoolix\.com\/qr-code-generator/g, 'https://www.gtoolix.com/tools/qr-code-generator');
    updated = updated.replace(/https:\/\/www\.gtoolix\.com\/youtube-thumbnail-downloader/g, 'https://www.gtoolix.com/tools/youtube-thumbnail-downloader');
    updated = updated.replace(/https:\/\/www\.gtoolix\.com\/gemini\/watermark-remover/g, 'https://www.gtoolix.com/tools/gemini-watermark-remover');
    updated = updated.replace(/https:\/\/www\.gtoolix\.com\/screen-recorder-studio/g, 'https://www.gtoolix.com/tools/screen-recorder-studio');
    updated = updated.replace(/https:\/\/www\.gtoolix\.com\/tools\/screen-recorder(?=[#"\/,\s])/g, 'https://www.gtoolix.com/tools/screen-recorder-studio');

    return updated;
}

// Update Breadcrumb Navigation in tool pages
function updateBreadcrumbsInToolPage(toolKey, content) {
    const config = TOOL_CONFIGS[toolKey];
    if (!config) return content;

    let updated = content;

    // Standardize 3-level HTML Breadcrumb nav:
    // <nav class="tool-breadcrumbs">
    //     <a href="/" data-i18n="common.breadcrumbHome">الرئيسية</a>
    //     <span class="sep">/</span>
    //     <a href="/tools" data-i18n="common.navTools">الأدوات</a>
    //     <span class="sep">/</span>
    //     <span data-i18n="[i18nKey]">[nameAr]</span>
    // </nav>

    const breadcrumbRegex = /<nav class="tool-breadcrumbs">[\s\S]*?<\/nav>/;
    const newBreadcrumbNav = `<nav class="tool-breadcrumbs">
                        <a href="/" data-i18n="common.breadcrumbHome">الرئيسية</a>
                        <span class="sep">/</span>
                        <a href="/tools" data-i18n="common.navTools">الأدوات</a>
                        <span class="sep">/</span>
                        <span data-i18n="${config.i18nKey}">${config.nameAr}</span>
                    </nav>`;

    if (breadcrumbRegex.test(updated)) {
        updated = updated.replace(breadcrumbRegex, newBreadcrumbNav);
    }

    // Standardize 3-level Schema.org BreadcrumbList:
    const schemaBreadcrumbRegex = /{\s*"@type":\s*"BreadcrumbList"[\s\S]*?itemListElement":\s*\[[\s\S]*?\]\s*}/;
    const newSchemaBreadcrumb = `{
          "@type": "BreadcrumbList",
          "@id": "https://www.gtoolix.com/tools/${config.slug}#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://www.gtoolix.com/" },
            { "@type": "ListItem", "position": 2, "name": "الأدوات", "item": "https://www.gtoolix.com/tools" },
            { "@type": "ListItem", "position": 3, "name": "${config.nameAr}", "item": "https://www.gtoolix.com/tools/${config.slug}" }
          ]
        }`;

    if (schemaBreadcrumbRegex.test(updated)) {
        updated = updated.replace(schemaBreadcrumbRegex, newSchemaBreadcrumb);
    }

    return updated;
}

// Process all HTML files
function walkAndProcessHtmlFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'scratch') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkAndProcessHtmlFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = replaceToolUrlsInContent(content);

            // If it is a tool page, update its breadcrumbs
            for (const key of Object.keys(TOOL_CONFIGS)) {
                if (fullPath.includes(path.join('tools', key))) {
                    updated = updateBreadcrumbsInToolPage(key, updated);
                }
            }

            if (updated !== content) {
                fs.writeFileSync(fullPath, updated, 'utf8');
                console.log(`Updated URLs & breadcrumbs in: ${path.relative(ROOT_DIR, fullPath)}`);
            }
        }
    }
}

console.log('Starting URL restructure migration...');
walkAndProcessHtmlFiles(ROOT_DIR);
console.log('Migration complete!');
