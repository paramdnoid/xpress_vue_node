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
.landing {
    .navbar[data-bs-theme=dark] {
        color-scheme: dark;
        --tblr-bg-surface: transparent;
        --tblr-navbar-border-color: transparent;
    }

    .page-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .logo-img {
        height: 400px;
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));
        transform: translateZ(0);
        will-change: filter;
    }
}







</style>