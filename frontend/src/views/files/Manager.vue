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
            <iconify-icon @click="viewMode = 'table'"
              :class="[viewMode === 'table' ? 'text-primary' : 'text-primary opacity-50']"
              icon="material-symbols:event-list-outline-sharp" width="20" height="20"></iconify-icon>
            <div class="px-1"></div>
            <iconify-icon @click="viewMode = 'grid'"
              :class="[viewMode === 'grid' ? 'text-primary' : 'text-primary opacity-50']"
              icon="material-symbols:grid-on" width="20" height="20"></iconify-icon>
          </div>
        </div>
        <div class="position-relative flex-fill" @dragover.prevent @drop.prevent="handleDrop">
          <div v-if="fileStore.error" class="text-danger text-center py-4">{{ fileStore.error }}</div>
          <Grid v-if="!fileStore.error && viewMode === 'grid'" :files="fileStore.files" @delete="confirmDelete" />
          <Table v-else-if="!fileStore.error" :files="fileStore.files" @delete="confirmDelete" />
        </div>
      </div>
    </template>
  </SidebarLayout>
</template>

<script setup>
import { onMounted, inject, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useFileStore } from '@/stores/files';
import { getFilesFromDataTransferItems } from '@/composables/useFileDragAndDrop';
import { uploadFilesInChunks } from '@/composables/useChunkedUpload';
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import Tree from './Tree.vue';
import Grid from './Grid.vue'
import Table from './Table.vue'

const fileStore = useFileStore();
const { totalSize } = storeToRefs(fileStore);
const viewMode = inject('viewMode', 'table')
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
  border-bottom: 1px solid var(--tblr-gray-200);
  align-items: center;
  padding: 0 10px;
}


.view-mode {
  width: auto;
  height: 24px;
  display: flex;
  justify-content: center;
  justify-items: center;
  font-size: .8rem;
}

.view-mode iconify-icon {
  width: 20px !important;
  height: 20px !important;
}

.view-mode iconify-icon:hover {
  cursor: pointer;
  opacity: .8;
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