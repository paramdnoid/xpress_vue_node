// stores/auth.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(null)

  function setUser(data) {
    user.value = data
  }

  function setAccessToken(token) {
    accessToken.value = token
    if (token) {
      localStorage.setItem('accessToken', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      localStorage.removeItem('accessToken')
      delete axios.defaults.headers.common['Authorization']
    }
  }

  function initializeAuthFromStorage() {
    const token = localStorage.getItem('accessToken')
    if (token) {
      setAccessToken(token)
    }
  }

  function logout() {
    accessToken.value = null
    delete axios.defaults.headers.common['Authorization']
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
    logout,
    initializeAuthFromStorage,
  }
})