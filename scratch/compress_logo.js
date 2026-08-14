const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function compressLogo() {
    const canvas = createCanvas(128, 128);
    const ctx = canvas.getContext('2d');
    const img = await loadImage('static/img/logo.png');
    ctx.drawImage(img, 0, 0, 128, 128);
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync('static/img/logo.png', buf);
    console.log('New logo.png size:', buf.length);
}

compressLogo().catch(err => {
    console.error('Canvas compress error:', err.message);
});
