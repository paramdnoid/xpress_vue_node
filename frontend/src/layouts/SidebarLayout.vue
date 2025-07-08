<template>
  <DefaultLayout>
    <template #page-title>
      <button class="btn btn-sm btn-toolbar border-0 me-2" @click="isSidebarOpen = !isSidebarOpen">
        <iconify-icon v-if="isSidebarOpen" icon="system-uicons:window-collapse-left" width="21" height="21"></iconify-icon>
        <iconify-icon v-else icon="system-uicons:window-collapse-right" width="21" height="21"></iconify-icon>
      </button>
      <Breadcrumb />
      <div class="ms-auto d-flex align-items-center text-light" style="font-weight: 300;font-size: .93rem;">
        <iconify-icon icon="system-uicons:menu-vertical"></iconify-icon> Menu
      </div>
    </template>

    <div class="page-body position-relative m-0">
      <div class="position-absolute top-0 end-0 start-0 bottom-0 overflow-hidden">
        <aside :class="['sidebar', { open: isSidebarOpen }]" style="overflow-y: auto;">
          <slot name="sidebar" />
        </aside>
        <div :class="['content', { open: isSidebarOpen }]">
          <slot />
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref } from 'vue'
import DefaultLayout from './DefaultLayout.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'

const isSidebarOpen = ref(true)
</script>