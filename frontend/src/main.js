import { createApp } from 'vue'
import App from './App.vue'

// 📦 Externe Libraries
import axios from '@/axios'
import router from './router'
import { createPinia } from 'pinia'

// 🎨 Styles und Assets
import 'iconify-icon'
import '@tabler/core/js/tabler.js'
import './assets/styles/main.scss'

// ✅ CSRF-Token nur einmal laden
if (!window.__csrfTokenLoaded) {
  window.__csrfTokenLoaded = true
  axios.get('/csrf-token', { withCredentials: true })
    .then(({ data }) => {
      axios.defaults.headers.common['X-XSRF-TOKEN'] = data.csrfToken
    })
    .catch(err => {
      console.error('CSRF token load error:', err)
    })
}

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// 🛂 Auth-Store vorbereiten (nach Pinia-Einbindung)
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
authStore.initializeAuthFromStorage()

app.use(router)
app.mount('#app')
