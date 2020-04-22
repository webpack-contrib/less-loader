import less from 'less';

import { urlToRequest } from 'loader-utils';

/* eslint-disable class-methods-use-this */
const trailingSlash = /[/\\]$/;

// This somewhat changed in Less 3.x. Now the file name comes without the
// automatically added extension whereas the extension is passed in as `options.ext`.
// So, if the file name matches this regexp, we simply ignore the proposed extension.
const isModuleName = /^~([^/]+|[^/]+\/|@[^/]+[/][^/]+|@[^/]+\/?|@[^/]+[/][^/]+\/)$/;

/**
 * Creates a Less plugin that uses webpack's resolving engine that is provided by the loaderContext.
 *
 * @param {LoaderContext} loaderContext
 * @param {string=} root
 * @returns {LessPlugin}
 */
function createWebpackLessPlugin(loaderContext) {
  const resolve = loaderContext.getResolve({
    mainFields: ['less', 'style', 'main', '...'],
    mainFiles: ['_index', 'index', '...'],
    extensions: ['.less', '.css'],
  });

  class WebpackFileManager extends less.FileManager {
    supports(filename) {
      if (this.isPathAbsolute(filename)) {
        return false;
      }

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

    async resolveFilename(filename, currentDirectory, options) {
      const url = this.getUrl(filename, options);

      const moduleRequest = urlToRequest(
        url,
        url.charAt(0) === '/' ? '' : null
      );

      // Less is giving us trailing slashes, but the context should have no trailing slash
      const context = currentDirectory.replace(trailingSlash, '');

      return this.resolveRequests(context, [moduleRequest, url]);
    }

    resolveRequests(context, possibleRequests) {
      if (possibleRequests.length === 0) {
        return Promise.reject();
      }

      return resolve(context, possibleRequests[0])
        .then((result) => {
          return result;
        })
        .catch((error) => {
          const [, ...tailPossibleRequests] = possibleRequests;

          if (tailPossibleRequests.length === 0) {
            throw error;
          }

          return this.resolveRequests(context, tailPossibleRequests);
        });
    }

    async loadFile(filename, ...args) {
      let result;

      try {
        if (isModuleName.test(filename)) {
          const error = new Error();

          error.type = 'Next';
          throw error;
        }

        result = await super.loadFile(filename, ...args);
      } catch (error) {
        if (error.type !== 'File' && error.type !== 'Next') {
          loaderContext.emitError(error);

          return Promise.reject(error);
        }

        try {
          result = await this.resolveFilename(filename, ...args);
        } catch (e) {
          return Promise.reject(error);
        }

        loaderContext.addDependency(result);

        return super.loadFile(result, ...args);
      }

      loaderContext.addDependency(result.filename);

      return result;
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
