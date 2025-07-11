<template>
  <div>
    <!-- Ordner -->
    <div v-if="node && node.type === 'folder'">
      <a class="nav-link"
         href="#"
         @click.prevent="toggle"
         :data-bs-toggle="'collapse'"
         :data-bs-target="`#collapse_${safeId}`"
         :aria-expanded="isOpen.toString()"
         @dragover.prevent
         @drop.prevent="handleDropOnFolder"
      >
        {{ node.name }}
        <span v-if="loading" class="spinner-border spinner-border-sm ms-auto" role="status"></span>
        <span v-else class="nav-link-toggle"></span>
      </a>

      <transition name="tree-slide">
        <nav v-show="isOpen" class="nav nav-vertical" :id="`collapse_${safeId}`">
          <Tree v-for="child in (node.children || []).filter(c => c.type === 'folder')" :key="child.path" :node="child" />
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
import axios from '@/axios';

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
      const res = await axios.get('/files', {
        params: { path: props.node.path }
      });
      props.node.children = res.data.children
        .map(child => ({
          ...child,
          size: child.size || null,
          updated: child.updated || null
        }));
      fileStore.setCurrentPath(props.node.path); // Breadcrumb aktualisieren
    } finally {
      loading.value = false;
    }
  } else if (isOpen.value && props.node.type === 'folder') {
    fileStore.setCurrentPath(props.node.path); // bereits geladene Ordner
  }
};

const handleDropOnFolder = async (event) => {
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
    formData.append('paths[]', `${props.node.path}/${file.relativePath}`.replace(/^\/+/, ''));

    try {
      await axios.post('/files/upload', formData);
    } catch (err) {
      console.error('Fehler beim Upload:', err);
    }
  }

  // Optional: Reload folder view
  await toggle(); // collapse
  await toggle(); // re-expand and reload
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