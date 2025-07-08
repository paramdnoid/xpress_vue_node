<template>
  <SidebarLayout>
    <template #sidebar>
    <div class="p-4">
      <h3>📂 Your Files</h3>
      <ul>
        <TreeNode v-for="node in treeData" :key="node.path" :node="node" />
      </ul>
    </div>

                    
    </template>

    <!-- Your main content here -->
  </SidebarLayout>
</template>

<script setup>
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import axios from '@/axios';
import { onMounted, ref } from 'vue';
import TreeNode from '@/components/TreeNode.vue';

const treeData = ref([]);

onMounted(async () => {
  const res = await axios.get('/files');
  treeData.value = res.data;
});
</script>