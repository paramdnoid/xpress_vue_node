import { onMounted, onUnmounted } from 'vue'
import { logout, getTokenRemainingSeconds } from '@/utils/auth'

export function useAutoLogout() {
  let logoutTimer

  function scheduleTimers() {
    const seconds = getTokenRemainingSeconds()
    if (seconds <= 0) {
      logout()
      return
    }
    // Logout beim Ablaufen des Tokens
    logoutTimer = setTimeout(() => {
      logout()
    }, seconds * 1000)
  }

  onMounted(() => {
    const remaining = getTokenRemainingSeconds()
    if (remaining > 0) {
      scheduleTimers()
    }
  })

  onUnmounted(() => {
    if (logoutTimer) clearTimeout(logoutTimer)
  })
}