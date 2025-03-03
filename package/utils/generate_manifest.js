/* eslint-disable no-restricted-syntax */

function recursiveChunkGroup(chunkGroup) {
  const parents = chunkGroup.getParents()
  if (!parents.length) {
    return [chunkGroup.name]
  }
  return parents.flatMap((chunkParent) => recursiveChunkGroup(chunkParent))
}

function recursiveChunkEntryNames(chunk) {
  const isChunkName = (name) => Boolean(name)

  const [...chunkGroups] = chunk.groupsIterable
  const names = chunkGroups
    .flatMap((chunkGroup) => recursiveChunkGroup(chunkGroup))
    .filter(isChunkName)

  return [...new Set(names)]
}

module.exports = function generateManifest(_seed, files) {
  const chunkEntries = new Map()

  files.forEach((file) => {
    if (file.chunk) {
      const names = recursiveChunkEntryNames(file.chunk)

      for (const name of names) {
        chunkEntries.set(name, [file, ...(chunkEntries.get(name) || [])])
      }
    }

    return file.path
  })

  const entrypoints = {}

  for (const [name, chunkFiles] of chunkEntries) {
    const assets = new Set()
    const js = []
    const css = []

    for (const file of chunkFiles) {
      if (file.path.endsWith(".css")) {
        css.push(file.path)
      } else {
        js.push(file.path)
      }

      for (const auxiliaryFile of file.chunk.auxiliaryFiles) {
        assets.add(auxiliaryFile)
      }
    }

    const entryManifest = {}

    if (assets.size) {
      entryManifest.assets = Array.from(assets)
    }

    entryManifest.assets = {
      js,
      css
    }

    entrypoints[name] = entryManifest
  }

  const manifestData = {
    entrypoints
  }

  return manifestData
}
