import { useFileStore } from '@/stores/files'

const CHUNK_SIZE = 1024 * 1024;

export async function uploadFilesInChunks(files, currentPath = '') {
  const fileStore = useFileStore();
  
  // Input validation
  if (!files || !Array.isArray(files) || files.length === 0) {
    console.warn('No files provided for upload');
    return;
  }

  // Normalize currentPath
  const normalizedPath = currentPath.replace(/^\/+|\/+$/g, '');
  
  try {
    for (const file of files) {
      //console.log(`Starting upload for file: ${file.name}, size: ${file.size} bytes`);
      
      // Skip empty files
      if (file.size === 0) {
        console.warn(`Skipping empty file: ${file.name}`);
        continue;
      }

      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const fileId = crypto.randomUUID();
      
      //console.log(`File will be split into ${totalChunks} chunks`);

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Build the relative path more carefully
        const relPath = file.webkitRelativePath || file.relativePath || file.name;
        const fullPath = normalizedPath 
          ? `${normalizedPath}/${relPath}`.replace(/\/+/g, '/')
          : relPath;
        // Remove leading slash if present
        const cleanPath = fullPath.replace(/^\/+/, '');

        // Enqueue the chunk immediately (don't await)
        fileStore.uploadFile({
          chunkFile: chunk,
          fullFileName: cleanPath,
          chunkIndex,
          totalChunks,
          userId: null // Optional: Hier UserId einfügen, falls nötig
        });
        // Optionally log for debugging
        //console.log(`Enqueued chunk ${chunkIndex + 1}/${totalChunks} for ${file.name}`);
      }
      
      //console.log(`Successfully completed upload for file: ${file.name}`);
    }
    
    //console.log('All files uploaded successfully');
  } catch (error) {
    console.error('Upload process failed:', error);
    throw error;
  }
}