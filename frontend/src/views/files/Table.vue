<template>
  <div class="table-responsive px-2 h100 z-3">
    <table class="table table-hover table-vcenter">
      <thead>
        <tr>
          <th>Type</th>
          <th class="w-100">Name</th>
          <th class="text-center">Size</th>
          <th class="text-center">Updated</th>
          <th></th>
        </tr>
      </thead>
      <tbody @dragover.prevent @drop.prevent="handleDropOnTable">
        <tr v-if="fileStore.currentPath && fileStore.currentPath !== '/'" @click="goBack" style="cursor: pointer">
          <td><iconify-icon icon="icon-park-solid:back" width="18" height="18"></iconify-icon></td>
          <td colspan="4">..</td>
        </tr>
        <tr v-for="file in fileStore.files" :key="file.name" @click="handleClick(file)" style="cursor: pointer">
          <td><iconify-icon :icon="getFileIcon(file)" class="icon text-primary" width="24" height="24" /></td>
          <td>{{ file.name }}</td>
          <td class="text-center">
            <span v-if="file.size !== null">{{ file.size }}</span>
            <span v-else class="text-muted">…</span>
          </td>
          <td class="text-center">{{ file.updated }}</td>
          <td>
            <div class="d-flex gap-1 align-items-center">
              <button @click.stop class="btn btn-icon border-0 text-primary bg-transparent" title="Open">
                <iconify-icon icon="mdi:eye-outline" />
              </button>
              <button @click.stop="deleteFile(file)" class="btn btn-icon border-0 text-danger bg-transparent"
                title="Delete">
                <iconify-icon icon="mdi:trash-can-outline" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useFileStore } from '@/stores/files'
import { getFileIcon } from '@/utils/fileIcon'
import { getFilesFromDataTransferItems } from '@/composables/useFileDragAndDrop'

const fileStore = useFileStore()

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
</style>