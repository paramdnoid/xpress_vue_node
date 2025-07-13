import { createApp } from 'vue'
import App from './App.vue'

// 📦 Core
import axios from '@/axios'
import router from './router'
import { createPinia } from 'pinia'

// 🛡️ Auth Setup
import { initAuthFromStorage, setupAxiosInterceptors } from '@/utils/auth'

// 🎨 Styles
import 'iconify-icon'
import '@tabler/core/js/tabler.js'
import './assets/styles/main.scss'

// 🚀 App Bootstrap
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// ✅ Jetzt erst: Auth & Axios
initAuthFromStorage()
setupAxiosInterceptors()

// 🛡️ CSRF Token Setup
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

app.mount('#app')