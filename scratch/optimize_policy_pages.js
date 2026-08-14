const fs = require('fs');
const path = require('path');

const pages = [
  'about/index.html',
  'contact/index.html',
  'cookies-policy/index.html',
  'disclaimer/index.html',
  'dmca/index.html',
  'faq/index.html',
  'privacy-policy/index.html',
  'terms-of-service/index.html'
];

pages.forEach(relPath => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Add CSS preload if missing
  if (!content.includes('as="style"')) {
    content = content.replace(
      '<link rel="stylesheet" href="/static/css/main.min.css">',
      '<link rel="preload" href="/static/css/main.min.css" as="style">\n    <link rel="stylesheet" href="/static/css/main.min.css" id="gtoolix-main-css" fetchpriority="high">'
    );
  }

  // 2. Replace header logo.png with logo.webp picture tag
  content = content.replace(
    '<img src="/static/img/logo.png" alt="GToolix Logo" class="site-nav__logo-img" width="40" height="40">',
    '<picture><source srcset="/static/img/logo.webp" type="image/webp"><img src="/static/img/logo.webp" alt="GToolix Logo" class="site-nav__logo-img" width="40" height="40" loading="eager" fetchpriority="high"></picture>'
  );

  // 3. Replace footer logo.png with logo.webp picture tag
  content = content.replace(
    '<img src="/static/img/logo.png" alt="GToolix Logo" class="site-nav__logo-img" width="40" height="40">',
    '<picture><source srcset="/static/img/logo.webp" type="image/webp"><img src="/static/img/logo.webp" alt="GToolix Logo" class="site-nav__logo-img" width="40" height="40" loading="lazy"></picture>'
  );

  content = content.replace(
    '<img src="/static/img/logo.png" alt="GToolix Logo" class="footer-logo-img" width="36" height="36">',
    '<picture><source srcset="/static/img/logo.webp" type="image/webp"><img src="/static/img/logo.webp" alt="GToolix Logo" class="footer-logo-img" width="36" height="36" loading="lazy"></picture>'
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('[UPDATED]', relPath);
});
