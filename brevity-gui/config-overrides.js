/* config-overrides.js */
module.exports = function override(config, env) {
  config.resolve.symlinks = false  
//do stuff with the webpack config...
  return config;
}
