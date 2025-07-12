import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from '@/axios';

export const useFileStore = defineStore('file', () => {
  const currentPath = ref('/');
  const setCurrentPath = (path) => { currentPath.value = path || '/'; };

  const files = ref([]);
  const error = ref(null);
  const success = ref(null);

  const uploadQueue = ref([]);
let isUploading = false;
const totalSize = ref(null);

  const loadFiles = async (path = currentPath.value) => {
    error.value = null;
    success.value = null;
    try {
      const response = await axios.get('/files', { params: { path } });
      files.value = response.data.children || [];
    } catch {
      error.value = 'Fehler beim Laden der Dateien';
    }
  };

  const processUploadQueue = async () => {
    if (isUploading) return;
    isUploading = true;
    while (true) {
      const nextUploadIndex = uploadQueue.value.findIndex(item => item.status === 'pending');
      if (nextUploadIndex === -1) break;
      const uploadItem = uploadQueue.value[nextUploadIndex];
      // Skip if paused or canceled
      if (uploadItem.paused || uploadItem.canceled) {
        // Don't process, just skip to next
        continue;
      }
      uploadItem.status = 'uploading';
      uploadItem.progress = 0;
      uploadItem.error = null;
      try {
        await axios.post('/files/upload', uploadItem.formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
              uploadItem.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              uploadQueue.value = uploadQueue.value.map(item =>
                item.id === uploadItem.id ? { ...item, progress: uploadItem.progress } : item
              );
            }
          },
          signal: uploadItem.controller.signal,
        });
        uploadItem.status = 'done';
        uploadItem.progress = 100;
        success.value = `Datei ${uploadItem.name} erfolgreich hochgeladen`;
        await loadFiles();
        const size = await getTotalSize();
        if (size !== null) totalSize.value = size;
        // Remove completed upload from queue
        await new Promise(resolve => setTimeout(resolve, 1000));
        uploadQueue.value = uploadQueue.value.filter(item => item.id !== uploadItem.id);
      } catch (err) {
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
    isUploading = false;
  };

  const enqueueUpload = (formData, name) => {
    if (!name) {
      let f = formData.get('file');
      if (!f) {
        for (let [key, val] of formData.entries()) {
          if (val instanceof File) {
            f = val;
            break;
          }
        }
      }
      name = f?.name || 'Datei';
    }
    const id = Date.now() + Math.random().toString(16).slice(2);
    const controller = new AbortController();
    uploadQueue.value.push({
      id,
      name,
      status: 'pending',
      progress: 0,
      error: null,
      formData,
      controller,
      paused: false,
      canceled: false,
    });
    processUploadQueue();
  };
  // Pause upload by id
  const pauseUpload = (id) => {
    const uploadItem = uploadQueue.value.find(item => item.id === id);
    if (uploadItem && !uploadItem.canceled && uploadItem.status !== 'done') {
      uploadItem.paused = true;
      uploadItem.status = 'paused';
    }
  };

  // Resume upload by id
  const resumeUpload = (id) => {
    const uploadItem = uploadQueue.value.find(item => item.id === id);
    if (uploadItem && uploadItem.paused && !uploadItem.canceled && uploadItem.status !== 'done') {
      uploadItem.paused = false;
      uploadItem.status = 'pending';
      processUploadQueue();
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

  const uploadFile = (formData, name) => {
    enqueueUpload(formData, name);
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
    } catch {
      error.value = 'Fehler beim Abrufen der Gesamtspeichergröße';
      return null;
    }
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
  };
});