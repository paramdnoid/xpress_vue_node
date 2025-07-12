export async function getFilesFromDataTransferItems(items) {
  const files = []
  async function traverseEntry(entry, path = '') {
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve))
      file.relativePath = path + file.name
      files.push(file)
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = await new Promise(resolve => reader.readEntries(resolve))
      for (const child of entries) {
        await traverseEntry(child, path + entry.name + '/')
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