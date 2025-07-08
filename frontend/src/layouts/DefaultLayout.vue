<template>
    <div class="page">
        <header class="navbar navbar-expand-md d-print-none d-block" data-bs-theme="dark">
            <div class="container-fluid">
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu"
                    aria-controls="navbar-menu" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                    <router-link :to="logoTargetPath" class="logo d-flex align-items-center text-decoration-none">
                        <img :src="logo" alt="" class="logo-img" />
                        <div class="logo-text ms-2">
                            <div class="brand-highlight">weppi</div>
                            <div class="logo-subtext">xpress.com</div>
                        </div>
                    </router-link>
                </div>
                <div class="navbar-nav flex-row order-md-last">
                    <div v-if="user?.email" class="nav-item dropdown">
                        <a href="#" class="nav-link d-flex lh-1 p-0 ps-2" data-bs-toggle="dropdown"
                            aria-label="Open user menu">
                            <span class="avatar avatar-sm text-light">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-user">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
                                    <path
                                        d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
                                </svg>
                            </span>
                            <div class="d-none d-md-block ps-2 text-truncate" style="max-width: 140px;">
                                <div class="text-light text-truncate w-100 overflow-hidden lh-xs">{{ user?.name }}</div>
                                <div class="mt-1 small text-truncate w-100 overflow-hidden lh-xs" style="color: var(--tblr-gray-300);padding-right: 3px;">{{ user?.email }}</div>
                            </div>
                        </a>
                        <UserDropdown />
                    </div>
                    <div v-else class="nav-item dropdown">
                        <a href="#" class="nav-link d-flex lh-1 p-0 px-2" data-bs-toggle="dropdown"
                            aria-label="Open user menu">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-lock">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M12 2a5 5 0 0 1 5 5v3a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3v-3a5 5 0 0 1 5 -5m0 12a2 2 0 0 0 -1.995 1.85l-.005 .15a2 2 0 1 0 2 -2m0 -10a3 3 0 0 0 -3 3v3h6v-3a3 3 0 0 0 -3 -3" />
                            </svg>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow" data-bs-theme="light">
                            <router-link to="/login" class="dropdown-item"
                                exact-active-class="active">Login</router-link>
                            <router-link to="/register" class="dropdown-item"
                                exact-active-class="active">Register</router-link>
                        </div>
                    </div>
                </div>
                <div class="collapse navbar-collapse justify-content-end" id="navbar-menu">
                    <ul v-if="logoTargetPath === '/'" class="navbar-nav">
                        <li class="nav-item">
                            <router-link to="/file-manager" class="nav-link" exact-active-class="active">
                                <span class="nav-link-icon d-md-none d-lg-inline-block">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="icon icon-tabler icons-tabler-outline icon-tabler-folders">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path
                                            d="M9 3h3l2 2h5a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" />
                                        <path d="M17 16v2a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h2" />
                                    </svg>
                                </span>
                                <span class="nav-link-title">File Manager</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/mails" class="nav-link" exact-active-class="active">
                                <span class="nav-link-icon d-md-none d-lg-inline-block">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="icon icon-tabler icons-tabler-outline icon-tabler-mail">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path
                                            d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
                                        <path d="M3 7l9 6l9 -6" />
                                    </svg>
                                </span>
                                <span class="nav-link-title">Mails</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/flows" class="nav-link" exact-active-class="active">
                                <span class="nav-link-icon d-md-none d-lg-inline-block">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="icon icon-tabler icons-tabler-outline icon-tabler-apps">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path
                                            d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                                        <path
                                            d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                                        <path
                                            d="M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                                        <path d="M14 7l6 0" />
                                        <path d="M17 4l0 6" />
                                    </svg>
                                </span>
                                <span class="nav-link-title">Flows</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/meetings" class="nav-link" exact-active-class="active">
                                <span class="nav-link-icon d-md-none d-lg-inline-block">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="icon icon-tabler icons-tabler-outline icon-tabler-messages">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path
                                            d="M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10" />
                                        <path d="M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2" />
                                    </svg>
                                </span>
                                <span class="nav-link-title">Meetings</span>
                            </router-link>
                        </li>
                    </ul>
                    <ul v-else class="navbar-nav">
                        <li class="nav-item">
                            <router-link to="/" class="nav-link" exact-active-class="active">
                                <span class="nav-link-icon d-md-none d-lg-inline-block">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="icon icon-tabler icons-tabler-outline icon-tabler-home-2">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                                        <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                                        <path d="M10 12h4v4h-4z" />
                                    </svg>
                                </span>
                                <span class="nav-link-title">Home</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/" class="nav-link" exact-active-class="active">
                                <span class="nav-link-icon d-md-none d-lg-inline-block">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="icon icon-tabler icons-tabler-outline icon-tabler-shopping-cart-dollar">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M4 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                                        <path d="M13 17h-7v-14h-2" />
                                        <path d="M6 5l14 1l-.575 4.022m-4.925 2.978h-8.5" />
                                        <path d="M21 15h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5" />
                                        <path d="M19 21v1m0 -8v1" />
                                    </svg>
                                </span>
                                <span class="nav-link-title">Pricing</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/" class="nav-link" exact-active-class="active">
                                <span class="nav-link-icon d-md-none d-lg-inline-block">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="icon icon-tabler icons-tabler-outline icon-tabler-forms">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M12 3a3 3 0 0 0 -3 3v12a3 3 0 0 0 3 3" />
                                        <path d="M6 3a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3" />
                                        <path d="M13 7h7a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-7" />
                                        <path d="M5 7h-1a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h1" />
                                        <path d="M17 12h.01" />
                                        <path d="M13 12h.01" />
                                    </svg>
                                </span>
                                <span class="nav-link-title">Contact</span>
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>

            <Transition name="fade-slide" mode="out-in">
                <template v-if="$slots['page-title'] && !navbarMenuVisible">
                    <div class="verti-dash-content">
                        <slot name="page-title" />
                    </div>
                </template>
            </Transition>

        </header>
        <div class="page-wrapper">
            <slot />
            <template v-if="logoTargetPath !== '/'">
                <Footer />
            </template>
        </div>
    </div>
</template>

<script setup>
// Vue core imports
import { watchEffect, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// Third-party and app-level composables
import { useAuthUser } from '@/composables/useAuthUser'
import { useAutoLogout } from '@/composables/useAutoLogout'

// Assets and components
import logo from '@/assets/images/logo-light.svg'
import Footer from '@/components/layout/Footer.vue'
import UserDropdown from '@/components/layout/UserDropdown.vue'

const route = useRoute()
const props = defineProps({ auth: Boolean })
const { user } = useAuthUser(props.auth)
const logoTargetPath = ref(false)

watchEffect(() => {
  logoTargetPath.value = route.path === '/' ? '/file-manager' : '/'
})

const navbarMenuVisible = ref(false)

onMounted(() => {
  const navbarMenu = document.getElementById('navbar-menu')
  if (!navbarMenu) return
  navbarMenu.addEventListener('shown.bs.collapse', () => (navbarMenuVisible.value = true))
  navbarMenu.addEventListener('hidden.bs.collapse', () => (navbarMenuVisible.value = false))
})

useAutoLogout()
</script>

<style scoped>
.logo-img {
    height: 35px;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}

.logo-text {
    line-height: 1;
    font-size: .9rem;
    font-weight: 300;
    letter-spacing: -0.4px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
    font-weight: 400;

    .brand-highlight {
        color: var(--tblr-gray-300);
        line-height: .7;
    }

    .logo-subtext {
        font-size: 1.3rem;
        color: var(--tblr-light);
        line-height: 1;
        font-weight: 500;
    }
}

.avatar {
    --tblr-avatar-bg: hsl(192, 98%, 32%);
}

.avatar .icon {
    width: 1.2rem;
    height: 1.2rem;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
.lh-xs {
    line-height: .75;
}
</style>