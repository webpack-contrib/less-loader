import clone from 'clone';

import createWebpackLessPlugin from './createWebpackLessPlugin';

/**
 * Get the less options from the loader context and normalizes its values
 *
 * @param {object} loaderContext
 * @param {object} loaderOptions
 * @returns {Object}
 */
function getLessOptions(loaderContext, loaderOptions) {
  const lessOptions = {
    plugins: [],
    relativeUrls: true,
    // We need to set the filename because otherwise our WebpackFileManager will receive an undefined path for the entry
    filename: loaderContext.resourcePath,
    ...(loaderOptions.lessOptions ? clone(loaderOptions.lessOptions) : {}),
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
