const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'package.json');
const destPath = path.join(__dirname, 'dist', 'package.json');

fs.copyFile(srcPath, destPath, (err) => {
  if (err) throw err;
  console.log('package.json was copied to dist folder');
});