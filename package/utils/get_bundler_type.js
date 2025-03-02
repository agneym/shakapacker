const config = require("../config")

const getBundlerType = () => config.bundler_type

const isRspack = () => getBundlerType() === "rspack"

module.exports = {
  getBundlerType,
  isRspack
}
