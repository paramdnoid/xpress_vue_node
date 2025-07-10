<template>
  <SidebarLayout>
    <template #sidebar>
      <div class="col-docs">
        <div class="py-3">
          <div class="space-y space-y-5">
            <div class="flex-fill">
              <nav class="space-y space-y-5" id="menu">
                <div>
                  <div class="subheader mb-2 px-3 fw-bolder">
                    Hauptordner
                  </div>
                  <nav class="nav nav-vertical px-2">
                    <TreeNode v-for="node in treeData" :key="node.path" :node="node" />
                  </nav>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #content>
      <div class="p-2">efex</div>
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