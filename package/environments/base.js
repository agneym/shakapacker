/* eslint global-require: 0 */
/* eslint import/no-dynamic-require: 0 */

const { basename, dirname, join, relative, resolve } = require('path')
const extname = require('path-complete-extname')
const { sync: globSync } = require('glob')
const WebpackAssetsManifest = require('webpack-assets-manifest')
const { RspackManifestPlugin} = require('rspack-manifest-plugin')
const webpack = require('webpack')
const rspack = require('@rspack/core')
const rules = require('../rules')
const { isProduction } = require('../env')
const config = require('../config')
const { moduleExists } = require('../utils/helpers')
const { isRspack } = require('../utils/get_bundler_type')
const generateManifest = require('../utils/generate_manifest')

const getEntryObject = () => {
  const entries = {}
  const rootPath = join(config.source_path, config.source_entry_path)
  if (config.source_entry_path === '/' && config.nested_entries) {
    throw new Error(
      "Your webpacker config specified using a source_entry_path of '/' with 'nested_entries' == " +
      "'true'. Doing this would result in packs for every one of your source files"
    )
  }
  const nesting = config.nested_entries ? '**/' : ''

  globSync(`${rootPath}/${nesting}*.*`).forEach((path) => {
    const namespace = relative(join(rootPath), dirname(path))
    const name = join(namespace, basename(path, extname(path)))
    let assetPaths = resolve(path)

    // Allows for multiple filetypes per entry (https://webpack.js.org/guides/entry-advanced/)
    // Transforms the config object value to an array with all values under the same name
    let previousPaths = entries[name]
    if (previousPaths) {
      previousPaths = Array.isArray(previousPaths)
        ? previousPaths
        : [previousPaths]
      previousPaths.push(assetPaths)
      assetPaths = previousPaths
    }

    entries[name] = assetPaths
  })

  return entries
}

const getModulePaths = () => {
  const result = [resolve(config.source_path)]

  if (config.additional_paths) {
    config.additional_paths.forEach((path) => result.push(resolve(path)))
  }
  result.push('node_modules')

  return result
}

const getManifestPlugin = () => isRspack() ? new RspackManifestPlugin({
  fileName: config.manifestPath,
  publicPath: config.publicPath,
  generate: generateManifest,
  writeToFileEmit: true
}) : new WebpackAssetsManifest({
  entrypoints: true,
  writeToDisk: true,
  output: config.manifestPath,
  entrypointsUseAssets: true,
  publicPath: true
})

const getPlugins = () => {
  const EnvironmentPlugin = isRspack()
    ? rspack.EnvironmentPlugin
    : webpack.EnvironmentPlugin
  const plugins = [
    new EnvironmentPlugin(process.env),
    getManifestPlugin()
  ]

  if (moduleExists('css-loader') && moduleExists('mini-css-extract-plugin')) {
    const hash = isProduction ? '-[contenthash:8]' : ''
    const MiniCssExtractPlugin = isRspack()
      ? rspack.CssExtractRspackPlugin
      : require("mini-css-extract-plugin")
    plugins.push(
      new MiniCssExtractPlugin({
        filename: `css/[name]${hash}.css`,
        chunkFilename: `css/[id]${hash}.css`,
        // For projects where css ordering has been mitigated through consistent use of scoping or naming conventions,
        // the css order warnings can be disabled by setting the ignoreOrder flag.
        // Read: https://stackoverflow.com/questions/51971857/mini-css-extract-plugin-warning-in-chunk-chunkname-mini-css-extract-plugin-con
        ignoreOrder: config.css_extract_ignore_order_warnings
      })
    )
  }

  return plugins
}

// Don't use contentHash except for production for performance
// https://webpack.js.org/guides/build-performance/#avoid-production-specific-tooling
const hash = isProduction ? '-[contenthash]' : ''
module.exports = {
  mode: 'production',
  output: {
    filename: `js/[name]${hash}.js`,
    chunkFilename: `js/[name]${hash}.chunk.js`,

    // https://webpack.js.org/configuration/output/#outputhotupdatechunkfilename
    hotUpdateChunkFilename: 'js/[id].[fullhash].hot-update.js',
    path: config.outputPath,
    publicPath: config.publicPath
  },
  entry: getEntryObject(),
  resolve: {
    extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx', '.coffee'],
    modules: getModulePaths()
  },

  plugins: getPlugins(),

  resolveLoader: {
    modules: ['node_modules']
  },

  optimization: {
    splitChunks: { chunks: 'all' },

    runtimeChunk: 'single'
  },

  module: {
    strictExportPresence: true,
    rules
  }
}
