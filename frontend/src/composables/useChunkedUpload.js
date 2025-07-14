// /src/composables/useChunkedUpload.js
import pLimit from 'p-limit'
import { useFileStore } from '@/stores/files'

// Basis-Parameter
const DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024  // 4 MB
const MAX_PARALLEL_CHUNK_UPLOADS = 4               // Chunks pro Datei
const MAX_PARALLEL_FILE_UPLOADS = 5               // Dateien gleichzeitig
const MAX_RETRIES = 3               // Backoff-Versuche
const INITIAL_BACKOFF_MS = 500             // ms

/**
 * Ermittelt dynamisch die Chunk-Größe basierend auf dem Netzwerk-Typ.
 */
function getChunkSize() {
  const conn = navigator.connection?.effectiveType || ''
  if (conn.includes('2g')) return DEFAULT_CHUNK_SIZE / 4
  if (conn.includes('3g')) return DEFAULT_CHUNK_SIZE / 2
  if (conn.includes('4g') || conn === 'wifi') return DEFAULT_CHUNK_SIZE * 2
  return DEFAULT_CHUNK_SIZE
}

/**
 * Führt einen Upload mit exponentiellem Backoff bei Rate-Limits (HTTP 429) oder Timeouts durch.
 */
async function retryWithBackoff(fn, attempt = 1) {
  try {
    return await fn()
  } catch (err) {
    const status = err.response?.status || err.statusCode
    const isRateLimit = status === 429
    if (attempt >= MAX_RETRIES || !isRateLimit) {
      throw err
    }
    const delay = INITIAL_BACKOFF_MS * 2 ** (attempt - 1)
    await new Promise(res => setTimeout(res, delay))
    return retryWithBackoff(fn, attempt + 1)
  }
}

/**
 * Lädt ein Array von File-Objekten in Chunks hoch.
 */
export async function uploadFilesInChunks(files, currentPath = '') {
  const fileStore = useFileStore()
  if (!files?.length) return

  const normalizedPath = currentPath.replace(/^\/+|\/+$/g, '')
  const CHUNK_SIZE = getChunkSize()
  const startTime = performance.now()
  fileStore.updatePreparationProgress(0, files.length)

  const fileLimiter = pLimit(MAX_PARALLEL_FILE_UPLOADS)

  // Erstelle für jede Datei eine Aufgabe mit Limitierung
  const tasks = files.map((file, idx) =>
    fileLimiter(async () => {
      await uploadSingleFileInChunks(file, normalizedPath, fileStore, CHUNK_SIZE)
      fileStore.updatePreparationProgress(idx + 1, files.length)
    })
  )

  try {
    await Promise.all(tasks)
    const duration = performance.now() - startTime
    fileStore.updateUploadDuration(duration)
    console.debug(`✅ Alle Uploads in ${duration.toFixed(0)} ms abgeschlossen`)
  } catch (err) {
    const duration = performance.now() - startTime
    fileStore.updateUploadDuration(duration)
    console.error('Upload process failed:', err)
    throw err
  }
}

/**
 * Lädt eine einzelne Datei in parallelisierten Chunks hoch.
 */
async function uploadSingleFileInChunks(file, normalizedPath, fileStore, CHUNK_SIZE) {
  // Kurze Pause, um den Event-Loop nicht zu blockieren
  await new Promise(r => setTimeout(r, 5))

  if (file.size === 0) {
    console.warn(`Skipping empty file: ${file.name}`)
    return
  }

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const chunkLimiter = pLimit(MAX_PARALLEL_CHUNK_UPLOADS)

  // Pfad + Dateiname
  const relPath = file.webkitRelativePath || file.relativePath || file.name
  const fullPath = (normalizedPath
    ? `${normalizedPath}/${relPath}`
    : relPath
  ).replace(/\/+/g, '/').replace(/^\/+/, '')

  // Parallele Chunk-Uploads mit Backoff-Retry
  const uploads = Array.from({ length: totalChunks }).map((_, chunkIndex) =>
    chunkLimiter(() => {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      return retryWithBackoff(() =>
        fileStore.uploadFile({
          chunkFile: chunk,
          fullFileName: fullPath,
          chunkIndex,
          totalChunks,
          userId: null
        })
      )
    })
  )

  await Promise.all(uploads)
}