<template>
  <div class="file-preview">
    <template v-if="fileType.startsWith('image')">
      <img :src="previewUrl" class="img-fluid rounded shadow" style="max-width: 200px; max-height: 200px;" />
    </template>

    <template v-else-if="fileType.startsWith('video')">
      <img :src="`/api/thumbs/${filename}`" style="max-width: 200px; max-height: 200px;" class="rounded shadow" />
    </template>

    <template v-else-if="fileType === 'application/pdf'">
      <iframe :src="previewUrl" width="100%" height="600px"></iframe>
    </template>

    <template v-else-if="fileType.startsWith('text')">
      <pre>{{ textContent }}</pre>
    </template>

    <template v-else>
      <p>Dateivorschau nicht verfügbar.</p>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { useRoute } from 'vue-router'

const route = useRoute()
const filename = route.params.filename
const previewUrl = `/api/preview/${filename}`

const fileType = ref('')
const textContent = ref('')

onMounted(async () => {
  const res = await axios.head(previewUrl)
  fileType.value = res.headers['content-type']

  if (fileType.value.startsWith('text')) {
    const response = await axios.get(previewUrl)
    textContent.value = response.data
  } else if (fileType.value.startsWith('video')) {
    // no additional action needed for videos currently
  }
})
</script>

<style scoped>
.file-preview {
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>