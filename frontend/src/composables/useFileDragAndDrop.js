export async function getFilesFromDataTransferItems(items) {
  const files = []
  // Maximal parallel verarbeitete Directory‑Einträge (gegen Memory‑Blowups)
  const BATCH_SIZE = 20

  async function readAllEntries(reader) {
    const entries = []
    let batch
    do {
      batch = await new Promise(resolve => reader.readEntries(resolve))
      entries.push(...batch)
    } while (batch.length > 0)
    return entries
  }

  /**
   * Traversiert FileSystemEntry‑Bäume.
   * Nutzt entry.fullPath → keine doppelten Root‑Segmente mehr.
   * Arbeitet in BATCH_SIZE‑Paketen, um nicht tausende Promises
   * gleichzeitig zu erzeugen.
   */
  async function traverseEntry(entry) {
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve))
      file.relativePath = entry.fullPath.replace(/^\//, '') // führenden Slash kappen
      files.push(file)
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = await readAllEntries(reader)
      // In Batches traversieren, um Parallelität zu begrenzen
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const slice = entries.slice(i, i + BATCH_SIZE)
        await Promise.all(slice.map(child => traverseEntry(child)))
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.()
    if (entry) {
      await traverseEntry(entry)
    }
  }

  return files
}