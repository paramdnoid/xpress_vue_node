import { createRouter, createWebHistory } from 'vue-router';
import Verify from '@/views/auth/Verify.vue';
import Landing from '@/views/Landing.vue';
import Login from '@/views/auth/Login.vue';
import Register from '@/views/auth/Register.vue'
import FileManager from '@/views/FileManager.vue';
import Flows from '@/views/Flows.vue';
import Mails from '@/views/Mails.vue';
import Meetings from '@/views/Meetings.vue';
import Profile from '@/views/Profile.vue';

const routes = [
  { path: '/verify-email', component: Verify, meta: { title: 'Verify' } },
  { path: '/', component: Landing, meta: { title: 'Landing' } },
  { path: '/file-manager', component: FileManager, meta: { title: 'File Manager', requiresAuth: true } },
  { path: '/flows', component: Flows, meta: { title: 'Flows', requiresAuth: true } },
  { path: '/mails', component: Mails, meta: { title: 'Mails', requiresAuth: true } },
  { path: '/meetings', component: Meetings, meta: { title: 'Meetings', requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { title: 'Profile', requiresAuth: true } },
  { path: '/login', component: Login, meta: { title: 'Login' } },
  { path: '/register', component: Register, meta: { title: 'Register' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active',
  linkExactActiveClass: 'exact-active',
});

router.beforeEach((to, from, next) => {
  const defaultTitle = 'weppixpress'
  document.title = to.meta.title ? `${to.meta.title} | ${defaultTitle}` : defaultTitle

  // Robustere Auth-Prüfung
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    console.warn('Kein Token vorhanden – Weiterleitung zu Login');
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router