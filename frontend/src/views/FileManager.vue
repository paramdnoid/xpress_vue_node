<template>
  <SidebarLayout>
    <template #sidebar>
      <div>
        <div class="subheader mb-2 px-3 fw-bolder">
          Navigation
        </div>
        <nav class="nav nav-vertical px-2">
          <TreeNode v-for="node in treeData" :key="node.path" :node="node" />
        </nav>
      </div>
    </template>
    <template #content>
      <FileBrowser :nodes="treeData"/>
    </template>
  </SidebarLayout>
</template>

<script setup>
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import FileBrowser from '@/components/FileBrowser.vue';
import axios from '@/axios';
import { onMounted, ref } from 'vue';
import TreeNode from '@/components/TreeNode.vue';

const treeData = ref([]);

onMounted(async () => {
  const res = await axios.get('/files');
  treeData.value = res.data;
});
</script>