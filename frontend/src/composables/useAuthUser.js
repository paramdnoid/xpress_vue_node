import { onMounted, computed } from 'vue'
import axios from '@/axios'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function useAuthUser() {
  const route = useRoute()
  const requiresAuth = computed(() =>
    route.matched.some(record => record.meta.requiresAuth)
  )
  const authStore = useAuthStore()

  const fetchUser = async () => {
    // Only load and validate user on protected routes
    if (requiresAuth.value) {
      try {
        const res = await axios.get('/auth/me')
        authStore.setUser(res.data)
      } catch (err) {
        console.warn('❌ /auth/me failed:', err)
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.log('🔁 Token invalid, clearing user and redirecting to login')
          authStore.clearUser()
          window.location.href = '/login'
        }
      }
    }
  }

  onMounted(() => {
    if (requiresAuth.value) {
      fetchUser()
    }
  })

  return { user: computed(() => authStore.user) }
}