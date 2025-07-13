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
import { useAuthStore } from '@/stores/auth';
import { getTokenRemainingSeconds } from '@/utils/auth';

const routes = [
  { path: '/', component: Landing, meta: { title: 'Landing', requiresAuth: false } },
  { path: '/verify-email', component: Verify, meta: { title: 'Verify' } },
  { path: '/file-manager', component: Manager, meta: { title: 'File Manager', requiresAuth: true } },
  { path: '/flows', component: Flows, meta: { title: 'Flows', requiresAuth: true } },
  { path: '/mails', component: Mails, meta: { title: 'Mails', requiresAuth: true } },
  { path: '/meetings', component: Meetings, meta: { title: 'Meetings', requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { title: 'Profile', requiresAuth: true } },
  { path: '/login', component: Login, meta: { title: 'Login', guestOnly: true } },
  { path: '/register', component: Register, meta: { title: 'Register', guestOnly: true } },
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

  const authStore = useAuthStore();



  // Auth‑guarded routes
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.warn('Route requires auth – redirecting to Login');
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  // Guest‑only routes
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ path: '/file-manager' });
  }

  next();
});

export default router