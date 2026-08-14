const fs = require('fs');
const html = fs.readFileSync('qr-code-generator/index.html', 'utf8');

// Match tags containing Arabic text without data-i18n attribute
const arabicRegex = /<([a-z1-6]+)(?![^>]*data-i18n)[^>]*>([^<]*[\u0600-\u06FF]+[^<]*)<\/\1>/gi;
let match;
console.log('--- UNTAGGED ARABIC ELEMENTS ---');
let count = 0;
while ((match = arabicRegex.exec(html)) !== null) {
    count++;
    console.log(`[${count}] Tag: <${match[1]}> Text: "${match[2].trim()}"`);
}
if (count === 0) {
    console.log('Zero untagged Arabic elements found!');
}
