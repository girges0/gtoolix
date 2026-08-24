const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function getAllHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (['node_modules', '.git', 'scratch'].includes(file)) return;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllHtmlFiles(fullPath));
        } else if (file.endsWith('.html')) {
            results.push(fullPath);
        }
    });
    return results;
}

const htmlFiles = getAllHtmlFiles(ROOT_DIR);
console.log(`Auditing and cleaning ${htmlFiles.length} HTML files...`);

let backdropsFixed = 0;
let h1Fixed = 0;

htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Clean duplicate nav-backdrops
    const backdropMatches = content.match(/<div\s+class=["']nav-backdrop["'][^>]*><\/div>/g) || [];
    if (backdropMatches.length > 1) {
        let firstDone = false;
        content = content.replace(/<div\s+class=["']nav-backdrop["'][^>]*><\/div>\s*/g, () => {
            if (!firstDone) {
                firstDone = true;
                return '<div class="nav-backdrop" id="nav-backdrop" onclick="toggleNav(true)"></div>\n';
            }
            return '';
        });
        modified = true;
        backdropsFixed++;
        console.log(`[FIX] Deduplicated ${backdropMatches.length} nav-backdrops in: ${path.relative(ROOT_DIR, filePath)}`);
    }

    // 2. Fix 404 / Not-Found duplicate H1s in dynamic fallback templates
    if (filePath.endsWith('program.html') || filePath.endsWith('article.html')) {
        // Replace secondary h1 in not-found block with h2
        if (content.includes('id="prog-not-found"') || content.includes('id="not-found"')) {
            const updatedContent = content.replace(/(<div\s+id=["'](?:prog-not-found|not-found)["'][\s\S]*?)<h1([^>]*)>([\s\S]*?)<\/h1>/gi, (m, before, attrs, inner) => {
                return `${before}<h2${attrs}>${inner}</h2>`;
            });
            if (updatedContent !== content) {
                content = updatedContent;
                modified = true;
                h1Fixed++;
                console.log(`[FIX] Converted fallback not-found H1 to H2 in: ${path.relative(ROOT_DIR, filePath)}`);
            }
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
});

console.log(`\nCleanup summary:`);
console.log(` - Backdrops fixed in: ${backdropsFixed} files`);
console.log(` - H1 duplicates fixed in: ${h1Fixed} files`);
