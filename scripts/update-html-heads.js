const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const faviconTags = `    <!-- Favicon & PWA Suite -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">`;

function findHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'scratch') {
                results = results.concat(findHtmlFiles(filePath));
            }
        } else if (file.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const htmlFiles = findHtmlFiles(ROOT_DIR);

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Check if favicon tags need updating
    if (!content.includes('href="/favicon.svg"') || !content.includes('href="/site.webmanifest"')) {
        // Replace existing single favicon link
        if (content.includes('<link rel="icon" type="image/x-icon" href="/favicon.ico">')) {
            content = content.replace('<link rel="icon" type="image/x-icon" href="/favicon.ico">', faviconTags);
            modified = true;
        } else if (content.includes('<link rel="icon"')) {
            content = content.replace(/<link rel="icon"[^>]+>/g, '');
            content = content.replace(/<link rel="alternate icon"[^>]+>/g, '');
            content = content.replace(/<link rel="apple-touch-icon"[^>]+>/g, '');
            content = content.replace('</head>', `${faviconTags}\n</head>`);
            modified = true;
        } else if (content.includes('</head>')) {
            content = content.replace('</head>', `${faviconTags}\n</head>`);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated head in:', path.relative(ROOT_DIR, file));
    }
});

console.log('Finished updating HTML files.');
