// backend/utils/readDirectoryRecursive.js
const fs = require('fs');
const path = require('path');


const formatter = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function readDirectoryRecursive(dirPath) {
  const result = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    let stats = fs.statSync(fullPath);
    let size = stats.size;

    const item = {
      name: entry.name,
      path: fullPath,
      modified: formatter.format(stats.mtime),
      type: entry.isDirectory() ? 'folder' : 'file',
      size: formatSize(size),
    };

    if (entry.isDirectory()) {
      const children = readDirectoryRecursive(fullPath);
      item.children = children;
      size = children.reduce((sum, child) => {
        const numericSize = typeof child.size === 'string' ? parseFloat(child.size) : child.size;
        return sum + (isNaN(numericSize) ? 0 : numericSize);
      }, 0);
      item.size = formatSize(size);
    }

    result.push(item);
  }

  return result;
}

module.exports = readDirectoryRecursive;