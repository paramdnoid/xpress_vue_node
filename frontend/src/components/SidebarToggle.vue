<template>
    <div class="text-light toggle-sidebar" @click="toggleSidebarState">
      <iconify-icon icon="flowbite:open-sidebar-alt-solid" width="24" height="24" :class="{ 'rotate-icon': isSidebarOpen }"></iconify-icon>
    </div>
</template>
<script setup>
import { inject } from 'vue'

const toggleSidebarState = inject('toggleSidebarState')
const isSidebarOpen = inject('isSidebarOpen')
</script>
<style scoped>
.rotate-icon {
  transform: rotateY(180deg);
  transition: transform 0.7s ease;
}

.toggle-sidebar iconify-icon {
  margin-left: 4px;
  transition: transform 0.7s ease;
  opacity: .9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 9px;
}

.toggle-sidebar iconify-icon:hover {
  transition: transform 0.7s ease;
  cursor: pointer;
  opacity: .7;
}

@media (max-width: 768px) { 
  .toggle-sidebar iconify-icon {
    margin-left: 8px;
  }
 }

 @media (min-width: 992px) {
    .toggle-sidebar iconify-icon {
      margin-left: 7px;
    }
 }
</style>