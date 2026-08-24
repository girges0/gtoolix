const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('Building minified assets with esbuild JS API...');

const cssFiles = [
    'static/css/main.css'
];

const jsFiles = [
    'static/js/lang-detect.js',
    'static/js/theme.js',
    'static/js/app-init.js',
    'static/js/client.js',
    'static/js/content-client.js',
    'static/js/screen-recorder-tool.js',
    'static/js/qr-tool.js',
    'tools/qr-code-generator/qr-tool.js',
    'static/js/thumb-tool.js',
    'static/js/qrcode.js',
    'tools/image-compressor/compressor.js'
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

console.log('Asset minification complete!');
