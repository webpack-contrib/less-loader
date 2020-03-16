import os from 'os';

import clone from 'clone';

import createWebpackLessPlugin from './createWebpackLessPlugin';

/**
 * Get the less options from the loader context and normalizes its values
 *
 * @param {object} loaderContext
 * @param {object} loaderOptions
 * @param {string} content
 * @returns {Object}
 */
function getLessOptions(loaderContext, loaderOptions, content) {
  const options = clone(
    loaderOptions.lessOptions
      ? typeof loaderOptions.lessOptions === 'function'
        ? loaderOptions.lessOptions(loaderContext) || {}
        : loaderOptions.lessOptions
      : {}
  );

  const data = loaderOptions.prependData
    ? typeof loaderOptions.prependData === 'function'
      ? loaderOptions.prependData(loaderContext) + os.EOL + content
      : loaderOptions.prependData + os.EOL + content
    : content;

  const lessOptions = {
    plugins: [],
    relativeUrls: true,
    // We need to set the filename because otherwise our WebpackFileManager will receive an undefined path for the entry
    filename: loaderContext.resourcePath,
    ...options,
    data,
  };

  if (typeof lessOptions.paths === 'undefined') {
    lessOptions.plugins.push(createWebpackLessPlugin(loaderContext));
  }

  const useSourceMap =
    typeof loaderOptions.sourceMap === 'boolean'
      ? loaderOptions.sourceMap
      : loaderContext.sourceMap;

  if (useSourceMap) {
    lessOptions.sourceMap = {
      outputSourceFiles: true,
    };
  }

  return lessOptions;
}

export default getLessOptions;
