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
      <FileBrowser :files="files"/>
    </template>
  </SidebarLayout>
</template>

<script setup>
import axios from '@/axios';
import { onMounted, ref, computed } from 'vue';
import { useFileStore } from '@/stores/files';
import TreeNode from '@/components/TreeNode.vue';
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import FileBrowser from '@/components/FileBrowser.vue';

const files = ref([]);
const fileStore = useFileStore();
const segments = computed(() => fileStore.currentPath.split('/'));

const goTo = async (index) => {
  const path = segments.value.slice(0, index + 1).join('/');
  fileStore.setCurrentPath(path);
};

onMounted(async () => {
  const res = await axios.get('/files');
  files.value = res.data.children;
  fileStore.setCurrentPath('');
});
</script>