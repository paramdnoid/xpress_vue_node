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
        <span class="nav-link-toggle"></span>
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
import axios from '@/axios';

const props = defineProps({ node: Object });
const isOpen = ref(false);

const safeId = computed(() => props.node.path.replace(/[^\w-]/g, '_'));

// Lazy load children
const toggle = async () => {
  isOpen.value = !isOpen.value;

  if (!props.node.children && isOpen.value && props.node.type === 'folder') {
    const res = await axios.get('/files', {
      params: { path: props.node.path }
    });

    // Füge dynamisch children hinzu
    props.node.children = res.data.children;
  }
};
</script>