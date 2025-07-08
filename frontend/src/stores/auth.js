// stores/auth.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  function setUser(data) {
    user.value = data
  }

  function clearUser() {
    user.value = null
  }

  return { user, setUser, clearUser }
})