const loaderUtils = require('loader-utils');
const clone = require('clone');

const createWebpackLessPlugin = require('./createWebpackLessPlugin');

/**
 * Retrieves the options from the loaderContext, makes a deep copy of it and normalizes it for further consumption.
 *
 * @param {LoaderContext} loaderContext
 */
function getOptions(loaderContext) {
  // { relativeUrls: true } is depreciated
  const options = {
    lessOptions: {
      plugins: [],
      rewriteUrls: 'all',
      ...clone(loaderUtils.getOptions(loaderContext)),
    },
  };

  // We need to set the filename because otherwise our WebpackFileManager will receive an undefined path for the entry
  options.lessOptions.filename = loaderContext.resource;

  // When no paths are given, we use the webpack resolver
  if ('paths' in options.lessOptions === false) {
    // It's safe to mutate the array now because it has already been cloned
    options.lessOptions.plugins.push(createWebpackLessPlugin(loaderContext));
  }

  if (options.lessOptions.sourceMap) {
    if (typeof options.lessOptions.sourceMap === 'boolean') {
      options.lessOptions.sourceMap = {};
    }
    if ('outputSourceFiles' in options.lessOptions.sourceMap === false) {
      // Include source files as `sourceContents` as sane default since this makes source maps "just work" in most cases
      options.lessOptions.sourceMap.outputSourceFiles = true;
    }
  }
  return options;
}

module.exports = getOptions;
