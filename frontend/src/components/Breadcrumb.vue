<template>
  <ol class="breadcrumb breadcrumb-muted" aria-label="breadcrumbs">
    <li v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.link" class="breadcrumb-item"
      :class="{ active: index === breadcrumbs.length - 1 }"
      :aria-current="index === breadcrumbs.length - 1 ? 'page' : null">
      <router-link v-if="index !== breadcrumbs.length - 1" :to="breadcrumb.link">
        {{ breadcrumb.title }}
      </router-link>
      <span v-else>{{ breadcrumb.title }}</span>
    </li>
  </ol>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  return route.matched.map((r, index) => ({
    title: r.meta?.title || r.name || r.path.split('/').filter(Boolean).join(' / '),
    link: route.path
      .split('/')
      .slice(0, index + 1)
      .join('/') || '/'
  }))
})
</script>

<style scoped>
.breadcrumb-item {
  font-weight: 300 !important;
  color: var(--tblr-gray-300);

  &.active {
    color: var(--tblr-light) !important;
  }
}
</style>