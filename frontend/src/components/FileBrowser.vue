<template>
      <FileGrid v-if="viewMode === 'grid'" :files="files" />
      <FileTable v-else :files="files" />
</template>

<script setup>
import { ref,inject } from 'vue'
import FileGrid from './FileGrid.vue'
import FileTable from './FileTable.vue'

const viewMode = inject('viewMode', ref('table'))
defineProps(['files'])
</script>