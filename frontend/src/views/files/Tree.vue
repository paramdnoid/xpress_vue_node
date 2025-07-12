<template>
  <div>
    <!-- Ordner -->
    <div v-if="node && node.type === 'folder'">
      <a class="nav-link" href="#" @click.prevent="toggle" :data-bs-toggle="'collapse'"
        :data-bs-target="`#collapse_${safeId}`" :aria-expanded="isOpen.toString()" @dragover.prevent
        @drop.prevent="handleDropOnFolder">
        {{ node.name }}
        <span v-if="loading" class="spinner-border spinner-border-sm ms-auto" role="status"></span>
        <span v-else class="nav-link-toggle"></span>
      </a>

      <transition name="tree-slide">
        <nav v-show="isOpen" class="nav nav-vertical" :id="`collapse_${safeId}`">
          <Tree v-for="child in (node.children || []).filter(c => c.type === 'folder')" :key="child.path"
            :node="child" />
        </nav>
      </transition>
    </div>

    <!-- Datei -->
    <div v-else-if="node">
      <span class="nav-link disabled">{{ node.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFileStore } from '@/stores/files';

const emit = defineEmits(['row-click']);
const fileStore = useFileStore();
const props = defineProps({ node: Object });
const isOpen = ref(false);
const loading = ref(false);
const safeId = computed(() => props.node.path.replace(/[^\w-]/g, '_'));

// Lazy load children & update breadcrumb
const toggle = async () => {
  isOpen.value = !isOpen.value;
  if (!props.node.children && isOpen.value && props.node.type === 'folder') {
    loading.value = true;
    try {
      await fileStore.loadFiles(props.node.path);
      props.node.children = fileStore.files.filter(c => c.type === 'folder' || c.type === 'file');
      fileStore.setCurrentPath(props.node.path); // Breadcrumb aktualisieren
    } finally {
      loading.value = false;
    }
  } else if (isOpen.value && props.node.type === 'folder') {
    fileStore.setCurrentPath(props.node.path); // bereits geladene Ordner
  }
};

import { getFilesFromDataTransferItems } from '@/composables/useFileDragAndDrop'

const handleDropOnFolder = async (event) => {
  const fileEntries = await getFilesFromDataTransferItems(event.dataTransfer.items)
  for (const file of fileEntries) {
    const formData = new FormData();
    const fileId = crypto.randomUUID();
    const relPath = typeof file.relativePath === 'string' ? file.relativePath : file.name;
    formData.append(`relativePath:${fileId}`, `${props.node.path}/${relPath}`.replace(/^\/+/, ''));
    formData.append(fileId, file, file.name);
    try {
      await fileStore.uploadFile(formData, file.name || file.relativePath);
    } catch (err) {
      console.error('Fehler beim Upload:', err);
    }
  }
  await fileStore.loadFiles(props.node.path);
};
</script>

<style scoped>
.tree-slide-enter-active,
.tree-slide-leave-active {
  transition: all 0.25s ease;
}

.tree-slide-enter-from,
.tree-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
  overflow: hidden;
}

.tree-slide-enter-to,
.tree-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 500px;
}
</style>