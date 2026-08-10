const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('index.html', 'utf8');

// Replace English default text in index.html with Arabic text (since default html lang="ar" dir="rtl")
html = html.replace('No installs. No signup. Just tools.', 'بدون تثبيت • بدون تسجيل • أدوات مجانية');
html = html.replace('Every tool you actually reach for — in one weightless dock.', 'كل أداة تحتاجها فعلاً — في مكان واحد يطفو على الإنترنت');
html = html.replace("Generate QR codes, grab YouTube thumbnails, and remove\n                        Gemini watermarks in seconds. Free, fast, and built to feel like nothing else you've used.", 'أنشئ أكواد QR، حمّل صور اليوتيوب المصغرة بدقة 4K، وأزل العلامة المائية لـ Gemini فوراً. مجاني بالكامل وبدون حساب.');
html = html.replace('Explore the tools', 'استكشف الأدوات');
html = html.replace('Remove Gemini Watermark', 'مزيل علامة جيميناي');

fs.writeFileSync('scratch/arabic_index.html', html);

const server = http.createServer((req, res) => {
    let url = req.url.split('?')[0];
    let filePath;
    if (url === '/' || url === '/index.html') {
        filePath = './scratch/arabic_index.html';
    } else {
        filePath = '.' + url;
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(8097, () => {
    console.log('Arabic test server running on http://127.0.0.1:8097/');
    try {
        console.log('Running Lighthouse Desktop audit on matching Arabic HTML text ...');
        execSync('npx lighthouse http://127.0.0.1:8097/ --preset=desktop --output=json --output-path=scratch/lh_arabic_desktop.json --chrome-flags="--headless"', { stdio: 'inherit' });
        
        const d = JSON.parse(fs.readFileSync('scratch/lh_arabic_desktop.json'));
        console.log('\n=== DESKTOP RESULTS WITH MATCHING ARABIC HTML TEXT ===');
        console.log('Performance:', d.categories.performance?.score * 100);
        console.log('Accessibility:', d.categories.accessibility?.score * 100);
        console.log('Best Practices:', d.categories['best-practices']?.score * 100);
        console.log('SEO:', d.categories.seo?.score * 100);
        if (d.categories['agentic-browsing']) {
            console.log('Agentic Browsing:', d.categories['agentic-browsing'].score * 100);
        }
        console.log('CLS:', d.audits['cumulative-layout-shift']?.displayValue, '(numeric:', d.audits['cumulative-layout-shift']?.numericValue, ')');
        console.log('TBT:', d.audits['total-blocking-time']?.displayValue);
        console.log('LCP:', d.audits['largest-contentful-paint']?.displayValue);

        const clsDetails = d.audits['layout-shifts']?.details;
        if (clsDetails && clsDetails.items) {
            console.log('\nLayout shifts items:', JSON.stringify(clsDetails.items, null, 2));
        }
    } catch (err) {
        console.error('Error running lighthouse:', err.message);
    } finally {
        server.close();
        console.log('Server closed.');
    }
});
