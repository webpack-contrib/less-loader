const less = require('less');
const loaderUtils = require('loader-utils');
const pify = require('pify');

const stringifyLoader = require.resolve('./stringifyLoader.js');
const trailingSlash = /[/\\]$/;
const isLessCompatible = /\.(le|c)ss$/;
// Less automatically adds a .less file extension if no extension was given.
// This is problematic if there is a module request like @import "~some-module";
// because in this case Less will call our file manager with `~some-module.less`.
// Since dots in module names are highly discouraged, we can safely assume that
// this is an error and we need to remove the .less extension again.
// However, we must not match something like @import "~some-module/file.less";
const matchMalformedModuleFilename = /(~[^/\\]+)\.less$/;

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
      const url = filename.replace(matchMalformedModuleFilename, '$1');
      const moduleRequest = url.charAt(0) === '/' ? url : loaderUtils.urlToRequest(url);
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
