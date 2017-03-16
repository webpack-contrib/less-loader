const less = require('less');
const loaderUtils = require('loader-utils');

const trailingSlash = /[\\/]$/;

/**
 * Creates a Less plugin that uses webpack's resolving engine that is provided by the loaderContext.
 *
 * @param {LoaderContext} loaderContext
 * @param {string=} root
 * @returns {LessPlugin}
 */
function createWebpackLessPlugin(loaderContext, root) {
  function WebpackFileManager(...args) {
    less.FileManager.apply(this, args);
  }

  WebpackFileManager.prototype = Object.create(less.FileManager.prototype);

  WebpackFileManager.prototype.supports = function supports(/* filename, currentDirectory, options, environment */) {
        // Our WebpackFileManager handles all the files
    return true;
  };

  WebpackFileManager.prototype.supportsSync = function supportsSync(/* filename, currentDirectory, options, environment */) {
    return false;
  };

  WebpackFileManager.prototype.loadFile = function loadFile(filename, currentDirectory, options, environment, callback) {
    const moduleRequest = loaderUtils.urlToRequest(filename, root);
    // Less is giving us trailing slashes, but the context should have no trailing slash
    const context = currentDirectory.replace(trailingSlash, '');

    loaderContext.resolve(context, moduleRequest, (err, filename) => {
      if (err) {
        callback(err);
        return;
      }

      loaderContext.addDependency(filename);
      // The default (asynchronous)
      // loadModule() accepts a request. Thus it's ok to not use path.resolve()
      loaderContext.loadModule(`-!${__dirname}/stringify.loader.js!${filename}`, (err, data) => { // eslint-disable-line no-path-concat
        if (err) {
          callback(err);
          return;
        }

        callback(null, {
          contents: JSON.parse(data),
          filename,
        });
      });
    });
  };

  return {
    install(lessInstance, pluginManager) {
      pluginManager.addFileManager(new WebpackFileManager());
    },
    minVersion: [2, 1, 1],
  };
}

module.exports = createWebpackLessPlugin;
