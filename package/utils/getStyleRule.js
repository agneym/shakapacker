/* eslint global-require: 0 */
const { rspack } = require("@rspack/core")
const { canProcess, moduleExists } = require("./helpers")
const inliningCss = require("./inliningCss")
const { isRspack } = require("./getBundlerType")

const getStyleRule = (test, preprocessors = []) => {
  if (moduleExists("css-loader")) {
    const tryPostcss = () =>
      canProcess("postcss-loader", (loaderPath) => ({
        loader: loaderPath,
        options: { sourceMap: true }
      }))

    const styleLoader = () => {
      if (inliningCss) {
        return "style-loader"
      }
      if (isRspack()) {
        return rspack.CssExtractRspackPlugin.loader
      }
      return require("mini-css-extract-plugin").loader
    }

    // style-loader is required when using css modules with HMR on the webpack-dev-server
    const use = [
      styleLoader,
      {
        loader: require.resolve("css-loader"),
        options: {
          sourceMap: true,
          importLoaders: 2,
          modules: {
            auto: true
          }
        }
      },
      tryPostcss(),
      ...preprocessors
    ].filter(Boolean)

    return {
      test,
      use
    }
  }

  return null
}

module.exports = getStyleRule
