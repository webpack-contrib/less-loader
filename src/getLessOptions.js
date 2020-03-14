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

  if (loaderOptions.sourceMap) {
    if (typeof loaderOptions.sourceMap === 'boolean') {
      lessOptions.sourceMap = {};
    }

    if (typeof loaderOptions.sourceMap.outputSourceFiles === 'undefined') {
      // Include source files as `sourceContents` as sane default since this makes source maps "just work" in most cases
      lessOptions.sourceMap.outputSourceFiles = true;
    }
  }

  return lessOptions;
}

export default getLessOptions;
