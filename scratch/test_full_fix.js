const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Prepare modified index.html in scratch
let html = fs.readFileSync('index.html', 'utf8');

// Change &display=swap to &display=optional in Google Fonts URL
html = html.replace(/display=swap/g, 'display=optional');

fs.writeFileSync('scratch/fix_index.html', html);

// 2. Prepare modified main.css in scratch
let css = fs.readFileSync('static/css/main.css', 'utf8');

// Add min-height to tool-chip-card and site-nav__links to prevent layout shift during font init
const cssAdditions = `
/* Layout shift protection for desktop orbit chips and nav */
.tool-chip-card {
    min-height: 54px;
    box-sizing: border-box;
}
.site-nav__links a {
    min-height: 38px;
    box-sizing: border-box;
}
`;
css = css + '\n' + cssAdditions;

fs.writeFileSync('scratch/fix_main.css', css);

console.log('Scratch test files created successfully.');
