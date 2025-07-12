<template>
  <div
    class="position-relative z-1"
    @dragover.prevent
    @drop.prevent="handleDrop"
    @dragleave.prevent="isDropActive = false"
    @dragenter.prevent="isDropActive = true"
  >
    <div v-if="isDropActive" class="dropzone-overlay">
      <div class="dropzone-text">Dateien hier ablegen zum Hochladen</div>
    </div>
    <div v-if="fileStore.error" class="text-danger py-2">{{ fileStore.error }}</div>
    <div v-else class="row row-cards gap-0 z-3">
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
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFileStore } from '@/stores/files'
import { getFileIcon } from '@/utils/fileIcon'
import { getFilesFromDataTransferItems } from '@/composables/useFileDragAndDrop'

const props = defineProps(['files'])
const files = computed(() => props.files)
const fileStore = useFileStore()

// No emits needed, Grid view does not emit row-click for files


const handleClick = (file) => {
  if (file.type === 'folder') {
    fileStore.setCurrentPath(file.path)
  }
  // For files, no action is taken in Grid view (no emit)
}

const goBack = () => {
  const parts = fileStore.currentPath.split('/').filter(Boolean)
  if (parts.length > 0) {
    parts.pop()
    const newPath = '/' + parts.join('/')
    fileStore.setCurrentPath(newPath || '/')
  }
}

const handleDrop = async (event) => {
  const filesToUpload = await getFilesFromDataTransferItems(event.dataTransfer.items)
  for (const file of filesToUpload) {
    const formData = new FormData();
    const fileId = crypto.randomUUID();
    const relPath = typeof file.relativePath === 'string' ? file.relativePath : file.name;
    formData.append(`relativePath:${fileId}`, `${fileStore.currentPath}/${relPath}`.replace(/^\/+/, ''));
    formData.append(fileId, file, file.name);
    await fileStore.uploadFile(formData, file.name || file.relativePath);
  }
}
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
.dropzone-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: none;
  user-select: none;
}
.dropzone-text {
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
}
</style>