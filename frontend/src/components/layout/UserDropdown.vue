<template>
  <div>
    <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow" data-bs-theme="light">
      <div class="dropdown-header">Menu</div>
      <a href="#" class="dropdown-item">Status</a>
      <router-link to="/profile" class="dropdown-item" exact-active-class="active">Profile</router-link>
      <div class="dropdown-divider"></div>
      <div @click="showConfirm = true" class="dropdown-item">Logout</div>
    </div>

    <div v-if="showConfirm" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);" data-bs-theme="light">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title">Logout bestätigen</h5>
            <button type="button" class="btn-close" @click="showConfirm = false"></button>
          </div>
          <div class="modal-body">
            <p>Möchtest du dich wirklich abmelden?</p>
          </div>
          <div class="modal-footer border-0">
            <button class="btn btn-secondary" @click="showConfirm = false">Abbrechen</button>
            <button class="btn btn-danger" @click="confirmLogout">Logout</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { logout } from '@/utils/auth'
import { RouterLink } from 'vue-router'

const showConfirm = ref(false)

function confirmLogout() {
  logout()
}
</script>