<template>
  <SidebarLayout>
    <template #sidebar>
      <div>
        <div class="subheader mb-2 px-3 fw-bolder">
          Navigation
        </div>
        <nav class="nav nav-vertical px-2">
          <TreeNode v-for="file in files" :key="file.path" :node="file" />
        </nav>
      </div>
    </template>
    <template #content>

    </template>
  </SidebarLayout>
</template>

<script setup>
import axios from '@/axios';
import { onMounted, ref } from 'vue';
import TreeNode from '@/components/TreeNode.vue';
import SidebarLayout from '@/layouts/SidebarLayout.vue'

const files = ref([]);

onMounted(async () => {
  const res = await axios.get('/files');

  console.log(res.data.children);

  files.value = res.data.children;
});
</script>