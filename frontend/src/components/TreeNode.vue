<!-- components/TreeNode.vue -->
<template>
  <li>
    <span>{{ node.name }}</span>
    <ul v-if="node.children && node.children.length">
      <TreeNode v-for="child in node.children" :key="child.path" :node="child" />
    </ul>
  </li>
</template>

<script setup>
defineProps({
  node: Object
});
</script>