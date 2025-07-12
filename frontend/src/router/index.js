import { createRouter, createWebHistory } from 'vue-router';
import Verify from '@/views/auth/Verify.vue';
import Landing from '@/views/Landing.vue';
import Login from '@/views/auth/Login.vue';
import Register from '@/views/auth/Register.vue'
import Manager from '@/views/files/Manager.vue';
import Flows from '@/views/Flows.vue';
import Mails from '@/views/Mails.vue';
import Meetings from '@/views/Meetings.vue';
import Profile from '@/views/Profile.vue';

const routes = [
  { path: '/', component: Landing, meta: { title: 'Landing', requiresAuth: false } },
  { path: '/verify-email', component: Verify, meta: { title: 'Verify' } },
  { path: '/file-manager', component: Manager, meta: { title: 'File Manager', requiresAuth: true } },
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

  // if route requires auth, ensure an access token is present
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token – redirecting to Login');
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }
  }

  next();
});

export default router