export async function getFilesFromDataTransferItems(items) {
  const files = []
  const MAX_CONCURRENT = 50  // Aggressiv, ggf. anpassen!

  // paralleler Pool (ohne Überlauf)
  async function asyncPool(limit, array, iteratorFn) {
    const ret = []
    const executing = []
    for (const item of array) {
      const p = Promise.resolve().then(() => iteratorFn(item))
      ret.push(p)
      if (limit <= array.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1))
        executing.push(e)
        if (executing.length >= limit) {
          await Promise.race(executing)
        }
      }
    }
    return Promise.all(ret)
  }

  async function readAllEntries(reader) {
    let entries = []
    let batch
    do {
      batch = await new Promise(resolve => reader.readEntries(resolve))
      if (batch.length) entries = entries.concat(batch)
    } while (batch.length > 0)
    return entries
  }

  async function traverseEntry(entry) {
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve))
      file.relativePath = entry.fullPath.replace(/^\//, '')
      files.push(file)
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = await readAllEntries(reader)
      // Aggressiv parallelisieren, limitiert über Pool
      await asyncPool(MAX_CONCURRENT, entries, traverseEntry)
    }
  }

  // Alle root entries in parallelem Pool abarbeiten
  await asyncPool(MAX_CONCURRENT, Array.from(items), async (item) => {
    const entry = item.webkitGetAsEntry?.()
    if (entry) await traverseEntry(entry)
  })

  return files
}