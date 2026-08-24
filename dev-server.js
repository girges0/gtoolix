// =====================================================================
// GToolix Zero-Dependency Local Dev Server
// Simulates Vercel dynamic rewrites & cleanUrls for local testing.
// Usage: node dev-server.js [port]
// =====================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.argv[2] || process.env.PORT || 3000, 10);
const ROOT_DIR = __dirname;

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

    // If directory, look for index.html
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
        res.end(`<h1>404 Not Found</h1><p>Cannot GET ${escapeHtml(req.url)}</p>`);
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

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

server.listen(PORT, () => {
    console.log(`🚀 [GToolix Dev Server] Running at: http://localhost:${PORT}`);
    console.log(`💡 Vercel rewrites simulated: /blog/:slug -> /blog/article.html, /programs/:slug -> /programs/program.html`);
});
