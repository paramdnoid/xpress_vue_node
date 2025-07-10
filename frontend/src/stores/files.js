import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFileStore = defineStore('file', () => {
  const currentPath = ref('');
  const setCurrentPath = (path) => { currentPath.value = path; };
  return { currentPath, setCurrentPath };
});