<template>
  <div>


    <!-- Dropzone -->
    <div class="dropzone border border-dashed rounded p-5 mb-4 text-center" @dragover.prevent
      @drop.prevent="handleDrop($event)">
      <p class="mb-0">📁 Drag & Drop files or folders here to upload</p>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploading" class="alert alert-info">
      Upload läuft... {{ uploadedCount }} / {{ totalFiles }} Dateien hochgeladen.
    </div>
    <div v-if="uploadError" class="alert alert-danger">
      ❌ Upload-Fehler: {{ uploadError }}
    </div>
    <div v-if="uploadDone && !uploadError" class="alert alert-success">
      ✅ Upload abgeschlossen!
    </div>

    <!-- List / Grid view wie zuvor -->
    <div v-if="viewMode === 'list'" class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Modified</th>
            <th class="text-end">Size</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in flatList" :key="file.path">
            <td :style="{ paddingLeft: `${file.depth * 20}px` }" class="align-middle">
              <div class="d-flex align-items-center text-muted">
                <iconify-icon :icon="getFileIcon(file)" class="me-2" width="20" height="20" />
                {{ file.name }}
              </div>
            </td>
            <td>{{ file.modified }}</td>
            <td class="text-end">{{ file.size }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="row row-cards">
      <div class="col-sm-6 col-md-4 col-lg-3" v-for="file in files" :key="file.path">
        <div class="card">
          <div class="card-body text-center">
            <iconify-icon :icon="getFileIcon(file)" width="32" height="32" />
            <div class="fw-bold text-truncate mt-2">{{ file.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import axios from '@/axios'

const props = defineProps({
  nodes: Object
});

const viewMode = inject('viewMode', ref('list'))
const files = computed(() => Array.isArray(props.nodes) ? props.nodes : (props.nodes?.children || []))

const uploading = ref(false)
const uploadDone = ref(false)
const uploadError = ref('')
const totalFiles = ref(0)
const uploadedCount = ref(0)

// --- Datei-Typ & Icon ---
const getFileIcon = (file) => {
  switch (file.type) {
    case 'folder': return 'mdi:folder'
    case 'image': return 'mdi:file-image'
    case 'video': return 'mdi:file-video'
    case 'audio': return 'mdi:file-music'
    case 'ppt': return 'mdi:file-powerpoint'
    case 'archive': return 'mdi:archive'
    case 'code': return 'mdi:file-code'
    default: return 'mdi:file'
  }
}
const detectFileType = (name) => {
  const ext = name.split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'video'
  if (['mp3', 'wav'].includes(ext)) return 'audio'
  if (['ppt', 'pptx'].includes(ext)) return 'ppt'
  if (['zip', 'rar'].includes(ext)) return 'archive'
  if (['js', 'css', 'ts', 'php', 'html'].includes(ext)) return 'code'
  return 'file'
}
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// --- List-View mit Tiefe (für Einrückung) ---
const flatList = computed(() => {
  const list = []
  const recurse = (items, depth = 0) => {
    // Zuerst alle Ordner, dann alle Dateien, jeweils alphabetisch sortiert
    const sorted = [...items].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1
      if (a.type !== 'folder' && b.type === 'folder') return 1
      return a.name.localeCompare(b.name)
    })
    for (const item of sorted) {
      list.push({ ...item, depth })
      if (item.type === 'folder' && item.children) recurse(item.children, depth + 1)
    }
  }
  recurse(files.value)
  return list
})

// --- Ordner-Inhalt vom Backend laden ---
const fetchFolderContents = async (folderPath) => {
  try {
    const res = await axios.get('/files/folder', { params: { path: folderPath } });
    return res.data;
  } catch (err) {
    uploadError.value = 'Fehler beim Laden des Ordners: ' + (err.message || err);
    return [];
  }
};

// --- DRAG & DROP HANDLER ---
const handleDrop = async (event) => {
  uploadError.value = ''
  uploading.value = true
  uploadDone.value = false
  uploadedCount.value = 0

  const droppedItems = event.dataTransfer.items
  const entries = []
  for (let i = 0; i < droppedItems.length; i++) {
    const item = droppedItems[i].webkitGetAsEntry?.()
    if (item) entries.push(item)
  }

  const collected = []
  for (const entry of entries) {
    await collectFiles(entry, '', collected)
  }

  totalFiles.value = collected.length

  for (const { file, fullPath } of collected) {
    await uploadToBackend(file, fullPath)
    uploadedCount.value++
  }

  uploading.value = false
  uploadDone.value = true

  // Nach dem Upload nur den selektierten Ordner aktualisieren
  if (props.nodes?.path) {

    console.log(props.nodes?.path);

    props.nodes.children = await fetchFolderContents(props.nodes.path);
  }

  // Optional: Anzeigen in der Liste
  files.value.push(...collected.map(({ file, fullPath }) => ({
    name: file.name,
    type: detectFileType(file.name),
    size: formatBytes(file.size),
    modified: new Date(file.lastModified).toLocaleString(),
    path: fullPath,
    children: undefined // wichtig, damit flatList nicht rekursiv weiterläuft
  })))
}

// --- REKURSIVES SAMMELN VON DATEIEN ---
const collectFiles = async (entry, currentPath, collected) => {
  if (entry.isFile) {
    const file = await new Promise(resolve => entry.file(resolve))
    collected.push({
      file,
      name: file.name,
      fullPath: currentPath + '/' + file.name
    })
  } else if (entry.isDirectory) {
    const reader = entry.createReader()
    const entries = await new Promise(resolve => reader.readEntries(resolve))
    for (const sub of entries) {
      await collectFiles(sub, currentPath + '/' + entry.name, collected)
    }
  }
}

// --- UPLOAD ZUM BACKEND ---
const uploadToBackend = async (file, fullPath) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', fullPath) // backend kann daraus Ordnerstruktur erzeugen

    await axios.post('/files/upload', formData)
  } catch (err) {
    uploadError.value = err.message || 'Upload fehlgeschlagen'
  }
}

</script>

<style scoped>
.dropzone {
  background: #f8fafc;
}

.dropzone:hover {
  background: #e7f1fc;
  cursor: pointer;
}
</style>