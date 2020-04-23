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
  function prependData(target, addedData) {
    if (!addedData) {
      return target;
    }

    return typeof addedData === 'function'
      ? `${addedData(loaderContext)}\n${target}`
      : `${addedData}\n${target}`;
  }

  function appendData(target, addedData) {
    if (!addedData) {
      return target;
    }

    return typeof addedData === 'function'
      ? `${target}\n${addedData(loaderContext)}`
      : `${target}\n${addedData}`;
  }

  const options = clone(
    loaderOptions.lessOptions
      ? typeof loaderOptions.lessOptions === 'function'
        ? loaderOptions.lessOptions(loaderContext) || {}
        : loaderOptions.lessOptions
      : {}
  );

  let data = content;
  data = prependData(data, loaderOptions.prependData);
  data = appendData(data, loaderOptions.appendData);

  const lessOptions = {
    plugins: [],
    relativeUrls: true,
    // We need to set the filename because otherwise our WebpackFileManager will receive an undefined path for the entry
    filename: loaderContext.resourcePath,
    ...options,
    data,
  };

  lessOptions.plugins.push(createWebpackLessPlugin(loaderContext));

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
