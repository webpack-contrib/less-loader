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
  function prependContent(target, addedData) {
    if (!addedData) {
      return target;
    }

    return typeof addedData === 'function'
      ? addedData(loaderContext) + os.EOL + target
      : addedData + os.EOL + target;
  }

  function appendContent(target, addedData) {
    if (!addedData) {
      return target;
    }

    return typeof addedData === 'function'
      ? target + os.EOL + addedData(loaderContext)
      : target + os.EOL + addedData;
  }

  const options = clone(
    loaderOptions.lessOptions
      ? typeof loaderOptions.lessOptions === 'function'
        ? loaderOptions.lessOptions(loaderContext) || {}
        : loaderOptions.lessOptions
      : {}
  );

  let data = content;
  data = prependContent(data, loaderOptions.prependData);
  data = appendContent(data, loaderOptions.appendData);

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
