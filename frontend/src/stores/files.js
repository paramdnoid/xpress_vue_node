/**
 * Transforms a flat array of file objects into a nested tree structure
 * that Vue’s template renderer can traverse.
 *
 * @param {Array<{path: string, children?: Array}>} flatFiles
 * @returns {Array} Hierarchically nested files/folders
 */
function buildFileTree(flatFiles) {
  const pathMap = {};
  const root = [];

  flatFiles.forEach(file => {
    file.children = [];
    pathMap[file.path] = file;
  });

  flatFiles.forEach(file => {
    const segments = file.path.split('/');
    if (segments.length === 1) {
      root.push(file);
    } else {
      const parentPath = segments.slice(0, -1).join('/');
      const parent = pathMap[parentPath];
      if (parent) {
        parent.children.push(file);
      } else {
        root.push(file); // falls übergeordneter Ordner fehlt
      }
    }
  });

  return root;
}

import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from '@/axios';
import debug from 'debug';
const log = debug('fileStore');

/** @typedef {'pending'|'uploading'|'paused'|'canceled'|'error'|'done'} UploadStatus */

/**
 * Central place for user‑visible texts – simplifies future i18n.
 */
const MESSAGES = {
  UPLOAD_SUCCESS: (file) => `Datei ${file} erfolgreich hochgeladen`,
  DELETE_SUCCESS: 'Datei/Ordner erfolgreich gelöscht',
  LOAD_ERROR: 'Fehler beim Laden der Dateien',
  UPLOAD_ERROR: 'Fehler beim Hochladen der Datei',
  DELETE_ERROR: 'Fehler beim Löschen der Datei/des Ordners',
  TOTAL_SIZE_ERROR: 'Fehler beim Abrufen der Gesamtspeichergröße',
};

/**
 * Decide how many parallel uploads to run, based on total byte size.
 * @param {number} totalBytes
 * @returns {number}
 */
function calcMaxParallelUploads(totalBytes) {
  return totalBytes > 500 * 1024 * 1024 ? 8 : 4; // >500 MB → 8, sonst 4
}

const CHUNK_SIZE = 4 * 1024 * 1024;

export const useFileStore = defineStore('file', () => {
  const currentPath = ref('/');
  const setCurrentPath = (path) => { currentPath.value = path || '/'; };

  const files = ref([]);
  const error = ref(null);
  const success = ref(null);

  const uploadQueue = ref([]);
  const isUploading = ref(false);
  const totalSize = ref(null);
  const preparationProgress = ref({ done: 0, total: 0 });

  const loadFiles = async (path = currentPath.value) => {
    error.value = null;
    success.value = null;
    try {
      const response = await axios.get('/files', { params: { path } });
      files.value = buildFileTree(response.data.children || []);
    } catch (err) {
      log('❌ Error loading files:', err);
      error.value = MESSAGES.LOAD_ERROR;
    }
  };

  const processUploadQueue = async () => {
    if (isUploading.value) return;
    isUploading.value = true;

    // Dynamische Berechnung der maximalen parallelen Uploads je nach Gesamtgröße der Dateien
    const totalSizeBytes = uploadQueue.value.reduce((sum, item) => sum + (item.chunkFile?.size || 0), 0);
    const MAX_PARALLEL_UPLOADS = calcMaxParallelUploads(totalSizeBytes);
    log('⚙️ Upload parallelism set to', MAX_PARALLEL_UPLOADS);

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
        uploadItem.startTime = Date.now();
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
                const index = uploadQueue.value.findIndex(item => item.id === uploadItem.id);
                if (index !== -1) {
                  uploadQueue.value[index] = { ...uploadItem };
                }
              }
            },
            signal: uploadItem.controller.signal,
          });
          
          uploadItem.endTime = Date.now();
          uploadItem.duration = uploadItem.endTime - uploadItem.startTime;
          uploadItem.status = 'done';
          uploadItem.progress = 100;
          success.value = MESSAGES.UPLOAD_SUCCESS(uploadItem.fullFileName);
          
          // Upload nach kurzer Verzögerung aus der Queue entfernen
          setTimeout(() => {
            uploadQueue.value = uploadQueue.value.filter(item => item.id !== uploadItem.id);
          }, 1000);
          
        } catch (err) {
          log('❌ Upload error:', err);
          if (err.name === 'CanceledError' || err.name === 'AbortError') {
            uploadItem.status = 'canceled';
            uploadItem.canceled = true;
          } else {
            uploadItem.status = 'error';
            uploadItem.error = MESSAGES.UPLOAD_ERROR;
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
      log('❌ Error in upload workers:', err);
    }

    // Nach Abschluss aller Uploads: Dateien neu laden
    try {
      await loadFiles();
    } catch (err) {
      log('❌ Error reloading files after upload:', err);
    }

    // Nach Abschluss aller Uploads: Gesamtgröße einmalig abrufen
    try {
      const size = await getTotalSize();
      if (size !== null) totalSize.value = size;
    } catch (err) {
      log('❌ Error getting total size:', err);
    }

    isUploading.value = false;
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
      startTime: null,
      endTime: null,
      duration: null,
    });
    
    processUploadQueue().catch(err => {
      log('❌ Error processing upload queue:', err);
    });
  };

  // Pause upload by id
  const pauseUpload = (id) => {
    const uploadItem = uploadQueue.value.find(item => item.id === id);
    if (uploadItem && !uploadItem.canceled && uploadItem.status !== 'done') {
      uploadItem.paused = true;
      if (uploadItem.status === 'uploading') {
        uploadItem.controller.abort();
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
      
      uploadItem.controller = new AbortController();
      
      processUploadQueue().catch(err => {
        log('❌ Error processing upload queue on resume:', err);
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

  const uploadFile = ({ chunkFile, fullFileName, chunkIndex, totalChunks, userId }) => {
    enqueueUpload({ chunkFile, fullFileName, chunkIndex, totalChunks, userId });
  };

  const deleteFile = async (path) => {
    error.value = null;
    success.value = null;
    try {
      await axios.delete(`/files/delete/${encodeURIComponent(path)}`);
      success.value = MESSAGES.DELETE_SUCCESS;
      // Nach dem Löschen: aktuellen Ordner neu laden
      await loadFiles();
    } catch (err) {
      log('❌ Error deleting file:', err);
      error.value = MESSAGES.DELETE_ERROR;
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
      log('❌ Error getting total size:', err);
      error.value = MESSAGES.TOTAL_SIZE_ERROR;
      return null;
    }
  };

  /**
   * Derive a quick snapshot of the current upload queue –
   * nützlich für Status-Badges oder Telemetrie.
   *
   * @returns {{pending:number, uploading:number, paused:number,
   *            error:number, done:number, total:number}}
   */
  const getUploadQueueStatus = () => {
    const pending = uploadQueue.value.filter(item => item.status === 'pending').length;
    const uploading = uploadQueue.value.filter(item => item.status === 'uploading').length;
    const paused = uploadQueue.value.filter(item => item.status === 'paused').length;
    const error = uploadQueue.value.filter(item => item.status === 'error').length;
    const done = uploadQueue.value.filter(item => item.status === 'done').length;
    
    return { pending, uploading, paused, error, done, total: uploadQueue.value.length };
  };

  const updatePreparationProgress = (done, total) => {
    preparationProgress.value.done = done;
    preparationProgress.value.total = total;
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
    isUploading,
    getUploadQueueStatus,
    preparationProgress,
    updatePreparationProgress,
    updateUploadDuration: (id) => {
      const item = uploadQueue.value.find(item => item.id === id);
      if (item && item.startTime && item.endTime) {
        return item.endTime - item.startTime;
      }
      return null;
    }
  };
});