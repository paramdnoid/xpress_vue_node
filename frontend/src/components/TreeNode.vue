<template>
  <div v-if="node.type === 'folder'">
    <a
      class="nav-link"
      href="#"
      @click.prevent="isOpen = !isOpen"
      :data-bs-toggle="'collapse'"
      :data-bs-target="'#collapse' + safeId"
      :aria-expanded="isOpen.toString()"
    >
      {{ node.name }}
      <span class="nav-link-toggle"></span>
    </a>

    <nav
      class="nav nav-vertical collapse"
      :class="{ show: isOpen }"
      :id="'collapse' + safeId"
    >
      <template v-for="child in node.children" :key="child.path">
        <TreeNode v-if="child.type === 'folder'" :node="child" />
        <div v-else>
          <a class="nav-link" href="#">{{ child.name }}</a>
        </div>
      </template>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  node: Object
});

const isOpen = ref(false);

// Make ID safe for collapse targets
const safeId = computed(() => {
  return props.node.path.replace(/[^\w-]/g, '_');
});
</script>