import { useFileStore } from '@/stores/files'

const CHUNK_SIZE = 4 * 1024 * 1024;
const MAX_PARALLEL_UPLOADS = 4;

const CONCURRENT_FILE_LIMIT = 5;

export async function uploadFilesInChunks(files, currentPath = '') {
  const fileStore = useFileStore();
  const startTime = performance.now();

  // Input validation
  if (!files || !Array.isArray(files) || files.length === 0) {
    return;
  }

  // Normalize currentPath
  const normalizedPath = currentPath.replace(/^\/+|\/+$/g, '');

  try {
    fileStore.updatePreparationProgress(0, files.length);
    for (let i = 0; i < files.length; i += CONCURRENT_FILE_LIMIT) {
      const slice = files.slice(i, i + CONCURRENT_FILE_LIMIT);
      await Promise.all(slice.map(async (file, index) => {
        await uploadSingleFileInChunks(file, normalizedPath, fileStore);
        fileStore.updatePreparationProgress(i + index + 1, files.length);
      }));
    }
    const endTime = performance.now();
    fileStore.updateUploadDuration(endTime - startTime);
    console.debug(`⏱️ Upload abgeschlossen in ${(endTime - startTime).toFixed(0)} ms`);
    //console.log('All files uploaded successfully');
  } catch (error) {
    const endTime = performance.now();
    fileStore.updateUploadDuration(endTime - startTime);
    console.debug(`⏱️ Upload abgeschlossen in ${(endTime - startTime).toFixed(0)} ms`);
    console.error('Upload process failed:', error);
    throw error;
  }
}

async function uploadSingleFileInChunks(file, normalizedPath, fileStore) {
  await new Promise(r => setTimeout(r, 5));

  if (file.size === 0) {
    console.warn(`Skipping empty file: ${file.name}`);
    return;
  }

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const fileId = crypto.randomUUID();

  await Promise.all(
    Array.from({ length: totalChunks }).map((_, chunkIndex) => {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const relPath = file.webkitRelativePath || file.relativePath || file.name;
      const fullPath = normalizedPath 
        ? `${normalizedPath}/${relPath}`.replace(/\/+/g, '/')
        : relPath;
      const cleanPath = fullPath.replace(/^\/+/, '');

      return fileStore.uploadFile({
        chunkFile: chunk,
        fullFileName: cleanPath,
        chunkIndex,
        totalChunks,
        userId: null
      });
    })
  );
}