export async function getFilesFromDataTransferItems(items) {
  const files = []

  async function readAllEntries(reader) {
    const entries = []
    let batch
    do {
      batch = await new Promise(resolve => reader.readEntries(resolve))
      entries.push(...batch)
    } while (batch.length > 0)
    return entries
  }

  async function traverseEntry(entry, path = '') {
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve))
      file.relativePath = path + file.name
      files.push(file)
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = await readAllEntries(reader)
      await Promise.all(entries.map(child =>
        traverseEntry(child, path + entry.name + '/')
      ))
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