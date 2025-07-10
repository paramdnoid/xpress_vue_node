<template>
  <div v-if="node && node.type === 'folder'">
    <a
      class="nav-link"
      href="#"
      @click.prevent="loadChildren"
      :data-bs-toggle="'collapse'"
      :data-bs-target="'#collapse' + safeId"
      :aria-expanded="isOpen.toString()"
    >
      {{ node.name }}
      <span
        v-if="hasSubfolders"
        class="nav-link-toggle"
      ></span>
    </a>

    <nav
      class="nav nav-vertical collapse"
      :class="{ show: isOpen && node.children }"
      :id="'collapse' + safeId"
    >
      <template v-if="node.children" v-for="child in node.children" :key="child.path">
        <TreeNode v-if="child && child.type === 'folder'" :node="child" @select="$emit('select', $event)" />
      </template>
    </nav>
  </div>
</template>

<script setup>
const emit = defineEmits(['select'])

import axios from '@/axios';
import { ref, computed } from 'vue';

const props = defineProps({
  node: Object
});

const isOpen = ref(false);

const loadChildren = async () => {
  if (!props.node.children) {
    const res = await axios.get('/files', { params: { path: props.node.path } });
    props.node.children = res.data;
  }
  emit('select', props.node)
  isOpen.value = !isOpen.value;
};

// Make ID safe for collapse targets
const safeId = computed(() => {
  return props.node.path.replace(/[^\w-]/g, '_');
});

const hasSubfolders = computed(() =>
  Array.isArray(props.node.children)
    ? props.node.children.some(child => child?.type === 'folder')
    : props.node.type === 'folder'
);
</script>