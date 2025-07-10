<template>
    <div class="text-light" @click="toggleSidebarState">
      <iconify-icon icon="system-uicons:window-collapse-right" width="24" height="24" :class="{ 'rotate-icon': isSidebarOpen }"></iconify-icon>
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
  transition: transform 0.4s ease;
}

iconify-icon {
  margin-left: 4px;
  transition: transform 0.4s ease;
  opacity: .7;
  display: flex;
  align-items: center;
  justify-content: center;
}

iconify-icon:hover {
  transition: transform 0.4s ease;
  cursor: pointer;
  opacity: .9;
}

@media (max-width: 768px) { 
  iconify-icon {
    margin-left: 8px;
  }
 }

 @media (min-width: 992px) {
    iconify-icon {
    margin-left: 7px;
  }
 }
</style>