// backend/utils/readDirectoryRecursive.js
const fs = require('fs');
const path = require('path');

function readDirectoryRecursive(dirPath) {
  const result = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const item = {
      name: entry.name,
      path: fullPath,
      type: entry.isDirectory() ? 'folder' : 'file',
    };

    if (entry.isDirectory()) {
      item.children = readDirectoryRecursive(fullPath); // recursion
    }

    result.push(item);
  }

  return result;
}

module.exports = readDirectoryRecursive;