const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync('static/css/main.css', 'utf8');

// Collect all html and js files
function getAllFiles(dir, exts) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'scratch') {
                results = results.concat(getAllFiles(filePath, exts));
            }
        } else {
            if (exts.includes(path.extname(filePath))) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const sourceFiles = getAllFiles('.', ['.html', '.js']);
const sourceTexts = sourceFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// Extract class selectors e.g. .class-name
const classRegex = /\.([a-zA-Z0-9_-]+)/g;
let match;
const classesInCss = new Set();
while ((match = classRegex.exec(cssContent)) !== null) {
    // Exclude numbers or pseudo states
    const cls = match[1];
    if (!/^\d+$/.test(cls)) {
        classesInCss.add(cls);
    }
}

console.log('Total unique classes in CSS:', classesInCss.size);
const unusedClasses = [];

classesInCss.forEach(cls => {
    // Search if class appears in any HTML or JS source file
    const regex = new RegExp('\\b' + cls + '\\b');
    if (!regex.test(sourceTexts)) {
        unusedClasses.push(cls);
    }
});

console.log('Unused classes across ENTIRE site (0 occurrences in HTML/JS):', unusedClasses.length);
console.log(unusedClasses.slice(0, 50));
