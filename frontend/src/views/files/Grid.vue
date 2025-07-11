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
import { ref, computed } from 'vue'
import { useFileStore } from '@/stores/files'
import { getFileIcon } from '@/utils/fileIcon'

const props = defineProps(['files'])
const files = computed(() => props.files)
const fileStore = useFileStore()

const emit = defineEmits(['row-click'])

const isDropActive = ref(false)

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

async function getFilesFromDataTransferItemList(items) {
  const files = []

  function traverseFileTree(item, path = '') {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file) => {
          file.fullPath = path + file.name
          files.push(file)
          resolve()
        })
      } else if (item.isDirectory) {
        const dirReader = item.createReader()
        dirReader.readEntries(async (entries) => {
          for (const entry of entries) {
            await traverseFileTree(entry, path + item.name + '/')
          }
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  const traversePromises = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i].webkitGetAsEntry()
    if (item) {
      traversePromises.push(traverseFileTree(item))
    }
  }
  await Promise.all(traversePromises)
  return files
}

const handleDrop = async (event) => {
  isDropActive.value = false
  const dt = event.dataTransfer
  if (!dt) return

  let filesToUpload = []

  if (dt.items && dt.items.length > 0) {
    filesToUpload = await getFilesFromDataTransferItemList(dt.items)
  } else if (dt.files && dt.files.length > 0) {
    filesToUpload = Array.from(dt.files)
  }

  for (const file of filesToUpload) {
    const formData = new FormData()
    formData.append('file', file, file.fullPath || file.name)
    await fileStore.uploadFile(formData)
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