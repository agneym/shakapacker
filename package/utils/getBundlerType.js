const config = require("../config")

const getBundlerType = () => {
  return config.bundler_type
}

const isRspack = () => {
  return getBundlerType() === "rspack"
}

module.exports = {
  getBundlerType,
  isRspack
}
