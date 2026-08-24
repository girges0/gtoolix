const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function removeDirRecursive(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`[DELETED DIR] ${dirPath}`);
    }
}

function removeFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[DELETED FILE] ${filePath}`);
    }
}

console.log('--- Removing Live Gemini Directories and Files ---');

// 1. Remove live directories
removeDirRecursive(path.join(ROOT_DIR, 'gemini-watermark-remover'));
removeDirRecursive(path.join(ROOT_DIR, 'tools', 'gemini-watermark-remover'));
removeDirRecursive(path.join(ROOT_DIR, 'tools', 'gemini'));
removeDirRecursive(path.join(ROOT_DIR, 'gemini'));
removeDirRecursive(path.join(ROOT_DIR, 'en', 'tools', 'gemini-watermark-remover'));

// 2. Remove live JS files in static/js
const filesToRemove = [
    path.join(ROOT_DIR, 'static', 'js', 'gemini-watermark-remover.js'),
    path.join(ROOT_DIR, 'static', 'js', 'gemini-watermark-remover.min.js'),
    path.join(ROOT_DIR, 'static', 'js', 'gemini-engine.bundle.js'),
    path.join(ROOT_DIR, 'static', 'js', 'gemini-core-engine.js')
];
filesToRemove.forEach(removeFile);

console.log('Live Gemini assets successfully cleaned!');
