const loaderUtils = require('loader-utils');
const clone = require('clone');

const createWebpackLessPlugin = require('./createWebpackLessPlugin');

/**
 * Retrieves the options from the loaderContext, makes a deep copy of it and normalizes it for further consumption.
 *
 * @param {LoaderContext} loaderContext
 */
function getOptions(loaderContext) {
  let options;
  const optionFromLoader = clone(loaderUtils.getOptions(loaderContext)) || {};

  // eslint-disable-next-line prefer-const
  options = optionFromLoader;
  options.lessOptions = optionFromLoader.lessOptions || {};
  options.lessOptions.plugins = optionFromLoader.lessOptions.plugins || [];
  options.lessOptions.rewriteUrls =
    optionFromLoader.lessOptions.rewriteUrls || 'all';

  // We need to set the filename because otherwise our WebpackFileManager will receive an undefined path for the entry
  options.lessOptions.filename = loaderContext.resource;

  // When no paths are given, we use the webpack resolver
  if ('paths' in options.lessOptions === false) {
    // It's safe to mutate the array now because it has already been cloned
    options.lessOptions.plugins.push(createWebpackLessPlugin(loaderContext));
  }

  if (options.sourceMap) {
    if (typeof options.sourceMap === 'boolean') {
      options.lessOptions.sourceMap = {};
    }
    if (typeof options.sourceMap.outputSourceFiles === 'undefined') {
      // Include source files as `sourceContents` as sane default since this makes source maps "just work" in most cases
      options.lessOptions.sourceMap.outputSourceFiles = true;
    }
  }

  return options;
}

module.exports = getOptions;
