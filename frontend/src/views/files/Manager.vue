<template>
  <SidebarLayout>
    <template #sidebar>
      <div>
        <div @click.prevent="goToRoot" class="subheader mb-2 px-3 fw-bolder d-flex cursor-pointer">
          Uploads <div class="ms-auto fw-lighter">{{ totalSize }}</div>
        </div>
        <nav class="nav nav-vertical px-2">
          <Tree v-for="child in fileStore.files" :key="child.path" :node="child" />
        </nav>
      </div>
    </template>
    <template #content>
      <div class="d-flex flex-column flex-fill">
        <div class="content-toolbar">
          <div class="breadcrumb-wrapper overflow-auto">
            <ol class="breadcrumb breadcrumb-muted" aria-label="breadcrumbs">
              <li class="breadcrumb-item">
                <a href="#" @click.prevent="goTo(-1)">File Manager</a>
              </li>
              <li v-for="(segment, index) in segments" :key="'file-' + index" class="breadcrumb-item"
                :class="{ active: index === segments.length - 1 }"
                :aria-current="index === segments.length - 1 ? 'page' : null">
                <a v-if="index !== segments.length - 1" href="#" @click.prevent="goTo(index)">
                  {{ segment }}
                </a>
                <span v-else>{{ segment }}</span>
              </li>
            </ol>
          </div>
          <div class="view-mode">
            <a @click="viewMode = 'table'" href="#" class="btn btn-action">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-list">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l11 0" />
                <path d="M9 12l11 0" />
                <path d="M9 18l11 0" />
                <path d="M5 6l0 .01" />
                <path d="M5 12l0 .01" />
                <path d="M5 18l0 .01" />
              </svg>
            </a>
            <a @click="viewMode = 'grid'" href="#" class="btn btn-action">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-table">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" />
                <path d="M3 10h18" />
                <path d="M10 3v18" />
              </svg>
            </a>
          </div>
        </div>
        <div class="position-relative flex-fill" @dragover.prevent @drop.prevent="handleDrop">
          <div v-if="fileStore.error" class="text-danger text-center py-4">{{ fileStore.error }}</div>
          <template v-else>
            <Grid v-if="viewMode === 'grid'" :files="fileStore.files" @delete="confirmDelete" />
            <Table v-if="viewMode === 'table'" :files="fileStore.files" @delete="confirmDelete" />
          </template>
        </div>
      </div>
    </template>
  </SidebarLayout>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useFileStore } from '@/stores/files';
import { onMounted, computed, watch, ref } from 'vue';
import { getFilesFromDataTransferItems } from '@/composables/useFileDragAndDrop';
import { uploadFilesInChunks } from '@/composables/useChunkedUpload';
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import Tree from './Tree.vue';
import Grid from './Grid.vue'
import Table from './Table.vue'

const fileStore = useFileStore();
const { totalSize } = storeToRefs(fileStore);
const viewMode = ref('table');
const segments = computed(() =>
  fileStore.currentPath.split('/').filter(Boolean)
)

const goTo = (index) => {
  const newPath = segments.value.slice(0, index + 1).join('/')
  fileStore.setCurrentPath(newPath)
}

const goToRoot = () => {
  fileStore.setCurrentPath('/');
};

const confirmDelete = async (file) => {
  const isFolder = file.type === 'folder';
  const shouldDelete = confirm(
    isFolder
      ? `Möchtest du den Ordner "${file.name}" inklusive aller Inhalte wirklich löschen?`
      : `Möchtest du "${file.name}" wirklich löschen?`
  );

  if (!shouldDelete) return;

  try {
    await fileStore.deleteFile(file.path);
  } catch (err) {
    console.error(err);
    alert(`${isFolder ? 'Ordner' : 'Datei'} konnte nicht gelöscht werden.`);
  }
};

const handleDrop = async (event) => {
  const fileEntries = await getFilesFromDataTransferItems(event.dataTransfer.items);
  await uploadFilesInChunks(fileEntries, fileStore.currentPath);
};

onMounted(async () => {
  try {
    fileStore.setCurrentPath('/');

    const size = await fileStore.getTotalSize();
    totalSize.value = size || '—';
  } catch (err) {
    fileStore.error = 'Fehler beim Laden der Dateien';
    console.error(err);
  }
});

// Breadcrumb scroll update
import { onUpdated } from 'vue'
onUpdated(() => {
  const el = document.querySelector('.breadcrumb-wrapper');
  if (el) el.scrollLeft = el.scrollWidth;
});

watch(() => fileStore.currentPath, async (newPath) => {
  if (newPath !== null) await fileStore.loadFiles();
}, { immediate: true });

</script>

<style>
.content-toolbar {
  height: 50px;
  display: flex;
  justify-content: space-between;
  background-color: var(--tblr-gray-100);
  /* border-bottom: 1px solid var(--tblr-gray-200); */
  align-items: center;
  padding-left: 10px;
}

@media (max-width: 576px) {
  .breadcrumb {
    flex-wrap: nowrap;
    font-size: 0.75rem;
    padding: 0;
    margin: 0;
    white-space: nowrap;
  }

  .breadcrumb-item {
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-wrap: nowrap;
    padding: 0 4px;

  }

  .breadcrumb-wrapper {
    max-width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    display: block;
    scrollbar-width: none;
    /* Firefox */
  }

  .breadcrumb {
    display: inline-flex;
  }

  .breadcrumb-wrapper::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari */
  }
}

.drop-zone {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>