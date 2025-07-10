import { createRouter, createWebHistory } from 'vue-router';
import { refreshAccessToken } from '@/utils/auth';
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
  { path: '/', component: Landing, meta: { title: 'Landing', guest: true } },
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

router.beforeEach(async (to, from, next) => {
  const defaultTitle = 'weppixpress';
  document.title = to.meta.title
    ? `${to.meta.title} | ${defaultTitle}`
    : defaultTitle;

  // if route requires auth, ensure token is valid (or refresh it)
  if (to.meta.requiresAuth) {
    const ok = await refreshAccessToken();
    console.log('Refresh erfolgreich?', ok);
    
    const token = localStorage.getItem('accessToken');
    if (!ok || !token) {
      console.warn('No valid token – redirecting to Login');
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }
  }

  next();
});

export default router