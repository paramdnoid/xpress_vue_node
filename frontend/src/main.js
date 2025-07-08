import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'iconify-icon'

// ✅ dein Bootstrap SCSS
import '@tabler/core/js/tabler.js'
import './assets/styles/main.scss'

const app = createApp(App)
app.use(router)
app.mount('#app')
