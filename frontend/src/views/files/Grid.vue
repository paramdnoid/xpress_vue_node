<template>
  <div v-if="isLoading" class="text-center py-4 text-muted">Lade Inhalte…</div>
  <div v-else class="row row-cards gap-0">
    <div v-if="fileStore.currentPath && fileStore.currentPath !== '/'" class="col-6 col-md-4 col-lg-3">
      <div class="card bg-transparent border-0 shadow-none" @click="goBack" style="cursor: pointer">
        <div class="card-body text-center">
          <div class="text-muted pt-3 mb-2">
            <iconify-icon icon="material-symbols-light:arrow-back" class="icon icon-md" />
          </div>
          <div class="fw-bold">..</div>
        </div>
      </div>
    </div>
    <div v-for="file in files" :key="file.name" class="col-6 col-md-4 col-lg-3">
      <div class="card bg-transparent border-0 shadow-none" @click="handleClick(file)" style="cursor: pointer">
        <div class="card-body text-center">
          <div class="mb-2 text-warning d-flex align-items-center justify-content-center">
            <iconify-icon :icon="getFileIcon(file)" width="24" height="24" />
          </div>
          <div class="fw-bold">{{ file.name }}</div>
          <small>{{ file.updated }}</small>
          <div class="text-muted small">
            <span v-if="file.size !== null">{{ file.size }}</span>
            <span v-else class="text-muted">…</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, ref } from 'vue'
import axios from '@/axios'
import { useFileStore } from '@/stores/files'
import { getFileIcon } from '@/utils/fileIcon'

const isLoading = ref(false);
const props = defineProps(['files'])
const fileStore = useFileStore()

const emit = defineEmits(['row-click'])

const loadFiles = async (path) => {
  isLoading.value = true;
  try {
    const res = await axios.get('/files', { params: { path } });
    const children = res.data.children || [];
    children.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
    // We keep files reactive if needed, but here we keep it as is
  } catch (e) {
    console.error('Fehler beim Laden der Dateien:', e);
  } finally {
    isLoading.value = false;
  }
}

const handleClick = (file) => {
  if (file.type === 'folder') {
    fileStore.setCurrentPath(file.path)
  } else {
    emit('row-click', file)
  }
}

const goBack = () => {
  const parts = fileStore.currentPath.split('/').filter(Boolean)
  if (parts.length > 0) {
    parts.pop()
    const newPath = '/' + parts.join('/')
    fileStore.setCurrentPath(newPath || '/')
  }
}

watch(() => fileStore.currentPath, (newPath) => {
  if (newPath) loadFiles(newPath)
}, { immediate: true })
</script>
<style scoped>
.card:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--tblr-border-color, #d0d7de);
  transform: translateY(-2px);
  transition: all 0.15s ease-in-out;
} 
.card:hover iconify-icon {
  opacity: 0.5;
}
</style>