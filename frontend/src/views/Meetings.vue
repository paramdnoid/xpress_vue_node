<template>
  <DefaultLayout :auth="true">
    <template #page-title>
      <Breadcrumb />
    </template>
      <div class="page-body">
          
      </div>
  </DefaultLayout>
</template>
<script setup>
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Breadcrumb from '@/components/Breadcrumb.vue'
</script>