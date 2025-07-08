import { ref, onMounted, readonly } from 'vue'
import axios from '../axios'

const _user = ref(null)

export function useAuthUser(auth) {
  onMounted(() => {
    fetchUser(auth)
  })

  const fetchUser = async (auth) => {
    if (!_user.value && auth) {
      try {
        const res = await axios.get('/auth/me')
        _user.value = res.data
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          _user.value = null
          window.location.href = '/login'
        }
      }
    }
  }

  return { user: readonly(_user) }
}