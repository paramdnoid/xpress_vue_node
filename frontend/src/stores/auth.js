// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
      accessToken.value = token // Setze nur den Token, nicht localStorage
    }
  }

  function logout() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem(STORAGE_KEY) // Stelle sicher, dass localStorage geleert wird
  }

  function clearUser() {
    user.value = null
  }

  // Initialisiere beim Store-Setup
  initializeAuthFromStorage();

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