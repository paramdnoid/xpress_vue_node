<template>
  <DefaultLayout>
      <div class="page-body">
          <img :src="logo" alt="" class="logo-img"/>
      </div>
  </DefaultLayout>
</template>
<script setup>
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import logo from '@/assets/images/logo-light.svg'
</script>

<style>
.landing .page-wrapper {
    background: var(--tblr-primary);

    .page-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
    }

    .logo-img {
        height: 400px;
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));
        transform: translateZ(0);
        will-change: filter;
       }
}



</style>