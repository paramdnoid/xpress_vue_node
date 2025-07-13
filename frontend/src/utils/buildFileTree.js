/**
 * Converts a flat array of file/folder descriptors into a hierarchical tree structure
 * suitable for tree‑view UI components.
 *
 * @param {Array<{path: string, name: string, type: 'file' | 'folder'}>} flatFiles
 *   Flat list as delivered by the backend.
 * @returns {Array<Object>} Hierarchical representation where folders include a `children` array.
 */
function buildFileTree(flatFiles) {
  const pathMap = {};
  const root = [];

  // First pass: create path map and initialize children arrays
  flatFiles.forEach(file => {
    file.children = file.type === 'folder' ? [] : undefined;
    pathMap[file.path] = file;
  });

  // Second pass: build tree structure
  flatFiles.forEach(file => {
    const segments = file.path.split('/');
    if (segments.length === 1) {
      // Root level item
      root.push(file);
    } else {
      // Nested item - find parent
      const parentPath = segments.slice(0, -1).join('/');
      const parent = pathMap[parentPath];
      if (parent && parent.children) {
        parent.children.push(file);
      } else {
        // Parent not found or not a directory - add to root as fallback
        console.warn(`Parent not found for ${file.path}, adding to root`);
        root.push(file);
      }
    }
  });

  // Sort each level of the tree
  const sortLevel = (items) => {
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    
    // Recursively sort children
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        sortLevel(item.children);
      }
    });
  };

  sortLevel(root);
  return root;
}

export { buildFileTree };