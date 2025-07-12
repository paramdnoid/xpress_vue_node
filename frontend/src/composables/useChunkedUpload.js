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

        //console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunk.size} bytes)`);

        const formData = new FormData();
        
        // Build the relative path more carefully
        const relPath = file.webkitRelativePath || file.relativePath || file.name;
        const fullPath = normalizedPath 
          ? `${normalizedPath}/${relPath}`.replace(/\/+/g, '/')
          : relPath;
        
        // Remove leading slash if present
        const cleanPath = fullPath.replace(/^\/+/, '');
        
        //console.log(`Upload path: ${cleanPath}`);

        // Append form data with consistent naming
        formData.append('fileId', fileId);
        formData.append('relativePath', cleanPath);
        formData.append('file', chunk, file.name);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('originalName', file.name);
        formData.append('chunkSize', chunk.size.toString());

        try {

          //console.log('Uploading chunk:', { cleanPath, chunkIndex, totalChunks });
          await fileStore.uploadFile({
            chunkFile: chunk,
            fullFileName: cleanPath,
            chunkIndex,
            totalChunks,
            userId: null // Optional: Hier UserId einfügen, falls nötig
          });



          
          //console.log(`Successfully uploaded chunk ${chunkIndex + 1}/${totalChunks} for ${file.name}`);
        } catch (chunkError) {
          console.error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks} for ${file.name}:`, chunkError);
          throw new Error(`Upload failed for ${file.name} at chunk ${chunkIndex + 1}: ${chunkError.message}`);
        }
      }
      
      //console.log(`Successfully completed upload for file: ${file.name}`);
    }
    
    //console.log('All files uploaded successfully');
  } catch (error) {
    console.error('Upload process failed:', error);
    throw error;
  }
}