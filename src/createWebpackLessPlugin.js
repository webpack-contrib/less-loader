/* eslint-disable class-methods-use-this */
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

// This somewhat changed in Less 3.x. Now the file name comes without the
// automatically added extension whereas the extension is passed in as `options.ext`.
// So, if the file name matches this regexp, we simply ignore the proposed extension.
const isModuleName = /^~[^/\\]+$/;

/**
 * Creates a Less plugin that uses webpack's resolving engine that is provided by the loaderContext.
 *
 * @param {LoaderContext} loaderContext
 * @param {string=} root
 * @returns {LessPlugin}
 */
function createWebpackLessPlugin(loaderContext) {
  const { fs } = loaderContext;

  const loadModule = pify(loaderContext.loadModule.bind(loaderContext));
  const readFile = pify(fs.readFile.bind(fs));

  const resolve = loaderContext.getResolve({
    mainFields: ['less', 'style', 'main', '...'],
    mainFiles: ['_index', 'index', '...'],
    extensions: ['.less', '.css', '...'],
  });

  class WebpackFileManager extends less.FileManager {
    supports() {
      // Our WebpackFileManager handles all the files
      return true;
    }

    // Sync resolving is used at least by the `data-uri` function.
    // This file manager doesn't know how to do it, so let's delegate it
    // to the default file manager of Less.
    // We could probably use loaderContext.resolveSync, but it's deprecated,
    // see https://webpack.js.org/api/loaders/#this-resolvesync
    supportsSync() {
      return false;
    }

    getUrl(filename, options) {
      if (less.version[0] >= 3) {
        if (options.ext && !isModuleName.test(filename)) {
          return this.tryAppendExtension(filename, options.ext);
        }

        return filename;
      }

      return filename.replace(matchMalformedModuleFilename, '$1');
    }

    async loadFile(filename, currentDirectory, options) {
      const url = this.getUrl(filename, options);

      const moduleRequest = loaderUtils.urlToRequest(
        url,
        url.charAt(0) === '/' ? '' : null
      );

      // Less is giving us trailing slashes, but the context should have no trailing slash
      const context = currentDirectory.replace(trailingSlash, '');
      const resolvedFilename = await resolve(context, moduleRequest);

      loaderContext.addDependency(resolvedFilename);

      if (isLessCompatible.test(resolvedFilename)) {
        const fileBuffer = await readFile(resolvedFilename);
        const contents = fileBuffer.toString('utf8');

        return {
          contents,
          filename: resolvedFilename,
        };
      }

      const loadedModule = await loadModule(
        [stringifyLoader, resolvedFilename].join('!')
      );
      const contents = JSON.parse(loadedModule);

      return {
        contents,
        filename: resolvedFilename,
      };
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
