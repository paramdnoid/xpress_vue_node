import { onMounted, onUnmounted } from 'vue'
import { logout, getTokenRemainingSeconds, refreshAccessToken } from '@/utils/auth'

export function useAutoLogout() {
  let logoutTimer
  let refreshTimer
  const REFRESH_THRESHOLD = 60 // Sekunden vor Ablaufzeitpunkt, um Token zu erneuern

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

    // Token-Aktualisierung REFRESH_THRESHOLD Sekunden vor Ablauf
    const refreshIn = Math.max(seconds - REFRESH_THRESHOLD, 0)
    refreshTimer = setTimeout(async () => {
      const success = await refreshAccessToken()
      if (!success) {
        logout()
      } else {
        // Bestehende Timer abräumen und neu planen
        clearTimeout(logoutTimer)
        clearTimeout(refreshTimer)
        scheduleTimers()
      }
    }, refreshIn * 1000)
  }

  onMounted(() => {
    const remaining = getTokenRemainingSeconds()
    if (remaining > 0) {
      scheduleTimers()
    }
  })

  onUnmounted(() => {
    if (logoutTimer) clearTimeout(logoutTimer)
    if (refreshTimer) clearTimeout(refreshTimer)
  })
}