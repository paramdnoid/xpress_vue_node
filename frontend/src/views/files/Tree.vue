<template>
  <div>
    <!-- Ordner -->
    <div v-if="node && node.type === 'folder'">
      <a class="nav-link" href="#" @click.prevent="toggle" :data-bs-toggle="'collapse'"
        :data-bs-target="`#collapse_${safeId}`" :aria-expanded="isOpen.toString()">
        {{ node.name }}
        <span v-if="loading" class="spinner-border spinner-border-sm ms-auto" role="status"></span>
        <span v-else class="nav-link-toggle"></span>
      </a>

      <transition name="tree-slide">
        <nav v-show="isOpen" class="nav nav-vertical" :id="`collapse_${safeId}`">
          <Tree v-for="child in node.children || []" :key="child.path" :node="child" />
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

const fileStore = useFileStore();
const props = defineProps({ node: Object });
const isOpen = ref(false);
const loading = ref(false);
const safeId = computed(() => props.node.path.replace(/[^\w-]/g, '_'));

const toggle = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value && props.node.type === 'folder') {
    fileStore.setCurrentPath(props.node.path);
  }
};
</script>

<style scoped>

</style>