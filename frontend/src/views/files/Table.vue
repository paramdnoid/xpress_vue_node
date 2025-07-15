<template>
  <div class="table-responsive h-100 z-3">
    <table class="table table-hover table-vcenter">
      <thead>
        <tr>
          <th>Type</th>
          <th class="w-100">Name</th>
          <th class="text-center">Updated</th>
          <th class="text-center">Size</th>
          <th class="text-center">#</th>
        </tr>
      </thead>
      <tbody @dragover.prevent @drop.prevent="handleDropOnTable">
        <tr v-if="fileStore.currentPath && fileStore.currentPath !== '/'" @click="goBack" style="cursor: pointer">
          <td><iconify-icon icon="icon-park-solid:back" width="18" height="18"></iconify-icon></td>
          <td colspan="4">..</td>
        </tr>
        <tr v-for="file in rows" :key="file.name" @click="handleClick(file)" style="cursor: pointer">
          <td><iconify-icon :icon="getFileIcon(file)" class="icon text-primary" width="24" height="24" /></td>
          <td>{{ file.name }}</td>
          <td class="text-center">{{ file.updated }}</td>
          <td class="text-center">
            <span>{{ file.displaySize }}</span>
          </td>
          <td class="text-danger"><iconify-icon @click.stop="deleteFile(file)" icon="mdi:trash-can-outline" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect, defineEmits } from 'vue'
import axios from '@/axios'
import { useFileStore } from '@/stores/files'
import { getFileIcon } from '@/utils/fileIcon'
import { getFilesFromDataTransferItems } from '@/composables/useFileDragAndDrop'

const fileStore = useFileStore()

const folderSizes = ref({})

const sortedFiles = computed(() => {
  return [...fileStore.files].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    return a.name.localeCompare(b.name)
  })
})

// Fetch folder sizes
watchEffect(() => {
  sortedFiles.value
    .filter(f => f.type === 'folder')
    .forEach(async file => {
      if (folderSizes.value[file.path] != null) return
      try {
        const { data } = await axios.get('/folder-size', { params: { path: file.path } })
        folderSizes.value[file.path] = data.size
      } catch {
        folderSizes.value[file.path] = '—'
      }
    })
})

const rows = computed(() => 
  sortedFiles.value.map(file => ({
    ...file,
    displaySize: file.type === 'folder'
      ? (folderSizes.value[file.path] ?? '…')
      : (file.size ?? '—')
  }))
)

const emit = defineEmits(['delete'])

const handleClick = (file) => {
  if (file.type === 'folder') {
    fileStore.setCurrentPath(file.path)
  }
  // For files, do nothing (no emit)
}

const goBack = () => {
  const parts = fileStore.currentPath.split('/').filter(Boolean)
  if (parts.length > 0) {
    parts.pop()
    const newPath = '/' + parts.join('/')
    fileStore.setCurrentPath(newPath || '/')
  }
}

const deleteFile = (file) => {
  const newFile = {
    ...file,
    path: file.path || `${fileStore.currentPath.replace(/\/$/, '')}/${file.name}`,
  };
  emit('delete', newFile);
};

const handleDropOnTable = async (event) => {
  const fileEntries = await getFilesFromDataTransferItems(event.dataTransfer.items)
  for (const file of fileEntries) {
    const formData = new FormData();
    const pathPart = typeof file.relativePath === 'string' ? file.relativePath : file.name;
    const fileId = crypto.randomUUID();
    formData.append(`relativePath:${fileId}`, `${fileStore.currentPath}/${pathPart}`.replace(/^\/+/, ''));
    formData.append(fileId, file, file.name);
    try {
      await fileStore.uploadFile(formData, file.name || file.relativePath);
    } catch (err) {
      console.error('Fehler beim Upload:', err);
    }
  }
  await fileStore.loadFiles();
};
</script>

<style>
table tr {
  white-space: nowrap !important;
}

table thead tr th {
  background: var(--tblr-gray-100) !important;
  font-weight: bolder !important;
  color: var(--tblr-text-dark) !important;
}

table tbody tr:last-child {
  border-bottom: transparent;
}
</style>