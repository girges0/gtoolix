const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('Building minified assets with esbuild JS API...');

const cssFiles = [
    'static/css/main.css',
    'static/css/ads.css'
];

const jsFiles = [
    'static/js/theme.js',
    'static/js/app-init.js',
    'static/js/client.js',
    'static/js/ad-analytics.js',
    'static/js/ads-manager.js',
    'static/js/gemini-watermark-remover.js',
    'static/js/screen-recorder-tool.js',
    'static/js/qr-tool.js',
    'static/js/thumb-tool.js',
    'static/js/qrcode.js'
];

cssFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const ext = path.extname(file);
        const outFile = file.replace(ext, '.min' + ext);
        esbuild.buildSync({
            entryPoints: [file],
            outfile: outFile,
            minify: true,
            loader: { '.css': 'css' }
        });
    }
});

jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const ext = path.extname(file);
        const outFile = file.replace(ext, '.min' + ext);
        esbuild.buildSync({
            entryPoints: [file],
            outfile: outFile,
            minify: true
        });
    }
});

if (fs.existsSync('gemini-watermark-remover-main/src/sdk/index.js')) {
    console.log('Building Gemini core engine bundle from reference source...');
    esbuild.buildSync({
        entryPoints: ['gemini-watermark-remover-main/src/sdk/index.js'],
        bundle: true,
        format: 'iife',
        globalName: 'GeminiEngine',
        minify: true,
        outfile: 'static/js/gemini-engine.bundle.js'
    });
} else {
    console.log('Using pre-bundled Gemini core engine (static/js/gemini-engine.bundle.js)');
}

console.log('Asset minification complete!');
