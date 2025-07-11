import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from '@/axios';

export const useFileStore = defineStore('file', () => {
  const currentPath = ref('/');
  const setCurrentPath = (path) => { currentPath.value = path || '/'; };

  const files = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const success = ref(null);

  const loadFiles = async (path = currentPath.value) => {
    isLoading.value = true;
    error.value = null;
    success.value = null;
    try {
      const response = await axios.get('/files', { params: { path } });
      files.value = response.data.children || [];
    } catch {
      error.value = 'Fehler beim Laden der Dateien';
    } finally {
      isLoading.value = false;
    }
  };

  const uploadFile = async (formData, options = { reload: true }) => {
    error.value = null;
    success.value = null;
    try {
      await axios.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      success.value = 'Datei erfolgreich hochgeladen';
      if (options.reload) {
        await loadFiles();
      }
    } catch (err) {
      error.value = 'Fehler beim Hochladen der Datei';
      throw err;
    }
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

  return { currentPath, setCurrentPath, files, loadFiles, isLoading, error, success, uploadFile, deleteFile, resetMessages, getTotalSize };
});