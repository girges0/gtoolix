const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building minified assets with esbuild...');

const cssFiles = [
    'static/css/main.css'
];

const jsFiles = [
    'static/js/theme.js',
    'static/js/client.js',
    'static/js/ad-analytics.js',
    'static/js/gemini-watermark-remover.js',
    'static/js/screen-recorder-tool.js',
    'static/js/qr-tool.js',
    'static/js/thumb-tool.js'
];

cssFiles.forEach(file => {
    const ext = path.extname(file);
    const outFile = file.replace(ext, '.min' + ext);
    execSync(`npx esbuild "${file}" --minify --outfile="${outFile}"`, { stdio: 'inherit' });
});

jsFiles.forEach(file => {
    const ext = path.extname(file);
    const outFile = file.replace(ext, '.min' + ext);
    execSync(`npx esbuild "${file}" --minify --outfile="${outFile}"`, { stdio: 'inherit' });
});

console.log('Building Gemini core engine bundle from reference source...');
execSync('npx esbuild gemini-watermark-remover-main/src/sdk/index.js --bundle --format=iife --global-name=GeminiEngine --minify --outfile=static/js/gemini-engine.bundle.js', { stdio: 'inherit' });

console.log('Asset minification complete!');
