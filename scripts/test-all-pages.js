const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { chromium } = require('playwright');

const PORT = 3099;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=UTF-8',
    '.xml': 'application/xml; charset=UTF-8'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Apply Vercel Dynamic Rewrites Simulation
    if (pathname.startsWith('/blog/') && pathname !== '/blog/' && pathname !== '/blog/index.html') {
        const sub = pathname.replace(/^\/blog\//, '').replace(/\/+$/, '');
        if (sub && sub !== 'article.html' && sub !== 'index.html' && !sub.includes('.')) {
            const possibleFolder = path.join(ROOT_DIR, 'blog', sub, 'index.html');
            if (!fs.existsSync(possibleFolder)) {
                pathname = '/blog/article.html';
            }
        }
    } else if (pathname.startsWith('/en/blog/') && pathname !== '/en/blog/' && pathname !== '/en/blog/index.html') {
        const sub = pathname.replace(/^\/en\/blog\//, '').replace(/\/+$/, '');
        if (sub && sub !== 'article.html' && sub !== 'index.html' && !sub.includes('.')) {
            const possibleFolder = path.join(ROOT_DIR, 'en', 'blog', sub, 'index.html');
            if (!fs.existsSync(possibleFolder)) {
                pathname = '/en/blog/article.html';
            }
        }
    } else if (pathname.startsWith('/programs/') && pathname !== '/programs/' && pathname !== '/programs/index.html') {
        const sub = pathname.replace(/^\/programs\//, '').replace(/\/+$/, '');
        if (sub && sub !== 'program.html' && sub !== 'index.html' && !sub.includes('.')) {
            const possibleFolder = path.join(ROOT_DIR, 'programs', sub, 'index.html');
            if (!fs.existsSync(possibleFolder)) {
                pathname = '/programs/program.html';
            }
        }
    } else if (pathname.startsWith('/en/programs/') && pathname !== '/en/programs/' && pathname !== '/en/programs/index.html') {
        const sub = pathname.replace(/^\/en\/programs\//, '').replace(/\/+$/, '');
        if (sub && sub !== 'program.html' && sub !== 'index.html' && !sub.includes('.')) {
            const possibleFolder = path.join(ROOT_DIR, 'en', 'programs', sub, 'index.html');
            if (!fs.existsSync(possibleFolder)) {
                pathname = '/en/programs/program.html';
            }
        }
    }

    let filePath = path.join(ROOT_DIR, pathname);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        if (fs.existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
        } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
            filePath = path.join(filePath, 'index.html');
        }
    }

    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(`<h1>404 Not Found</h1><p>Cannot GET ${req.url}</p>`);
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server error: ' + err.code);
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content);
        }
    });
});

async function runTests() {
    await new Promise(resolve => server.listen(PORT, resolve));
    console.log(`Server started on http://localhost:${PORT}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    const routesToTest = [
        '/',
        '/en/',
        '/tools',
        '/en/tools',
        '/tools/qr-code-generator',
        '/en/tools/qr-code-generator',
        '/tools/youtube-thumbnail-downloader',
        '/en/tools/youtube-thumbnail-downloader',
        '/tools/screen-recorder-studio',
        '/en/tools/screen-recorder-studio',
        '/tools/image-compressor',
        '/en/tools/image-compressor',
        '/blog',
        '/en/blog',
        '/blog/qr-code',
        '/en/blog/qr-code',
        '/blog/image-compression-guide',
        '/en/blog/image-compression-guide',
        '/blog/jpg-vs-png-vs-webp',
        '/en/blog/jpg-vs-png-vs-webp',
        '/programs',
        '/en/programs',
        '/about',
        '/en/about',
        '/contact',
        '/en/contact',
        '/faq',
        '/en/faq',
        '/privacy-policy',
        '/en/privacy-policy',
        '/terms-of-service',
        '/en/terms-of-service',
        '/disclaimer',
        '/en/disclaimer',
        '/cookies-policy',
        '/en/cookies-policy',
        '/dmca',
        '/en/dmca',
        '/404.html'
    ];

    const results = {
        passed: 0,
        failed: 0,
        errors: []
    };

    for (const route of routesToTest) {
        const page = await context.newPage();
        const pageErrors = [];
        const failedRequests = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (!text.includes('pagead2') && !text.includes('googleads') && !text.includes('favicon.ico')) {
                    pageErrors.push(`Console error: ${text}`);
                }
            }
        });

        page.on('pageerror', err => {
            pageErrors.push(`Page error: ${err.message}`);
        });

        page.on('response', resp => {
            if (resp.status() >= 400 && !resp.url().includes('pagead') && !resp.url().includes('google') && !resp.url().includes('supabase')) {
                failedRequests.push(`HTTP ${resp.status()} on ${resp.url()}`);
            }
        });

        try {
            const resp = await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
            const status = resp ? resp.status() : 0;

            await page.waitForTimeout(600);

            if (status >= 400 && route !== '/404.html') {
                pageErrors.push(`Page returned status ${status}`);
            }

            if (pageErrors.length > 0 || failedRequests.length > 0) {
                results.failed++;
                results.errors.push({
                    route,
                    errors: [...pageErrors, ...failedRequests]
                });
                console.log(`❌ FAIL [${route}]:`, [...pageErrors, ...failedRequests].join('; '));
            } else {
                results.passed++;
                console.log(`✅ PASS [${route}]`);
            }
        } catch (e) {
            results.failed++;
            results.errors.push({
                route,
                errors: [`Navigation crashed: ${e.message}`]
            });
            console.log(`❌ CRASH [${route}]: ${e.message}`);
        } finally {
            await page.close();
        }
    }

    await browser.close();
    server.close();

    console.log('\n======================================');
    console.log(`Total Tested: ${routesToTest.length}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log('======================================');

    if (results.failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
});
