<template>
  <SidebarLayout>
    <template #sidebar>
      <div>
        <div @click.prevent="goToRoot" class="subheader mb-2 px-3 fw-bolder d-flex">
          My Uploads <div class="ms-auto fw-lighter">{{ totalSize }}</div>
        </div>
        <nav class="nav nav-vertical px-2">
          <Tree v-for="child in rootNode?.children || []" :key="child.path" :node="child" />
        </nav>
      </div>
    </template>
    <template #content>
      <div class="d-flex justify-content-between justify-items-center m-1 px-2">
        <div class="breadcrumb-wrapper overflow-auto">
          <ol class="breadcrumb breadcrumb-muted" aria-label="breadcrumbs">
            <li class="breadcrumb-item">
              <a href="#" @click.prevent="goTo(-1)">File Manager</a>
            </li>
            <li v-for="(segment, index) in segments" :key="'file-' + index" class="breadcrumb-item"
              :class="{ active: index === segments.length - 1 }"
              :aria-current="index === segments.length - 1 ? 'page' : null">
              <a v-if="index !== segments.length - 1" href="#" @click.prevent="goTo(index)">
                {{ segment }}
              </a>
              <span v-else>{{ segment }}</span>
            </li>
          </ol>
        </div>
        <div class="view-mode">
          <iconify-icon @click="viewMode = 'table'"
            :class="[viewMode === 'table' ? 'text-primary' : 'text-primary opacity-50']"
            icon="material-symbols:event-list-outline-sharp" width="20" height="20"></iconify-icon>
            <div class="px-1"></div>
          <iconify-icon @click="viewMode = 'grid'"
            :class="[viewMode === 'grid' ? 'text-primary' : 'text-primary opacity-50']" icon="material-symbols:grid-on"
            width="20" height="20"></iconify-icon>
        </div>
      </div>
      <div v-if="isLoading" class="text-center text-muted py-4">Lade Inhalte...</div>
      <div v-else-if="error" class="text-danger text-center py-4">{{ error }}</div>
      <Grid v-if="!isLoading && !error && viewMode === 'grid'" :files="files" />
      <Table v-else-if="!isLoading && !error" :files="files" />
    </template>
  </SidebarLayout>
</template>

<script setup>
import axios from '@/axios';
import { onMounted, onUpdated, ref, inject, computed } from 'vue';
import { useFileStore } from '@/stores/files';
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import Tree from './Tree.vue';
import Grid from './Grid.vue'
import Table from './Table.vue'

const isLoading = ref(true);
const error = ref(null);

const files = ref([]);
const rootNode = ref(null);
const fileStore = useFileStore();
const totalSize = ref('')
const viewMode = inject('viewMode', ref('table'))
const segments = computed(() =>
  fileStore.currentPath.split('/').filter(Boolean)
)

const goTo = (index) => {
  const newPath = segments.value.slice(0, index + 1).join('/')
  fileStore.setCurrentPath(newPath)
}

const goToRoot = () => {
  fileStore.setCurrentPath('/');
};

onMounted(async () => {
  try {
    isLoading.value = true;
    const res = await axios.get('/files');
    files.value = res.data.children;
    rootNode.value = {
      name: 'root',
      path: '/',
      type: 'folder',
      children: files.value,
    };
    fileStore.setCurrentPath('');

    const size = await axios.get('/files/total-size');
    totalSize.value = size.data.size || '—';
  } catch (err) {
    error.value = 'Fehler beim Laden der Dateien';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
});

onUpdated(() => {
  const el = document.querySelector('.breadcrumb-wrapper');
  if (el) el.scrollLeft = el.scrollWidth;
});
</script>

<style>
.view-mode {
  width: auto;
  height: 24px;
  display: flex;
  justify-content: center;
  justify-items: center;
  font-size: .8rem;
}

.view-mode iconify-icon {
  width: 20px !important;
  height: 20px !important;

  &:hover {
    cursor: pointer;
    opacity: .8;
  }
}

.breadcrumb-wrapper {
  max-width: 100%;
  overflow-x: auto;
  scroll-behavior: smooth;
}

.breadcrumb-item a {
    text-decoration: none !important;
    cursor: pointer;
} 

.breadcrumb-item + .breadcrumb-item::before {
  content: '>';
  margin: 0 0.25rem;
  color: #aaa;
}

@media (max-width: 576px) {
  .breadcrumb {
    flex-wrap: nowrap;
    font-size: 0.75rem;
    padding: 0;
    margin: 0;
    white-space: nowrap;
  }
  .breadcrumb-item {
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-wrap: nowrap;
    padding: 0 4px;

  }
  .breadcrumb-wrapper {
    max-width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    display: block;
    scrollbar-width: none; /* Firefox */
  }
  .breadcrumb {
    display: inline-flex;
  }
  .breadcrumb-wrapper::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }
}
</style>