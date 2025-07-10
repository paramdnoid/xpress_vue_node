import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import 'iconify-icon'

// ✅ Bootstrap SCSS
import '@tabler/core/js/tabler.js'
import './assets/styles/main.scss'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')
