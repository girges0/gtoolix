const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const blogData = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data', 'blog.json'), 'utf8'));
const qrData = blogData.find(b => b.slug === 'qr-code');

// Parse markdown sections from content_ar and content_en
function parseMarkdownToSections(md) {
    const lines = md.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
        const h2Match = line.match(/^##\s+(\d+\.?\s*.*)$/);
        if (h2Match) {
            if (currentSection) {
                sections.push(currentSection);
            }
            const title = h2Match[1].trim();
            const id = 'sec-' + (sections.length + 1);
            currentSection = { id, title, content: '' };
        } else if (currentSection) {
            currentSection.content += line + '\n';
        }
    });

    if (currentSection) {
        sections.push(currentSection);
    }

    // Convert section content markdown to HTML paragraphs, bold, lists, tables
    return sections.map(sec => {
        let html = sec.content
            .replace(/\r/g, '')
            .replace(/###\s+(.*)/g, '<h3 style="font-size:1.25rem;font-weight:700;margin:1.25rem 0 0.5rem;">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code style="background:var(--card);padding:0.15rem 0.4rem;border-radius:4px;border:1px solid var(--border);">$1</code>')
            .replace(/^>\s+💡\s+(.*)$/gm, '<div class="tip-box" style="background:rgba(37,99,235,0.08);border-left:4px solid var(--primary);padding:1rem;border-radius:8px;margin:1rem 0;">💡 $1</div>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--primary);font-weight:600;text-decoration:underline;">$1</a>')
            .replace(/^-\s+(.*)$/gm, '<li>$1</li>')
            .replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');

        // Wrap paragraphs
        const paragraphs = html.split('\n\n').map(p => {
            p = p.trim();
            if (!p) return '';
            if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<table') || p.startsWith('<li>')) {
                if (p.startsWith('<li>')) return `<ul style="margin-inline-start:1.5rem;line-height:1.8;">${p}</ul>`;
                return p;
            }
            return `<p style="line-height:1.8;margin-bottom:1rem;">${p}</p>`;
        }).join('\n');

        return {
            id: sec.id,
            title: sec.title,
            content: paragraphs
        };
    });
}

// Extract FAQs from content
function extractFaqsFromContent(content) {
    const faqIndex = content.indexOf('## الأسئلة الشائعة') !== -1 ? content.indexOf('## الأسئلة الشائعة') : content.indexOf('## Frequently Asked Questions');
    if (faqIndex === -1) return [];
    const faqText = content.substring(faqIndex);
    const qMatches = faqText.match(/###\s+([^\n]+)\n+([^\n#]+)/g) || [];
    return qMatches.map(m => {
        const parts = m.split('\n').filter(p => p.trim());
        const q = parts[0].replace(/###\s+/, '').trim();
        const a = parts.slice(1).join(' ').trim();
        return { q, a };
    });
}

const arSections = parseMarkdownToSections(qrData.content_ar.split('## الأسئلة الشائعة')[0]);
const enSections = parseMarkdownToSections(qrData.content_en.split('## Frequently Asked Questions')[0]);

const arFaqs = extractFaqsFromContent(qrData.content_ar);
const enFaqs = extractFaqsFromContent(qrData.content_en);

const faqs = arFaqs.map((af, i) => {
    const ef = enFaqs[i] || { q: af.q, a: af.a };
    return {
        q_ar: af.q,
        a_ar: af.a,
        q_en: ef.q,
        a_en: ef.a
    };
});

console.log(`Parsed QR Code Article:`);
console.log(` - Arabic Sections: ${arSections.length}`);
console.log(` - English Sections: ${enSections.length}`);
console.log(` - Total FAQs: ${faqs.length}`);

const qrCodeArticle = {
    slug: 'qr-code',
    toolSlug: 'qr-code-generator',
    publishedDate: '2026-08-18T08:00:00+03:00',
    modifiedDate: '2026-08-24T16:00:00+03:00',
    readingTimeMinutes: 15,
    imageUrl: '/static/img/blog/qr-code-guide.jpg',
    imageUrlEn: '/static/img/blog/qr-code-guide-en.jpg',
    author: 'GToolix Editorial Team',

    title_ar: 'QR Code: الدليل الشامل لإنشاء واستخدام وقراءة رموز QR مجاناً أونلاين | GToolix',
    meta_desc_ar: 'دليل موسوعي متكامل ومفصل حول رموز QR: تاريخها، بنيتها الهندسية، تصحيح الأخطاء Reed-Solomon، الفرق بين Static و Dynamic، وطريقة إنشاء باركود QR مجاني فائق النقاء.',
    keywords_ar: 'QR Code, ما هو QR Code, رمز QR, مولد QR Code, QR Code Generator, إنشاء QR Code, إنشاء رمز QR, عمل QR Code, تحويل رابط إلى QR Code, QR Code مجاني, Free QR Code Generator, GToolix',

    title_en: 'QR Code: The Ultimate Guide to Creating, Using & Scanning QR Codes Online | GToolix',
    meta_desc_en: 'Comprehensive guide to QR Codes: history, matrix architecture, Reed-Solomon error correction, static vs dynamic, and generating high-res vector QR codes for URLs, Wi-Fi, and vCards.',
    keywords_en: 'QR Code, QR Code Generator, create QR code online, free QR code, WiFi QR code, vCard QR code, vector SVG QR code, high resolution QR code, barcode vs QR code, GToolix',

    kicker_ar: 'دليل أدوات الويب والإنتاجية الرقمية',
    kicker_en: 'Web Tools & Digital Productivity Guide',
    h1_ar: 'QR Code — الدليل الشامل لإنشاء واستخدام وقراءة رموز QR مجاناً أونلاين',
    h1_en: 'QR Code: The Ultimate Guide to Creating, Using & Scanning QR Codes Online',
    lead_ar: 'دليل موسوعي مفصل يشرح تاريخ رموز الاستجابة السريعة QR، بنيتها الهندسية، نظام تصحيح الأخطاء Reed-Solomon، الفرق الجوهري بين الرموز الثابتة والديناميكية، وطريقة توليد باركود تفاعلي فائق النقاء مجاناً.',
    lead_en: 'An in-depth encyclopedic guide covering QR code matrix architecture, Reed-Solomon mathematical error correction, static vs. dynamic workflows, and generating high-resolution vector codes for websites, Wi-Fi networks, and business cards.',

    cta_title_ar: 'أنشئ رمز QR مخصصاً وعالي الدقة الآن مجاناً',
    cta_title_en: 'Create Custom High-Resolution QR Codes Free',
    cta_desc_ar: 'حوّل الروابط، النصوص، بطاقات vCard، وشبكات الواي فاي إلى رموز QR احترافية قابلة للتحميل بصيغتي PNG و SVG فائقة النقاء دون أي علامة مائية وبأمان 100%.',
    cta_desc_en: 'Convert URLs, text, vCards, and Wi-Fi credentials into crisp PNG and vector SVG QR codes with 100% client-side privacy and zero watermarks.',
    cta_btn_ar: 'افتح مولد رمز QR مجاناً ←',
    cta_btn_en: 'Open Free QR Code Generator →',

    sections_ar: arSections,
    sections_en: enSections,
    faqs: faqs
};

module.exports = { qrCodeArticle };
