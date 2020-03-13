import clone from 'clone';
import less from 'less';
import pify from 'pify';

import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';
import processResult from './processResult';
import createWebpackLessPlugin from './createWebpackLessPlugin';

const render = pify(less.render.bind(less));

function lessLoader(source) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'Less Loader',
    baseDataPath: 'options',
  });

  const done = this.async();
  const isSync = typeof done !== 'function';

  if (isSync) {
    throw new Error(
      'Synchronous compilation is not supported anymore. See https://github.com/webpack-contrib/less-loader/issues/84'
    );
  }

  const lessOptions = {
    plugins: [],
    relativeUrls: true,
    // We need to set the filename because otherwise our WebpackFileManager will receive an undefined path for the entry
    filename: this.resourcePath,
    ...(options.lessOptions ? clone(options.lessOptions) : {}),
  };

  if (typeof lessOptions.paths === 'undefined') {
    lessOptions.plugins.push(createWebpackLessPlugin(this));
  }

  if (options.sourceMap) {
    if (typeof options.sourceMap === 'boolean') {
      lessOptions.sourceMap = {};
    }

    if (typeof options.sourceMap.outputSourceFiles === 'undefined') {
      // Include source files as `sourceContents` as sane default since this makes source maps "just work" in most cases
      lessOptions.sourceMap.outputSourceFiles = true;
    }
  }

  processResult(this, render(source, lessOptions));
}

export default lessLoader;
