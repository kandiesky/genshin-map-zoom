/**
 * Build & packaging script for Genshin Map Zoom Extender
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Packaging Genshin Map Zoom Extender ---');

// 1. Run icon generator
console.log('1. Checking icons...');
require('./generate_icons.js');

// 2. Syntax check
console.log('2. Syntax checking JS files...');
execSync('node --check extension/inject.js', { stdio: 'inherit' });
execSync('node --check extension/content.js', { stdio: 'inherit' });
execSync('node --check extension/popup/popup.js', { stdio: 'inherit' });
execSync('node --check genshin-map-zoom.user.js', { stdio: 'inherit' });
console.log('   All JS files passed syntax check!');

// 3. Compress extension to .zip and .xpi
console.log('3. Creating .xpi and .zip packages...');
try {
  execSync('powershell -Command "Compress-Archive -Path extension\\* -DestinationPath genshin-map-zoom.xpi -Force"', { stdio: 'inherit' });
  execSync('powershell -Command "Compress-Archive -Path extension\\* -DestinationPath genshin-map-zoom.zip -Force"', { stdio: 'inherit' });
  console.log('   genshin-map-zoom.xpi created successfully!');
  console.log('   genshin-map-zoom.zip created successfully!');
} catch (e) {
  console.error('   Compression failed:', e.message);
}

console.log('\nBuild complete!');
console.log('Files ready:');
console.log(' - extension/ (Descompactada para carregar no about:debugging)');
console.log(' - genshin-map-zoom.xpi (Arquivo de extensão para Waterfox/Firefox)');
console.log(' - genshin-map-zoom.user.js (UserScript para Violentmonkey/Tampermonkey)');
