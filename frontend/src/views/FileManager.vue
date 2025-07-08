<template>
  <DefaultLayout>
    <template #page-title>
      <Breadcrumb />
    </template>
    <div class="page-body">

    </div>
  </DefaultLayout>
</template>
<script setup>
import DefaultLayout from '../layouts/DefaultLayout.vue';
import Breadcrumb from '@/components/Breadcrumb.vue'
import axios from '@/axios';
axios.get('/files') // automatisch mit AccessToken + optionalem Refresh
  .then(res => console.log(res.data))
  .catch(err => console.error(err));
</script>