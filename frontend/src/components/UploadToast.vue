<script setup>
import { useFileStore } from '@/stores/files'
import { computed, ref, watch } from 'vue'
const fileStore = useFileStore()
const showToast = computed(() => fileStore.uploadQueue.length > 0)
const show = ref(true)

let hideTimeout = null

watch(
  () => fileStore.uploadQueue.map(item => item.status),
  (statuses, prevStatuses) => {
    const hasActive = fileStore.uploadQueue.some(
      item => item.status === 'uploading' || item.status === 'pending'
    )
    if (!hasActive) {
      // keine aktiven uploads mehr, toast nach 3s ausblenden
      if (hideTimeout) clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => {
        show.value = false
      }, 3000)
    } else {
      // Uploads wieder aktiv, Toast sofort anzeigen
      if (hideTimeout) clearTimeout(hideTimeout)
      show.value = true
    }
  },
  { immediate: true }
)
</script>

<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="position-fixed end-0 bottom-0 p-3"
    style="z-index: 1080; min-width: 320px;"
  >
    <div
      v-if="showToast && show"
      class="toast show"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style="min-width: 300px;"
    >
      <div class="toast-header bg-white">
        <strong class="me-auto">Uploads</strong>
        <button type="button" class="btn-close" @click="show = false" aria-label="Schließen"></button>
      </div>
      <div class="toast-body pt-2" style="max-height: 300px; overflow-y: auto;">
        <div
          v-for="item in fileStore.uploadQueue"
          :key="item.id"
          class="mb-3 pb-2 border-bottom"
        >
          <div class="d-flex align-items-center justify-content-between">
            <span class="small flex-fill me-2 text-truncate">{{ item.name }}</span>
            <span v-if="item.status === 'uploading'" class="badge bg-primary">Lädt hoch…</span>
            <span v-if="item.status === 'paused'" class="badge bg-warning text-dark">Pause</span>
            <span v-if="item.status === 'done'" class="badge bg-success">Fertig</span>
            <span v-if="item.status === 'error'" class="badge bg-danger">Fehler</span>
            <span v-if="item.status === 'canceled'" class="badge bg-secondary">Abgebrochen</span>
          </div>
          <div class="progress mt-1" style="height: 6px;" v-if="item.status !== 'done' && item.status !== 'canceled'">
            <div
              class="progress-bar"
              :class="{
                'bg-success': item.status === 'uploading',
                'bg-warning': item.status === 'paused',
                'bg-danger': item.status === 'error'
              }"
              :style="{ width: item.progress + '%' }"
              role="progressbar"
              :aria-valuenow="item.progress"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <div class="mt-1 small">
            <button
              v-if="item.status === 'uploading'"
              class="btn btn-sm btn-outline-warning me-1"
              @click="fileStore.pauseUpload(item.id)"
            >
              Pause
            </button>
            <button
              v-if="item.status === 'paused'"
              class="btn btn-sm btn-outline-success me-1"
              @click="fileStore.resumeUpload(item.id)"
            >
              Fortsetzen
            </button>
            <button
              v-if="item.status !== 'done' && item.status !== 'canceled'"
              class="btn btn-sm btn-outline-danger"
              @click="fileStore.cancelUpload(item.id)"
            >
              Abbrechen
            </button>
            <span class="text-danger ms-2" v-if="item.error">{{ item.error }}</span>
          </div>
        </div>
        <div v-if="fileStore.uploadQueue.length === 0" class="text-muted small text-center">Keine Uploads</div>
      </div>
    </div>
  </div>
</template>