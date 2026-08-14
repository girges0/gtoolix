const fs = require('fs');
const glob = [
    'qr-code-generator/index.html',
    'gemini/watermark-remover/index.html',
    'screen-recorder-studio/index.html',
    'tools/thumbnail/index.html',
    'tools/qr/index.html',
    'tools/gemini/index.html',
    'tools/screen-recorder/index.html',
    'about/index.html',
    'privacy-policy/index.html',
    'terms-of-service/index.html',
    'cookies-policy/index.html',
    'disclaimer/index.html',
    'dmca/index.html',
    'faq/index.html',
    'contact/index.html'
];

glob.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace class="reveal" (without in-view) with class="reveal in-view"
    const updated = content.replace(/class="([^"]*)\breveal\b(?!\s+in-view)([^"]*)"/g, (match, p1, p2) => {
        return `class="${p1}reveal in-view${p2}"`;
    });
    if (updated !== content) {
        fs.writeFileSync(filePath, updated);
        console.log('Added in-view to reveal elements in:', filePath);
    }
});
