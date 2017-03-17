const less = require('less');
const loaderUtils = require('loader-utils');
const pify = require('pify');

const stringifyLoader = require.resolve('./stringifyLoader.js');
const trailingSlash = /[\\/]$/;
const isLessCompatible = /\.(le|c)ss$/;

/**
 * Creates a Less plugin that uses webpack's resolving engine that is provided by the loaderContext.
 *
 * @param {LoaderContext} loaderContext
 * @param {string=} root
 * @returns {LessPlugin}
 */
function createWebpackLessPlugin(loaderContext) {
  const { fs } = loaderContext;
  const resolve = pify(loaderContext.resolve.bind(loaderContext));
  const loadModule = pify(loaderContext.loadModule.bind(loaderContext));
  const readFile = pify(fs.readFile.bind(fs));

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

          if (isLessCompatible.test(resolvedFilename)) {
            return readFile(resolvedFilename)
              .then(contents => contents.toString('utf8'));
          }

          return loadModule([stringifyLoader, resolvedFilename].join('!'))
            .then(JSON.parse);
        })
        .then((contents) => {
          return {
            contents,
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
