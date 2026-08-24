const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const ARCHIVE_DIR = path.join(ROOT_DIR, 'archived_gemini_tool');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function copyFileIfExists(src, dest) {
    if (fs.existsSync(src)) {
        ensureDir(path.dirname(dest));
        fs.copyFileSync(src, dest);
    }
}

// 1. Create Archive
console.log('--- Archiving Gemini Tool ---');
ensureDir(ARCHIVE_DIR);

// Copy folders
copyDirRecursive(path.join(ROOT_DIR, 'gemini-watermark-remover'), path.join(ARCHIVE_DIR, 'gemini-watermark-remover'));
copyDirRecursive(path.join(ROOT_DIR, 'tools', 'gemini-watermark-remover'), path.join(ARCHIVE_DIR, 'tools', 'gemini-watermark-remover'));
copyDirRecursive(path.join(ROOT_DIR, 'tools', 'gemini'), path.join(ARCHIVE_DIR, 'tools', 'gemini'));
copyDirRecursive(path.join(ROOT_DIR, 'gemini'), path.join(ARCHIVE_DIR, 'gemini'));
copyDirRecursive(path.join(ROOT_DIR, 'en', 'tools', 'gemini-watermark-remover'), path.join(ARCHIVE_DIR, 'en', 'tools', 'gemini-watermark-remover'));

// Copy static JS
const staticJsFiles = [
    'gemini-watermark-remover.js',
    'gemini-watermark-remover.min.js',
    'gemini-engine.bundle.js',
    'gemini-core-engine.js'
];
staticJsFiles.forEach(f => {
    copyFileIfExists(path.join(ROOT_DIR, 'static', 'js', f), path.join(ARCHIVE_DIR, 'static', 'js', f));
});

// Save Gemini metadata from tools.json
const toolsJsonPath = path.join(ROOT_DIR, 'data', 'tools.json');
if (fs.existsSync(toolsJsonPath)) {
    const tools = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf8'));
    const geminiTool = tools.find(t => t.slug === 'gemini-watermark-remover' || t.slug === 'gemini');
    if (geminiTool) {
        fs.writeFileSync(path.join(ARCHIVE_DIR, 'gemini-tool-metadata.json'), JSON.stringify(geminiTool, null, 2), 'utf8');
    }
}

console.log('Gemini tool archived successfully into:', ARCHIVE_DIR);
