/* config-overrides.js */
module.exports = function override(config, env) {
// treat symlinks as if they were in src dir. needed for ts
  config.resolve.symlinks = false  
//do stuff with the webpack config...
  return config;
}
