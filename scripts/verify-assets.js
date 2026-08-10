const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Map endpoints to local files or rewrites
const rewrites = {
    '/': 'index.html',
    '/favicon.ico': 'favicon.ico',
    '/favicon.svg': 'favicon.svg',
    '/favicon-16x16.png': 'favicon-16x16.png',
    '/favicon-32x32.png': 'favicon-32x32.png',
    '/favicon-48x48.png': 'favicon-48x48.png',
    '/apple-touch-icon.png': 'apple-touch-icon.png',
    '/android-chrome-192x192.png': 'android-chrome-192x192.png',
    '/android-chrome-512x512.png': 'android-chrome-512x512.png',
    '/site.webmanifest': 'site.webmanifest',
    '/manifest.json': 'manifest.json',
    '/robots.txt': 'robots.txt',
    '/sitemap.xml': 'sitemap.xml',
    '/og-image.png': 'og-image.png',
    '/qr-code-generator': 'tools/qr/index.html',
    '/youtube-thumbnail-downloader': 'tools/thumbnail/index.html',
    '/gemini-watermark-remover': 'tools/gemini/index.html',
    '/screen-recorder-studio': 'screen-recorder-studio/index.html',
    '/about': 'about/index.html',
    '/privacy-policy': 'privacy-policy/index.html',
    '/terms-of-service': 'terms-of-service/index.html',
    '/disclaimer': 'disclaimer/index.html',
    '/cookies-policy': 'cookies-policy/index.html',
    '/dmca': 'dmca/index.html',
    '/faq': 'faq/index.html',
    '/contact': 'contact/index.html'
};

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = rewrites[reqPath] ? path.join(ROOT_DIR, rewrites[reqPath]) : path.join(ROOT_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mime = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(48921, '127.0.0.1', async () => {
    console.log('Test server running at http://127.0.0.1:48921/');

    const endpoints = Object.keys(rewrites);
    let failures = 0;

    for (const ep of endpoints) {
        await new Promise((resolve) => {
            http.get(`http://127.0.0.1:48921${ep}`, (res) => {
                let bytes = 0;
                res.on('data', chunk => bytes += chunk.length);
                res.on('end', () => {
                    if (res.statusCode === 200 && bytes > 0) {
                        console.log(`[PASS] ${ep} -> 200 OK (${bytes} bytes, ${res.headers['content-type']})`);
                    } else {
                        console.error(`[FAIL] ${ep} -> Status: ${res.statusCode}, Bytes: ${bytes}`);
                        failures++;
                    }
                    resolve();
                });
            }).on('error', err => {
                console.error(`[FAIL] ${ep} -> Error: ${err.message}`);
                failures++;
                resolve();
            });
        });
    }

    server.close(() => {
        if (failures === 0) {
            console.log('\nAll endpoints verified successfully with HTTP 200 OK!');
            process.exit(0);
        } else {
            console.error(`\nAsset verification failed with ${failures} errors.`);
            process.exit(1);
        }
    });
});
