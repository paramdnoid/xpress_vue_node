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
      <tbody
        @dragover.prevent
        @drop.prevent="handleDropOnTable"
      >
        <tr v-if="fileStore.currentPath && fileStore.currentPath !== '/'" @click="goBack" style="cursor: pointer">
          <td><iconify-icon icon="icon-park-solid:back" width="18" height="18"></iconify-icon></td>
          <td colspan="4">..</td>
        </tr>
        <tr v-for="file in files" :key="file.name" @click="handleClick(file)" style="cursor: pointer">
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
              <button @click.stop="deleteFile(file)" class="btn btn-icon border-0 text-danger bg-transparent" title="Delete">
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
import { watch, ref } from 'vue'
import axios from '@/axios'
import { useFileStore } from '@/stores/files'
import { getFileIcon } from '@/utils/fileIcon'

const props = defineProps(['files'])
const fileStore = useFileStore()
const files = ref([])

watch(() => props.files, (newFiles) => {
  files.value = newFiles
}, { immediate: true })

const emit = defineEmits(['row-click', 'delete'])
const loadFiles = async (path) => {
  const res = await axios.get('/files', { params: { path } })
  const children = res.data.children || []
  children.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'folder' ? -1 : 1
  })
  files.value = children

  children.forEach(file => {
    if (file.type === 'folder' && file.size === null) {
      axios.get('/folder-size', { params: { path: file.path } })
        .then(res => {
          file.size = res.data.size
          files.value = [...files.value];
        })
        .catch(() => {
          file.size = '—'
        })
    }
  })
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

const deleteFile = (file) => {
  const newFile = {
    ...file,
    path: file.path || `${fileStore.currentPath.replace(/\/$/, '')}/${file.name}`,
  };
  emit('delete', newFile);
};

watch(() => fileStore.currentPath, (newPath) => {
  if (newPath) loadFiles(newPath)
}, { immediate: true })

const handleDropOnTable = async (event) => {
  const items = event.dataTransfer.items;
  if (!items) return;

  const fileEntries = [];

  const traverseEntry = async (entry, path = '') => {
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve));
      file.relativePath = path + file.name;
      fileEntries.push(file);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await new Promise(resolve => reader.readEntries(resolve));
      for (const child of entries) {
        await traverseEntry(child, path + entry.name + '/');
      }
    }
  };

  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) {
      await traverseEntry(entry);
    }
  }

  for (const file of fileEntries) {
    const formData = new FormData();
    formData.append('files[]', file);
    formData.append('paths[]', `${fileStore.currentPath}/${file.relativePath}`.replace(/^\/+/, ''));

    try {
      await axios.post('/files/upload', formData);
    } catch (err) {
      console.error('Fehler beim Upload:', err);
    }
  }

  // Optional: reload files after drop
  loadFiles(fileStore.currentPath);
};
</script>

<style>
table tr {
  white-space: nowrap !important;
}
</style>