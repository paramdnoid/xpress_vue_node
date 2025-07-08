<template>
  <AuthLayout>
    <template #auth-text>
      <div class="logo-lg">
        <span class="logo-txt">Signup</span>
      </div>
      <p class="text-muted font-size-15 w-75 mx-auto mt-1 mb-0">
        Simply register and get started immediately.
      </p>
    </template>
    <div class="card border-0">
      <div class="card-body p-0">
        <div class="px-3 py-3">
          <div class="text-center">
            <h2 class="mb-0">Account registrieren</h2>
            <p class="text-muted mt-2">Erstelle jetzt Dein kostenloses Konto.</p>
          </div>
          <form class="mt-4 pt-2" @submit.prevent="register">
            <div class="form-floating form-floating-custom mb-3">
              <input v-model="email" type="email" name="email" class="form-control" id="email" required="">
              <div class="invalid-feedback">
                Bitte Email eingeben
              </div>
              <label for="email">Email</label>
              <div class="form-floating-icon">
                <iconify-icon icon="bi:envelope-at" style="font-size: 24px"></iconify-icon>
              </div>
            </div>
            <PasswordField v-model="password" autocomplete="new-password" />
            <div class="mt-3 pt-1 text-center">
              <p class="mb-0 small">
                Mit der Registrierung erklären Sie sich mit den <span data-bs-toggle="modal" role="button"
                  data-bs-target="#condition-modal" class="text-primary">AGB</span> einverstanden </p>
            </div>
            <div class="mt-3">
              <button class="btn btn-primary w-100">Register</button>
            </div>
            <div class="mt-4 pt-3 text-center">
              <p class="text-muted mb-0">Du hast bereits ein Konto?
                <router-link to="/login" class="fw-semibold text-decoration-underline">Login</router-link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup>
import AuthLayout from '@/layouts/AuthLayout.vue'
import PasswordField from '@/components/form/PasswordField.vue';
import { ref } from 'vue'
import axios from '@/axios'

const email = ref('')
const password = ref('')

const register = async () => {
  try {
    const res = await axios.post('/auth/register', { email: email.value, password: password.value }, { withCredentials: true })
    localStorage.setItem('accessToken', res.data.accessToken)
    location.href = '/file-manager'
  } catch (err) {
    alert(err.response?.data?.message || 'Registration failed')
  }
}
</script>