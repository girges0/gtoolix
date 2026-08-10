const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static server
function startServer(port) {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
            if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
                filePath = path.join(__dirname, '..', 'index.html');
            }
            const ext = path.extname(filePath);
            const mimeTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'text/javascript',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon'
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not found');
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                }
            });
        });
        server.listen(port, () => resolve(server));
    });
}

async function measure(viewport, isMobile) {
    const server = await startServer(8085);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: viewport,
        isMobile: isMobile,
        deviceScaleFactor: isMobile ? 2 : 1
    });
    const page = await context.newPage();

    // Track layout shifts
    let cls = 0;
    await page.addInitScript(() => {
        window.clsValue = 0;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    window.clsValue += entry.value;
                }
            }
        }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto('http://localhost:8085/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const measuredCLS = await page.evaluate(() => window.clsValue);
    const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find(p => p.name === 'first-contentful-paint');
        return {
            fcp: fcp ? fcp.startTime : 0,
            loadTime: timing.loadEventEnd - timing.navigationStart
        };
    });

    await browser.close();
    server.close();
    return { cls: measuredCLS, fcp: metrics.fcp, loadTime: metrics.loadTime };
}

async function run() {
    console.log('Testing Mobile (375x667)...');
    const mobile = await measure({ width: 375, height: 667 }, true);
    console.log(`Mobile Results -> CLS: ${mobile.cls.toFixed(4)}, FCP: ${mobile.cls.toFixed(1)}ms`);

    console.log('\nTesting Desktop (1280x800)...');
    const desktop = await measure({ width: 1280, height: 800 }, false);
    console.log(`Desktop Results -> CLS: ${desktop.cls.toFixed(4)}, FCP: ${desktop.fcp.toFixed(1)}ms`);
}

run();
