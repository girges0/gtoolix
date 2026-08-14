const fs = require('fs');
const html = fs.readFileSync('youtube-thumbnail-downloader/index.html', 'utf8');

const keysInHtml = [];
const regex = /data-i18n="([^"]+)"/g;
let match;
while ((match = regex.exec(html)) !== null) {
    keysInHtml.push(match[1]);
}

const transMatch = html.match(/const translations = (\{[\s\S]+?\n        \};)/);
if (!transMatch) {
    console.error('translations object not found!');
    process.exit(1);
}

let translations;
eval('translations = ' + transMatch[1]);

const dig = (obj, key) => key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);

console.log('Total keys in HTML:', keysInHtml.length);
console.log('\n--- MISSING IN ENGLISH ---');
const missingEn = [];
keysInHtml.forEach(k => {
    const val = dig(translations.en, k);
    if (!val) {
        missingEn.push(k);
        console.log('Missing EN:', k, '-> AR default:', dig(translations.ar, k));
    }
});

console.log('\n--- MISSING IN ARABIC ---');
keysInHtml.forEach(k => {
    const val = dig(translations.ar, k);
    if (!val) {
        console.log('Missing AR:', k);
    }
});
