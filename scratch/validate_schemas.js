const fs = require('fs');
const path = require('path');

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

const htmlFiles = findHtmlFiles('c:/Users/Girges/Desktop/toolshub-social-downloader');
let errorsCount = 0;

htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
    let match;
    let index = 0;
    while ((match = regex.exec(content)) !== null) {
        index++;
        const jsonStr = match[1].trim();
        try {
            const parsed = JSON.parse(jsonStr);
            console.log(`[OK] ${path.relative('c:/Users/Girges/Desktop/toolshub-social-downloader', file)} - JSON-LD #${index} valid`);
        } catch (e) {
            console.error(`[ERROR] ${path.relative('c:/Users/Girges/Desktop/toolshub-social-downloader', file)} - JSON-LD #${index} INVALID JSON:`, e.message);
            errorsCount++;
        }
    }
});

console.log(`\nValidation complete. Total JSON-LD errors: ${errorsCount}`);
