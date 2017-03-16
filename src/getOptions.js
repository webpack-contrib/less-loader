const loaderUtils = require('loader-utils');
const cloneDeep = require('clone-deep');
const createWebpackLessPlugin = require('./createWebpackLessPlugin');

/**
 * Retrieves the options from the loaderContext, makes a deep copy of it and normalizes it for further consumption.
 *
 * @param {LoaderContext} loaderContext
 */
function getOptions(loaderContext) {
  const options = {
    plugins: [],
    relativeUrls: true,
    compress: Boolean(loaderContext.minimize),
    ...cloneDeep(loaderUtils.getOptions(loaderContext)),
  };

  // We need to set the filename because otherwise our WebpackFileManager will receive an undefined path for the entry
  options.filename = loaderContext.resource;

  // It's safe to mutate the array now because it has already been cloned
  options.plugins.push(createWebpackLessPlugin(loaderContext, options.root));

  return options;
}

module.exports = getOptions;
