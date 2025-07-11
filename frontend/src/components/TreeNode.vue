<template>
  <div>
    <!-- Ordner -->
    <div v-if="node.type === 'folder'">
      <a
        class="nav-link"
        href="#"
        @click.prevent="toggle"
        :data-bs-toggle="'collapse'"
        :data-bs-target="`#collapse_${safeId}`"
        :aria-expanded="isOpen.toString()"
      >
        {{ node.name }}
        <span v-if="loading" class="spinner-border spinner-border-sm ms-auto" role="status"></span>
        <span v-else class="nav-link-toggle"></span>
      </a>

      <nav
        class="nav nav-vertical collapse"
        :class="{ show: isOpen }"
        :id="`collapse_${safeId}`"
      >
        <TreeNode
          v-for="child in node.children"
          :key="child.path"
          :node="child"
        />
      </nav>
    </div>

    <!-- Datei -->
    <div v-else>
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
        .filter(child => child.type === 'folder')
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
</script>