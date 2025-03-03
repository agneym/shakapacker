const config = require("../config")

const getBundlerType = () => config.bundler_type

const isRspack = () => process.env.BUNDLER_TYPE === "rspack"

module.exports = {
  getBundlerType,
  isRspack
}
