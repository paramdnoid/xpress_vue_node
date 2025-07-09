<template>
  <SidebarLayout>
    <template #sidebar>
      <div class="col-docs px-3">
        <div class="py-4">
          <div class="space-y space-y-5">
            <div class="flex-fill">
              <nav class="space-y space-y-5" id="menu">
                <div>
                  <div class="subheader mb-2">
                    Tabler UI
                  </div>
                  <nav class="nav nav-vertical">
                    <TreeNode v-for="node in treeData" :key="node.path" :node="node" />
                  </nav>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </template>
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