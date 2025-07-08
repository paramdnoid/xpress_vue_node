import { onMounted, onUnmounted } from 'vue'
import { logout, getTokenRemainingSeconds } from '../utils/auth'

export function useAutoLogout() {
  let timer

  onMounted(() => {
    const seconds = getTokenRemainingSeconds()
    if (seconds > 0) {
      timer = setTimeout(() => {
        logout()
      }, seconds * 1000)
    }
  })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })
}