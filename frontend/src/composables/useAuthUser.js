import { onMounted, computed } from 'vue'
import axios from '@/axios'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function useAuthUser() {
  const route = useRoute()
  const authStore = useAuthStore()

  const fetchUser = async () => {
    const token = localStorage.getItem('accessToken')
    console.log('🪪 Checking token before /auth/me:', token)
    try {
      if (!route.meta.guest) {
        const res = await axios.get('/auth/me')
        authStore.setUser(res.data)
        console.log('✅ User loaded:', res.data)
      }
    } catch (err) {
      console.warn('❌ /auth/me failed:', err)

      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('🔁 Should trigger token refresh if interceptor works')
        authStore.clearUser()
        if (route.meta.requiresAuth) {
          window.location.href = '/login'
        }
      }
    }
  }

  onMounted(() => {
    fetchUser()
  })

  return { user: computed(() => authStore.user) }
}