const less = require('less');
const loaderUtils = require('loader-utils');
const pify = require('pify');

const trailingSlash = /[\\/]$/;

/**
 * Creates a Less plugin that uses webpack's resolving engine that is provided by the loaderContext.
 *
 * @param {LoaderContext} loaderContext
 * @param {string=} root
 * @returns {LessPlugin}
 */
function createWebpackLessPlugin(loaderContext) {
  const resolve = pify(loaderContext.resolve.bind(loaderContext));
  const loadModule = pify(loaderContext.loadModule.bind(loaderContext));

  class WebpackFileManager extends less.FileManager {
    supports(/* filename, currentDirectory, options, environment */) { // eslint-disable-line class-methods-use-this
      // Our WebpackFileManager handles all the files
      return true;
    }

    loadFile(filename, currentDirectory /* , options, environment */) { // eslint-disable-line class-methods-use-this
      const moduleRequest = loaderUtils.urlToRequest(filename);
      // Less is giving us trailing slashes, but the context should have no trailing slash
      const context = currentDirectory.replace(trailingSlash, '');
      let resolvedFilename;

      return resolve(context, moduleRequest)
        .then((f) => {
          resolvedFilename = f;
          loaderContext.addDependency(resolvedFilename);

          return loadModule(`-!${__dirname}/stringify.loader.js!${resolvedFilename}`);
        })
        .then((contents) => {
          return {
            contents: JSON.parse(contents),
            filename: resolvedFilename,
          };
        });
    }
  }

  return {
    install(lessInstance, pluginManager) {
      pluginManager.addFileManager(new WebpackFileManager());
    },
    minVersion: [2, 1, 1],
  };
}

module.exports = createWebpackLessPlugin;
