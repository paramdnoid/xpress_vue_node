<template>
  <AuthLayout>
    <template #auth-text>
      <div class="logo-lg">
        <span class="logo-txt">Complete signup</span>
      </div>
      <p class="text-muted font-size-15 w-75 mx-auto mt-1 mb-0">
        Confirm email to activate account.
      </p>
    </template>
    <div class="card border-0">
      <div class="card-body p-0">
        <h2 class="mb-3">E-Mail-Verifizierung</h2>
        <p v-if="loading">Dein Token wird geprüft...</p>
        <p v-if="success" class="text-success">Erfolg! Deine E-Mail wurde verifiziert.</p>
        <p v-if="error" class="text-danger">{{ error }}</p>
        <router-link v-if="error" to="/" class="btn btn-primary mt-3">Zurück zur Startseite</router-link>
        <router-link v-else to="/login" class="btn btn-primary mt-3">Login</router-link>
      </div>
    </div>
  </AuthLayout>
</template>
<script setup>
import AuthLayout from '@/layouts/AuthLayout.vue';
import axios from '@/axios';
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const token = route.query.token

const loading = ref(true)
const success = ref(false)
const error = ref(null)

onMounted(async () => {
  try {
    await axios.get(`/auth/verify-email?token=${token}`)
    success.value = true
  } catch (err) {
    error.value = err.response?.data?.message || 'Verifizierung fehlgeschlagen.'
  } finally {
    loading.value = false
  }
})
</script>