const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/Girges/Desktop/toolshub-social-downloader';

function findHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                results = results.concat(findHtmlFiles(filePath));
            }
        } else if (file.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const htmlFiles = findHtmlFiles(rootDir);
const issues = [];

htmlFiles.forEach(file => {
    const relFile = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');

    // Check src="..."
    const srcMatches = content.matchAll(/src=["']([^"']+)["']/g);
    for (const match of srcMatches) {
        const src = match[1];
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) continue;
        
        let localPath;
        if (src.startsWith('/')) {
            localPath = path.join(rootDir, src.slice(1));
        } else {
            localPath = path.join(path.dirname(file), src);
        }

        if (!fs.existsSync(localPath)) {
            issues.push({ file: relFile, type: 'MISSING SRC', target: src, resolved: localPath });
        }
    }

    // Check link href="..."
    const hrefMatches = content.matchAll(/href=["']([^"']+)["']/g);
    for (const match of hrefMatches) {
        const href = match[1];
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#') || href.startsWith('javascript:')) continue;

        let cleanHref = href.split('#')[0].split('?')[0];
        if (!cleanHref) continue;

        let localPath;
        if (cleanHref.startsWith('/')) {
            localPath = path.join(rootDir, cleanHref.slice(1));
        } else {
            localPath = path.join(path.dirname(file), cleanHref);
        }

        // If localPath is directory or root file
        let exists = fs.existsSync(localPath);
        if (!exists && fs.existsSync(localPath + '.html')) {
            exists = true;
        } else if (!exists && fs.existsSync(path.join(localPath, 'index.html'))) {
            exists = true;
        }

        if (!exists) {
            issues.push({ file: relFile, type: 'BROKEN LINK', target: href, resolved: localPath });
        }
    }
});

console.log(`Link checking finished. Total issues: ${issues.length}`);
issues.forEach(i => console.log(`[${i.type}] ${i.file} -> ${i.target}`));
