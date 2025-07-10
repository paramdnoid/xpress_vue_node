<template>
  <div>
    <button class="btn btn-sm btn-toolbar border-0 text-light bg-transparent ms-1" @click="toggleSidebarState">
      <iconify-icon v-if="isSidebarOpen" icon="system-uicons:window-collapse-left" width="24"
        height="24"></iconify-icon>
      <iconify-icon v-else icon="system-uicons:window-collapse-right" width="24" height="24"></iconify-icon>
    </button>
  </div>
</template>
<script setup>
import { inject } from 'vue'

const toggleSidebarState = inject('toggleSidebarState')
const isSidebarOpen = inject('isSidebarOpen')
</script>

<style scoped></style>