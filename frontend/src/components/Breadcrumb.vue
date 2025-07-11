<template>
  <ol class="breadcrumb breadcrumb-muted d-none d-md-flex" aria-label="breadcrumbs">
    <template v-if="isFileManager">
      <li class="breadcrumb-item">
        <a href="#" @click.prevent="goTo(-1)">File Manager</a>
      </li>
      <li
        v-for="(segment, index) in segments"
        :key="'file-' + index"
        class="breadcrumb-item"
        :class="{ active: index === segments.length - 1 }"
        :aria-current="index === segments.length - 1 ? 'page' : null"
      >
        <a v-if="index !== segments.length - 1" href="#" @click.prevent="goTo(index)">
          {{ segment }}
        </a>
        <span v-else>{{ segment }}</span>
      </li>
    </template>
    <template v-else>
      <li
        v-for="(breadcrumb, index) in breadcrumbs"
        :key="'route-' + index"
        class="breadcrumb-item"
        :class="{ active: index === breadcrumbs.length - 1 }"
        :aria-current="index === breadcrumbs.length - 1 ? 'page' : null"
      >
        <router-link v-if="index !== breadcrumbs.length - 1" :to="breadcrumb.link">
          {{ breadcrumb.title }}
        </router-link>
        <span v-else>{{ breadcrumb.title }}</span>
      </li>
    </template>
  </ol>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFileStore } from '@/stores/files'

const fileStore = useFileStore()
const route = useRoute()

const isFileManager = computed(() => fileStore.currentPath !== '')

const segments = computed(() =>
  fileStore.currentPath.split('/').filter(Boolean)
)

const goTo = (index) => {
  const newPath = segments.value.slice(0, index + 1).join('/')
  fileStore.setCurrentPath(newPath)
}

const breadcrumbs = computed(() => {
  return route.matched.map(r => ({
    title: r.meta && r.meta.title ? r.meta.title : r.path.replace('/', '').toUpperCase(),
    link: r.path
  }))
})
</script>

<style scoped>
.breadcrumb-item {
  font-weight: 300 !important;
  
  &::before {
    opacity: 1;
    font-weight: 300;
    color: var(--tblr-light) !important;
  }
  
  a {
    opacity: .99;
    font-weight: 300;
    color: var(--tblr-light);
    font-size: .9rem;
    text-transform: uppercase;
  }
  
  &.active {
    opacity: .6;
    font-weight: 300;
    color: var(--tblr-light);
    text-transform: uppercase;
  }

  a:hover {
    text-decoration: none;
    opacity: .5;
  }
}
</style>