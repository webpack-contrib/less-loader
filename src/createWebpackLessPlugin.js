import { promisify } from 'util';

import less from 'less';

import { urlToRequest } from 'loader-utils';

/* eslint-disable class-methods-use-this */

const stringifyLoader = require.resolve('./stringifyLoader.js');
const trailingSlash = /[/\\]$/;
const isLessCompatible = /\.(le|c)ss$/;

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

  const loadModule = promisify(loaderContext.loadModule.bind(loaderContext));
  const readFile = promisify(fs.readFile.bind(fs));

  const resolve = loaderContext.getResolve({
    mainFields: ['less', 'style', 'main', '...'],
    mainFiles: ['_index', 'index', '...'],
    extensions: ['.less', '.css', '...'],
  });

  class WebpackFileManager extends less.FileManager {
    supports(filename) {
      if (this.isPathAbsolute(filename)) {
        return false;
      }

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
      if (options.ext && !isModuleName.test(filename)) {
        return this.tryAppendExtension(filename, options.ext);
      }

      return filename;
    }

    async loadFile(filename, currentDirectory, options) {
      const url = this.getUrl(filename, options);

      const moduleRequest = urlToRequest(
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
    minVersion: [3, 0, 0],
  };
}

module.exports = createWebpackLessPlugin;
