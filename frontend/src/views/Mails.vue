<template>
  <SidebarLayout>
    <template #sidebar>
      <div>
        <div class="subheader mb-2 px-3 fw-bolder">
          Navigation
        </div>
        <nav class="nav nav-vertical px-2">

        </nav>
      </div>
    </template>
    <template #content>
      <div>content mails</div>
    </template>
  </SidebarLayout>
</template>

<script setup>
import SidebarLayout from '@/layouts/SidebarLayout.vue'
</script>