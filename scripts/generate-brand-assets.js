const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Root directory
const ROOT_DIR = path.resolve(__dirname, '..');
const STATIC_IMG_DIR = path.join(ROOT_DIR, 'static', 'img');

if (!fs.existsSync(STATIC_IMG_DIR)) {
    fs.mkdirSync(STATIC_IMG_DIR, { recursive: true });
}

// 1. Define Standalone Icon SVG (favicon.svg & logo-icon.svg)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818CF8"/>
      <stop offset="45%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>
    <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#818CF8"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818CF8" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Squircle -->
  <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#bgGrad)"/>
  <rect x="24" y="24" width="464" height="464" rx="112" fill="none" stroke="url(#borderGrad)" stroke-width="6"/>

  <!-- Geometric G + Tool Spark Icon -->
  <g transform="translate(256, 256)" filter="url(#glow)">
    <!-- Main Outer Arc of G -->
    <path d="M 85,-110 C 25,-145 -65,-135 -115,-80 C -160,-30 -165,55 -125,110 C -80,165 30,165 85,120 C 130,85 140,25 140,-10 L 10,-10 C 0,-10 -5,0 -5,10 L -5,15 C -5,35 10,48 30,48 L 72,48 C 70,72 45,95 10,98 C -35,102 -90,75 -95,15 C -100,-45 -50,-90 10,-95 C 45,-98 70,-85 85,-70"
          fill="url(#gGrad)"/>

    <!-- Dynamic Spark / Tool Element -->
    <path d="M -15,-40 L 45,-120 L 25,-40 L 75,-40 L -5,40 L 10,-20 Z" fill="url(#sparkGrad)"/>
  </g>
</svg>`;

// 2. Define Primary Logo SVG (Icon + "GToolix" Text)
const primaryLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="800" height="200">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818CF8"/>
      <stop offset="45%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>
    <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#818CF8"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
    <linearGradient id="subGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#818CF8"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>

  <!-- Icon Section -->
  <g transform="translate(10, 10)">
    <rect x="10" y="10" width="160" height="160" rx="40" fill="url(#bgGrad)"/>
    <rect x="10" y="10" width="160" height="160" rx="40" fill="none" stroke="url(#gGrad)" stroke-width="3" stroke-opacity="0.5"/>
    <g transform="translate(90, 90) scale(0.35)">
      <path d="M 85,-110 C 25,-145 -65,-135 -115,-80 C -160,-30 -165,55 -125,110 C -80,165 30,165 85,120 C 130,85 140,25 140,-10 L 10,-10 C 0,-10 -5,0 -5,10 L -5,15 C -5,35 10,48 30,48 L 72,48 C 70,72 45,95 10,98 C -35,102 -90,75 -95,15 C -100,-45 -50,-90 10,-95 C 45,-98 70,-85 85,-70" fill="url(#gGrad)"/>
      <path d="M -15,-40 L 45,-120 L 25,-40 L 75,-40 L -5,40 L 10,-20 Z" fill="url(#sparkGrad)"/>
    </g>
  </g>

  <!-- Typography Section -->
  <text x="210" y="118" font-family="'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif" font-weight="700" font-size="78" fill="url(#textGrad)" letter-spacing="-1.5">GTool<tspan fill="url(#gGrad)">ix</tspan></text>
  <text x="215" y="152" font-family="'Inter', system-ui, sans-serif" font-weight="600" font-size="18" fill="url(#subGrad)" letter-spacing="4">ONLINE TOOLS PLATFORM</text>
</svg>`;

// 3. Open Graph HTML Template (1200x630)
const ogHtmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 630px;
    background: #030712;
    font-family: 'Inter', sans-serif;
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 70px 80px;
    position: relative;
    overflow: hidden;
  }
  
  /* Background decorative glow spots */
  .glow-1 {
    position: absolute;
    top: -120px;
    right: -100px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(3, 7, 18, 0) 70%);
    pointer-events: none;
  }
  .glow-2 {
    position: absolute;
    bottom: -150px;
    left: -100px;
    width: 650px;
    height: 650px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(3, 7, 18, 0) 70%);
    pointer-events: none;
  }
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 24px;
    z-index: 2;
  }
  .logo-box {
    width: 88px;
    height: 88px;
    background: linear-gradient(135deg, #0F172A 0%, #020617 100%);
    border: 2px solid rgba(99, 102, 241, 0.4);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.3);
  }
  .brand-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 56px;
    font-weight: 700;
    letter-spacing: -1px;
    color: #FFFFFF;
  }
  .brand-name span {
    color: #6366F1;
  }
  .badge {
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #818CF8;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 16px;
    font-weight: 600;
    margin-left: 16px;
    letter-spacing: 0.5px;
  }

  .main-content {
    z-index: 2;
    margin-top: 20px;
  }
  .hero-title {
    font-size: 48px;
    font-weight: 700;
    line-height: 1.2;
    background: linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    max-width: 900px;
    margin-bottom: 16px;
  }
  .hero-desc {
    font-size: 22px;
    color: #94A3B8;
    max-width: 850px;
    line-height: 1.5;
  }

  .tools-grid {
    display: flex;
    gap: 16px;
    z-index: 2;
  }
  .tool-pill {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    padding: 14px 22px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 17px;
    font-weight: 600;
    color: #E2E8F0;
  }
  .tool-pill svg {
    width: 22px;
    height: 22px;
    color: #38BDF8;
  }
</style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>
  <div class="grid-pattern"></div>

  <div class="header">
    <div class="logo-box">
      ${faviconSvg.replace('width="512" height="512"', 'width="64" height="64"')}
    </div>
    <div class="brand-name">GTool<span>ix</span></div>
    <div class="badge">FREE & INSTANT</div>
  </div>

  <div class="main-content">
    <h1 class="hero-title">Powerful High-Performance Web Tools Platform</h1>
    <p class="hero-desc">100% Free, Instant Processing, Zero Server Uploads & No Watermarks.</p>
  </div>

  <div class="tools-grid">
    <div class="tool-pill">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
      QR Code Generator
    </div>
    <div class="tool-pill">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      4K YouTube Thumbnail Grabber
    </div>
    <div class="tool-pill">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      Gemini AI Watermark Remover
    </div>
    <div class="tool-pill">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      Screen Recorder Studio
    </div>
  </div>
</body>
</html>`;

// Simple ICO generator function that wraps PNG buffers into standard ICO format
function createIco(pngBuffers) {
    const numImages = pngBuffers.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    let offset = headerSize + numImages * dirEntrySize;

    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Image type: 1 = ICO
    header.writeUInt16LE(numImages, 4);

    const dirEntries = [];
    const imageBuffers = [];

    for (const img of pngBuffers) {
        const entry = Buffer.alloc(dirEntrySize);
        entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
        entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
        entry.writeUInt8(0, 2); // Palette colors
        entry.writeUInt8(0, 3); // Reserved
        entry.writeUInt16LE(1, 4); // Color planes
        entry.writeUInt16LE(32, 6); // Bits per pixel
        entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
        entry.writeUInt32LE(offset, 12); // Offset of image data

        dirEntries.push(entry);
        imageBuffers.push(img.buffer);
        offset += img.buffer.length;
    }

    return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

async function main() {
    console.log('Generating SVG branding files...');

    // Save SVG files
    fs.writeFileSync(path.join(ROOT_DIR, 'favicon.svg'), faviconSvg, 'utf8');
    fs.writeFileSync(path.join(STATIC_IMG_DIR, 'logo-icon.svg'), faviconSvg, 'utf8');
    fs.writeFileSync(path.join(STATIC_IMG_DIR, 'logo-primary.svg'), primaryLogoSvg, 'utf8');

    console.log('Starting Playwright headless browser to render PNGs...');
    const browser = await chromium.launch();
    const context = await browser.newContext({ deviceScaleFactor: 1 });
    const page = await context.newPage();

    // Helper to render SVG string to PNG buffer at exact width/height
    async function renderSvgToPng(svgStr, width, height) {
        await page.setViewportSize({ width, height });
        const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${svgStr.replace(/width="[^\"]+"/, `width="${width}"`).replace(/height="[^\"]+"/, `height="${height}"`)}</body></html>`;
        await page.setContent(html);
        return await page.screenshot({ omitBackground: true, type: 'png' });
    }

    // 1. Generate Favicon PNG sizes
    console.log('Rendering Favicon PNGs...');
    const p16 = await renderSvgToPng(faviconSvg, 16, 16);
    fs.writeFileSync(path.join(ROOT_DIR, 'favicon-16x16.png'), p16);

    const p32 = await renderSvgToPng(faviconSvg, 32, 32);
    fs.writeFileSync(path.join(ROOT_DIR, 'favicon-32x32.png'), p32);
    fs.writeFileSync(path.join(STATIC_IMG_DIR, 'favicon-32.png'), p32);

    const p48 = await renderSvgToPng(faviconSvg, 48, 48);
    fs.writeFileSync(path.join(ROOT_DIR, 'favicon-48x48.png'), p48);

    const p180 = await renderSvgToPng(faviconSvg, 180, 180);
    fs.writeFileSync(path.join(ROOT_DIR, 'apple-touch-icon.png'), p180);
    fs.writeFileSync(path.join(STATIC_IMG_DIR, 'apple-touch-icon.png'), p180);

    const p192 = await renderSvgToPng(faviconSvg, 192, 192);
    fs.writeFileSync(path.join(ROOT_DIR, 'android-chrome-192x192.png'), p192);
    fs.writeFileSync(path.join(STATIC_IMG_DIR, 'icon-192.png'), p192);

    const p512 = await renderSvgToPng(faviconSvg, 512, 512);
    fs.writeFileSync(path.join(ROOT_DIR, 'android-chrome-512x512.png'), p512);
    fs.writeFileSync(path.join(STATIC_IMG_DIR, 'icon-512.png'), p512);

    // 2. Generate Favicon ICO
    console.log('Generating favicon.ico multi-resolution file...');
    const icoBuffer = createIco([
        { width: 16, height: 16, buffer: p16 },
        { width: 32, height: 32, buffer: p32 },
        { width: 48, height: 48, buffer: p48 }
    ]);
    fs.writeFileSync(path.join(ROOT_DIR, 'favicon.ico'), icoBuffer);

    // 3. Render Header/Site Logo PNG & WebP
    console.log('Rendering site logo.png & logo.webp...');
    const logoPng = await renderSvgToPng(primaryLogoSvg, 800, 200);
    fs.writeFileSync(path.join(STATIC_IMG_DIR, 'logo.png'), logoPng);
    fs.writeFileSync(path.join(STATIC_IMG_DIR, 'logo.webp'), logoPng);

    // 4. Render Open Graph Banner (1200x630)
    console.log('Rendering og-image.png (1200x630)...');
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(ogHtmlContent);
    await page.waitForLoadState('networkidle');
    const ogBuffer = await page.screenshot({ type: 'png' });
    fs.writeFileSync(path.join(ROOT_DIR, 'og-image.png'), ogBuffer);
    fs.writeFileSync(path.join(STATIC_IMG_DIR, 'og-image.png'), ogBuffer);

    await browser.close();
    console.log('All brand assets generated successfully!');
}

main().catch(err => {
    console.error('Error generating assets:', err);
    process.exit(1);
});
