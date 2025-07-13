// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/axios'

const STORAGE_KEY = 'accessToken';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(null)
  const isAuthenticated = computed(() => !!accessToken.value)

  function setUser(data) {
    user.value = data
  }

  function setAccessToken(token) {
    accessToken.value = token
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function initializeAuthFromStorage() {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      setAccessToken(token)
    }
  }
  initializeAuthFromStorage();

  function logout() {
    accessToken.value = null
    user.value = null
  }

  function clearUser() {
    user.value = null
  }

  return {
    user,
    setUser,
    clearUser,
    accessToken,
    setAccessToken,
    isAuthenticated,
    logout,
    initializeAuthFromStorage,
  }
})