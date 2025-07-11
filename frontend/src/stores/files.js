import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from '@/axios';

export const useFileStore = defineStore('file', () => {
  const currentPath = ref('');
  const setCurrentPath = (path) => { currentPath.value = path; };

  const files = ref([]);
  const loadFiles = async (path) => {
    const response = await axios.get('/files', { params: { path } });
    files.value = response.data.files;
  };

  return { currentPath, setCurrentPath, files, loadFiles };
});