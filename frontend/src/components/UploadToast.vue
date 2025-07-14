<script setup>
import { useFileStore } from '@/stores/files'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
const fileStore = useFileStore()

const { uploadQueue, preparationProgress, uploadDuration, timeRemaining } = storeToRefs(fileStore)

const uploadQueueItems = computed(() => Array.from(uploadQueue.value.values()));

const overallProgress = computed(() => {
  const queue = uploadQueueItems.value;
  if (!queue.length) return 0;
  const activeItems = queue.filter(item => item.status !== 'done' && item.status !== 'canceled');
  // Durchschnitt aller progress-Werte
  const sum = activeItems.reduce((acc, i) => acc + i.progress, 0);
  return Math.round(sum / (activeItems.length || queue.length));
});

const isActive = computed(() =>
  uploadQueueItems.value.some(item => item.status !== 'done' && item.status !== 'canceled')
);

const isPreparing = computed(() =>
  uploadQueueItems.value.some(item => item.status === 'preparing')
);
</script>

<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="position-fixed end-0 bottom-0 p-3"
    style="z-index: 1080; min-width: 320px;"
  >
    <div
      v-if="isActive"
      class="toast show"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style="min-width: 300px;"
    >
      <div class="toast-header bg-white">
        <strong class="me-auto">Uploads</strong>
        <button type="button" class="btn-close" aria-label="Schließen"></button>
      </div>
      <div class="toast-body pt-2" style="max-height: 300px; overflow-y: auto;">
        <div v-if="isPreparing" class="text-center small text-muted mb-2 d-flex justify-content-center align-items-center gap-2">
          <div class="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true"></div>
          📁 Vorbereitung läuft… ({{ preparationProgress.done }} / {{ preparationProgress.total }})
        </div>
        <div v-if="isActive" class="text-center small mb-2">
          Gesamt-Upload: {{ overallProgress }}%
        </div>
        <div v-if="uploadDuration > 0" class="text-center small text-muted mt-2">
          ⏱️ Upload-Dauer: {{ Math.round(uploadDuration / 1000) }} Sekunden
        </div>
        <div v-if="timeRemaining > 0" class="text-center small text-muted mt-1">
          ⏳ Verbleibend: {{ Math.round(timeRemaining) }} Sekunden
        </div>
        <div class="progress" v-if="isActive">
          <div
            class="progress-bar"
            :class="{
              'bg-primary': overallProgress < 100,
              'bg-success': overallProgress === 100
            }"
            :style="{ width: overallProgress + '%' }"
            role="progressbar"
            :aria-valuenow="overallProgress"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>