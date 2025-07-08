<template>
  <AuthLayout>
    <template #auth-text>
      <div class="logo-lg">
        <span class="logo-txt">Welcome by weppi®XPRESS</span>
      </div>
      <p class="text-muted font-size-15 w-75 mx-auto mt-1 mb-0">
        Simply register and send data free of charge.
      </p>
    </template>
    <div class="card border-0">
      <div class="card-body p-0">
        <div class="px-3 py-3">
          <div class="text-center">
            <h2 class="mb-0">Willkommen zurück!</h2>
            <p class="text-muted mt-2">Melde Dich an um fortzufahren.</p>
          </div>
          <form class="mt-4 pt-2" @submit.prevent="login">
            <div class="form-floating form-floating-custom mb-3">
              <input v-model="email" type="email" name="email" class="form-control" id="email" required
                autocomplete="email">
              <div class="invalid-feedback">
                Bitte Email eingeben
              </div>
              <label for="email">Email</label>
              <div class="form-floating-icon">
                <iconify-icon icon="bi:envelope-at" style="font-size: 24px"></iconify-icon>
              </div>
            </div>
            <password-field v-model="password" autocomplete="current-password" />
            <div class="form-check form-check-primary d-flex justify-content-between">
              <div class="d-flex align-items-center">
                <input class="form-check-input" type="checkbox" id="remember-check" name="remember_me">
                <label class="form-check-label font-size-12 ms-1" for="remember-check" style="margin-top: 4px;">
                  Angemeldet bleiben
                </label>
              </div>
              <div class="d-flex align-items-center">
                <a href="/resetpassword" class="text-muted text-decoration-underline font-size-12"
                  style="margin-top: 5px;">
                  Passwort vergessen?
                </a>
              </div>
            </div>
            <div class="mt-3">
              <button class="btn btn-primary w-100">Login</button>
            </div>
            <div class="mt-4 pt-3 text-center">
              <p class="text-muted mb-0">Du hast keinen Account?
                <router-link to="/register" class="fw-semibold text-decoration-underline">Registrieren</router-link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AuthLayout>
</template>
<script setup>
import AuthLayout from '@/layouts/AuthLayout.vue';
import PasswordField from '@/components/form/PasswordField.vue';
import { ref } from 'vue';
import axios from '@/axios';
import { useRouter, useRoute } from 'vue-router';

const email = ref('');
const password = ref('');

const router = useRouter();
const route = useRoute();

const login = async () => {
  const res = await axios.post('/auth/login', { email: email.value, password: password.value }, { withCredentials: true })
  localStorage.setItem('accessToken', res.data.token || res.data.accessToken);
  const redirect = route.query.redirect || '/file-manager';
  router.push(redirect);
};
</script>
