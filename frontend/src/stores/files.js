import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from '@/axios';

const MAX_PARALLEL_UPLOADS = 5

export const useFileStore = defineStore('file', () => {
  const currentPath = ref('/');
  const setCurrentPath = (path) => { currentPath.value = path || '/'; };

  const files = ref([]);
  const error = ref(null);
  const success = ref(null);

  const uploadQueue = ref([]);
  const isUploading = ref(false); // FIX: Make reactive
  const totalSize = ref(null);

  const loadFiles = async (path = currentPath.value) => {
    error.value = null;
    success.value = null;
    try {
      const response = await axios.get('/files', { params: { path } });
      files.value = response.data.children || [];
    } catch (err) { // FIX: Catch the error parameter
      console.error('Error loading files:', err);
      error.value = 'Fehler beim Laden der Dateien';
    }
  };

  const processUploadQueue = async () => {
    if (isUploading.value) return; // FIX: Use .value
    isUploading.value = true; // FIX: Use .value

    const uploadNext = async () => {
      while (true) {
        // Nimm den nächsten PENDING Upload
        const nextUploadIndex = uploadQueue.value.findIndex(item => item.status === 'pending');
        if (nextUploadIndex === -1) return;
        const uploadItem = uploadQueue.value[nextUploadIndex];
        
        // Wenn pausiert oder gecancelt, überspringen
        if (uploadItem.paused || uploadItem.canceled) {
          uploadItem.status = uploadItem.canceled ? 'canceled' : 'paused';
          continue;
        }
        
        uploadItem.status = 'uploading';
        uploadItem.progress = 0;
        uploadItem.error = null;
        
        try {
          const formData = new FormData();
          formData.append('file', uploadItem.chunkFile);
          formData.append('relativePath', uploadItem.fullFileName);
          formData.append('chunkIndex', uploadItem.chunkIndex.toString());
          formData.append('totalChunks', uploadItem.totalChunks.toString());
          if (uploadItem.userId) formData.append('userId', uploadItem.userId);

          await axios.post('/files/upload-chunk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.lengthComputable) {
                uploadItem.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                // FIX: Update the queue reactively
                const index = uploadQueue.value.findIndex(item => item.id === uploadItem.id);
                if (index !== -1) {
                  uploadQueue.value[index] = { ...uploadItem };
                }
              }
            },
            signal: uploadItem.controller.signal,
          });
          
          uploadItem.status = 'done';
          uploadItem.progress = 100;
          success.value = `Datei ${uploadItem.fullFileName} erfolgreich hochgeladen`; // FIX: Use fullFileName
          
          // Upload nach kurzer Verzögerung aus der Queue entfernen
          setTimeout(() => {
            uploadQueue.value = uploadQueue.value.filter(item => item.id !== uploadItem.id);
          }, 1000);
          
        } catch (err) {
          console.error('Upload error:', err);
          if (err.name === 'CanceledError' || err.name === 'AbortError') {
            uploadItem.status = 'canceled';
            uploadItem.canceled = true;
          } else {
            uploadItem.status = 'error';
            uploadItem.error = 'Fehler beim Hochladen der Datei';
            error.value = uploadItem.error;
          }
        }
      }
    };

    // Starte MAX_PARALLEL_UPLOADS "Worker"
    const workers = [];
    for (let i = 0; i < MAX_PARALLEL_UPLOADS; i++) {
      workers.push(uploadNext());
    }
    
    try {
      await Promise.all(workers);
    } catch (err) {
      console.error('Error in upload workers:', err);
    }

    // Nach Abschluss aller Uploads: Dateien neu laden
    try {
      await loadFiles();
    } catch (err) {
      console.error('Error reloading files after upload:', err);
    }

    // Nach Abschluss aller Uploads: Gesamtgröße einmalig abrufen
    try {
      const size = await getTotalSize();
      if (size !== null) totalSize.value = size;
    } catch (err) {
      console.error('Error getting total size:', err);
    }

    isUploading.value = false; // FIX: Use .value
  };

  const enqueueUpload = ({ chunkFile, fullFileName, chunkIndex, totalChunks, userId }) => {
    const id = Date.now() + Math.random().toString(16).slice(2);
    const controller = new AbortController();
    
    uploadQueue.value.push({
      id,
      name: fullFileName,
      status: 'pending',
      progress: 0,
      error: null,
      controller,
      paused: false,
      canceled: false,
      chunkFile,
      fullFileName,
      chunkIndex,
      totalChunks,
      userId,
    });
    
    // FIX: Don't await this, let it run in background
    processUploadQueue().catch(err => {
      console.error('Error processing upload queue:', err);
    });
  };

  // Pause upload by id
  const pauseUpload = (id) => {
    const uploadItem = uploadQueue.value.find(item => item.id === id);
    if (uploadItem && !uploadItem.canceled && uploadItem.status !== 'done') {
      uploadItem.paused = true;
      if (uploadItem.status === 'uploading') {
        uploadItem.controller.abort(); // FIX: Abort active upload
      }
      uploadItem.status = 'paused';
    }
  };

  // Resume upload by id
  const resumeUpload = (id) => {
    const uploadItem = uploadQueue.value.find(item => item.id === id);
    if (uploadItem && uploadItem.paused && !uploadItem.canceled && uploadItem.status !== 'done') {
      uploadItem.paused = false;
      uploadItem.status = 'pending';
      
      // FIX: Create new AbortController for resumed upload
      uploadItem.controller = new AbortController();
      
      processUploadQueue().catch(err => {
        console.error('Error processing upload queue on resume:', err);
      });
    }
  };

  // Cancel upload by id
  const cancelUpload = (id) => {
    const uploadItem = uploadQueue.value.find(item => item.id === id);
    if (uploadItem && !uploadItem.canceled && uploadItem.status !== 'done') {
      uploadItem.controller.abort();
      uploadItem.status = 'canceled';
      uploadItem.canceled = true;
    }
  };

  // FIX: This function signature doesn't match its usage
  const uploadFile = ({ chunkFile, fullFileName, chunkIndex, totalChunks, userId }) => {
    enqueueUpload({ chunkFile, fullFileName, chunkIndex, totalChunks, userId });
  };

  const deleteFile = async (path) => {
    error.value = null;
    success.value = null;
    try {
      await axios.delete(`/files/delete/${encodeURIComponent(path)}`);
      success.value = 'Datei/Ordner erfolgreich gelöscht';
      // Nach dem Löschen: aktuellen Ordner neu laden
      await loadFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
      error.value = 'Fehler beim Löschen der Datei/des Ordners';
      throw err;
    }
  };

  const resetMessages = () => {
    error.value = null;
    success.value = null;
  };

  const getTotalSize = async () => {
    error.value = null;
    try {
      const response = await axios.get('/files/total-size');
      return response.data.size;
    } catch (err) {
      console.error('Error getting total size:', err);
      error.value = 'Fehler beim Abrufen der Gesamtspeichergröße';
      return null;
    }
  };

  // FIX: Add utility function to get upload queue status
  const getUploadQueueStatus = () => {
    const pending = uploadQueue.value.filter(item => item.status === 'pending').length;
    const uploading = uploadQueue.value.filter(item => item.status === 'uploading').length;
    const paused = uploadQueue.value.filter(item => item.status === 'paused').length;
    const error = uploadQueue.value.filter(item => item.status === 'error').length;
    const done = uploadQueue.value.filter(item => item.status === 'done').length;
    
    return { pending, uploading, paused, error, done, total: uploadQueue.value.length };
  };

  return {
    currentPath,
    setCurrentPath,
    files,
    loadFiles,

    error,
    success,
    uploadFile,
    deleteFile,
    resetMessages,
    getTotalSize,
    uploadQueue,
    enqueueUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    totalSize,
    isUploading, // FIX: Export reactive isUploading
    getUploadQueueStatus, // FIX: Export new utility function
  };
});