const fs = require('fs');
const path = require('path');

const qrToolJs = fs.readFileSync(path.join(__dirname, '../static/js/qr-tool.js'), 'utf8');
const qrToolMinJs = fs.readFileSync(path.join(__dirname, '../static/js/qr-tool.min.js'), 'utf8');

console.log('Checking qr-tool.js...');
if (qrToolJs.includes("const isAr = (localStorage.getItem('siteLang') || 'ar') === 'ar'")) {
    console.error('❌ FAIL: qr-tool.js still contains legacy siteLang check');
    process.exit(1);
} else {
    console.log('✅ PASS: qr-tool.js uses getLang() correctly!');
}

console.log('Checking qr-tool.min.js...');
if (qrToolMinJs.includes('(localStorage.getItem("siteLang")||"ar")==="ar"')) {
    console.error('❌ FAIL: qr-tool.min.js still contains legacy siteLang check');
    process.exit(1);
} else {
    console.log('✅ PASS: qr-tool.min.js is rebuilt with getLang()!');
}
