const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Files/directories to exclude
const exclude = ['node_modules', '.git', 'public', 'package.json', 'package-lock.json', 
                 'vercel.json', '.vercel', 'build.js', 'DEPLOYMENT_QUICK_START.md', 
                 'GITHUB_DEPLOYMENT_GUIDE.md', 'netlify.toml', '.gitignore'];

// File extensions to exclude
const excludeExtensions = ['.sql', '.md'];

// Copy all files to public directory
fs.readdirSync('.').forEach(file => {
  if (exclude.includes(file)) return;
  
  const ext = path.extname(file);
  if (excludeExtensions.includes(ext)) return;
  
  const stat = fs.statSync(file);
  if (stat.isFile()) {
    fs.copyFileSync(file, path.join('public', file));
    console.log(`Copied ${file} to public/`);
  }
});

console.log('Build complete!');

