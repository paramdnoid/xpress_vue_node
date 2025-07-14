// /src/stores/files.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/axios'
import debug from 'debug'
const log = debug('fileStore')

// --- SETTINGS ---
const MESSAGES = {
  UPLOAD_SUCCESS: (file) => `Datei ${file} erfolgreich hochgeladen`,
  DELETE_SUCCESS: 'Datei/Ordner erfolgreich gelöscht',
  LOAD_ERROR: 'Fehler beim Laden der Dateien',
  UPLOAD_ERROR: 'Fehler beim Hochladen der Datei',
  DELETE_ERROR: 'Fehler beim Löschen der Datei/des Ordners',
  TOTAL_SIZE_ERROR: 'Fehler beim Abrufen der Gesamtspeichergröße',
}
const DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024

function calcMaxParallelUploads(totalBytes) {
  return totalBytes > 500 * 1024 * 1024 ? 8 : 4
}

// --- DEBOUNCED PROGRESS ---
let lastUpdate = 0
function debouncedProgressUpdate(queueMap, uploadItem) {
  const now = Date.now()
  if (now - lastUpdate > 50) {
    queueMap.set(uploadItem.id, { ...uploadItem })
    lastUpdate = now
  } else {
    requestAnimationFrame(() => queueMap.set(uploadItem.id, { ...uploadItem }))
  }
}

// --- FILE TREE ---
function buildFileTree(flatFiles) {
  const pathMap = {}, root = []
  flatFiles.forEach(file => {
    file.children = []
    pathMap[file.path] = file
  })
  flatFiles.forEach(file => {
    const segments = file.path.split('/')
    if (segments.length === 1) root.push(file)
    else {
      const parent = pathMap[segments.slice(0, -1).join('/')]
      if (parent) parent.children.push(file)
      else root.push(file)
    }
  })
  return root
}

export const useFileStore = defineStore('file', () => {
  // --- STATE ---
  const currentPath = ref('/')
  const setCurrentPath = (path) => { currentPath.value = path || '/' }
  const files = ref([])
  const error = ref(null)
  const success = ref(null)
  const totalSize = ref(null)
  const preparationProgress = ref({ done: 0, total: 0 })

  // ** NEU: MAP-basierte Queue **
  const uploadQueue = ref(new Map())
  const isUploading = ref(false)

  // --- FILE LOAD ---
  const loadFiles = async (path = currentPath.value) => {
    error.value = null; success.value = null
    try {
      const response = await axios.get('/files', { params: { path } })
      files.value = buildFileTree(response.data.children || [])
    } catch (err) {
      log('❌ Error loading files:', err)
      error.value = MESSAGES.LOAD_ERROR
    }
  }

  // --- POOL-BASIERTER UPLOAD ---
  async function uploadWorker(queueMap) {
    while (true) {
      // Nächstes Pending-Item
      const next = Array.from(queueMap.values())
        .find(i => i.status === 'pending' && !i.paused && !i.canceled)
      if (!next) return
      next.status = 'uploading'
      next.startTime = Date.now()
      next.progress = 0
      next.error = null

      try {
        const formData = new FormData()
        formData.append('file', next.chunkFile)
        formData.append('relativePath', next.fullFileName)
        formData.append('chunkIndex', next.chunkIndex.toString())
        formData.append('totalChunks', next.totalChunks.toString())
        if (next.userId) formData.append('userId', next.userId)

        await axios.post('/files/upload-chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (pe) => {
            if (pe.lengthComputable) {
              next.progress = Math.round((pe.loaded * 100) / pe.total)
              debouncedProgressUpdate(queueMap, next)
            }
          },
          signal: next.controller.signal,
        })

        next.endTime = Date.now()
        next.duration = next.endTime - next.startTime
        next.status = 'done'
        next.progress = 100
        debouncedProgressUpdate(queueMap, next)

        // Blitzschnell löschen, kein setTimeout nötig
        queueMap.delete(next.id)
        success.value = MESSAGES.UPLOAD_SUCCESS(next.fullFileName)

      } catch (err) {
        log('❌ Upload error:', err)
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          next.status = 'canceled'; next.canceled = true
        } else {
          next.status = 'error'
          next.error = MESSAGES.UPLOAD_ERROR
          error.value = next.error
        }
        debouncedProgressUpdate(queueMap, next)
      }
    }
  }

  const processUploadQueue = async () => {
    if (isUploading.value) return
    isUploading.value = true

    const queueMap = uploadQueue.value
    const totalSizeBytes = Array.from(queueMap.values()).reduce((sum, i) => sum + (i.chunkFile?.size || 0), 0)
    const MAX_PARALLEL_UPLOADS = calcMaxParallelUploads(totalSizeBytes)
    log('⚙️ Upload parallelism:', MAX_PARALLEL_UPLOADS)

    const workers = []
    for (let i = 0; i < MAX_PARALLEL_UPLOADS; i++) {
      workers.push(uploadWorker(queueMap))
    }
    try {
      await Promise.all(workers)
      await loadFiles()
      try {
        const size = await getTotalSize()
        if (size !== null) totalSize.value = size
      } catch (err) { log('❌ Error getting total size:', err) }
    } catch (err) { log('❌ Error in upload workers:', err) }
    isUploading.value = false
  }

  // --- QUEUE MANAGEMENT ---
  const enqueueUpload = ({ chunkFile, fullFileName, chunkIndex, totalChunks, userId }) => {
    const id = Date.now() + Math.random().toString(16).slice(2)
    const controller = new AbortController()
    uploadQueue.value.set(id, {
      id, name: fullFileName, status: 'pending', progress: 0, error: null,
      controller, paused: false, canceled: false, chunkFile, fullFileName, chunkIndex, totalChunks, userId,
      startTime: null, endTime: null, duration: null,
    })
    processUploadQueue().catch(err => log('❌ Error processing upload queue:', err))
  }

  const uploadFile = ({ chunkFile, fullFileName, chunkIndex, totalChunks, userId }) => {
    enqueueUpload({ chunkFile, fullFileName, chunkIndex, totalChunks, userId })
  }

  const pauseUpload = (id) => {
    const item = uploadQueue.value.get(id)
    if (item && !item.canceled && item.status !== 'done') {
      item.paused = true
      if (item.status === 'uploading') item.controller.abort()
      item.status = 'paused'
      debouncedProgressUpdate(uploadQueue.value, item)
    }
  }
  const resumeUpload = (id) => {
    const item = uploadQueue.value.get(id)
    if (item && item.paused && !item.canceled && item.status !== 'done') {
      item.paused = false
      item.status = 'pending'
      item.controller = new AbortController()
      debouncedProgressUpdate(uploadQueue.value, item)
      processUploadQueue().catch(err => log('❌ Error on resume:', err))
    }
  }
  const cancelUpload = (id) => {
    const item = uploadQueue.value.get(id)
    if (item && !item.canceled && item.status !== 'done') {
      item.controller.abort()
      item.status = 'canceled'
      item.canceled = true
      debouncedProgressUpdate(uploadQueue.value, item)
    }
  }

  const deleteFile = async (path) => {
    error.value = null; success.value = null
    try {
      await axios.delete(`/files/delete/${encodeURIComponent(path)}`)
      success.value = MESSAGES.DELETE_SUCCESS
      await loadFiles()
    } catch (err) {
      log('❌ Error deleting file:', err)
      error.value = MESSAGES.DELETE_ERROR
      throw err
    }
  }

  const resetMessages = () => { error.value = null; success.value = null }
  const getTotalSize = async () => {
    error.value = null
    try {
      const response = await axios.get('/files/total-size')
      return response.data.size
    } catch (err) {
      log('❌ Error getting total size:', err)
      error.value = MESSAGES.TOTAL_SIZE_ERROR
      return null
    }
  }

  const getUploadQueueStatus = () => {
    let pending = 0, uploading = 0, paused = 0, err = 0, done = 0, total = uploadQueue.value.size
    for (const item of uploadQueue.value.values()) {
      if (item.status === 'pending') pending++
      else if (item.status === 'uploading') uploading++
      else if (item.status === 'paused') paused++
      else if (item.status === 'error') err++
      else if (item.status === 'done') done++
    }
    return { pending, uploading, paused, error: err, done, total }
  }

  const updatePreparationProgress = (done, total) => {
    preparationProgress.value.done = done
    preparationProgress.value.total = total
  }

  return {
    currentPath,
    setCurrentPath,
    files,
    loadFiles,
    error,
    success,
    uploadFile,
    deleteFile,
    resetMessages,
    getTotalSize,
    uploadQueue,
    enqueueUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    totalSize,
    isUploading,
    getUploadQueueStatus,
    preparationProgress,
    updatePreparationProgress,
    updateUploadDuration: (id) => {
      const item = uploadQueue.value.get(id)
      if (item && item.startTime && item.endTime) return item.endTime - item.startTime
      return null
    }
  }
})