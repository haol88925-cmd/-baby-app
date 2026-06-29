const fs = require('fs');
const path = require('path');

const basePath = '/-baby-app/';
const distDir = path.join(__dirname, '..', 'dist');

function patchFile(filePath) {
  const ext = path.extname(filePath);
  if (!['.html', '.js', '.css'].includes(ext)) return;

  const original = fs.readFileSync(filePath, 'utf8');
  const patched = original.replace(/(["'(:])\/(_expo|assets)\//g, `$1${basePath}$2/`);

  if (patched !== original) {
    fs.writeFileSync(filePath, patched);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else {
      patchFile(fullPath);
    }
  }
}

if (!fs.existsSync(distDir)) {
  throw new Error('dist directory not found. Run expo export before preparing GitHub Pages.');
}

walk(distDir);
fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
