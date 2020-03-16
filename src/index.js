import { promisify } from 'util';

import less from 'less';

import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';
import processResult from './processResult';
import getLessOptions from './getLessOptions';

const render = promisify(less.render.bind(less));

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

  const lessOptions = getLessOptions(this, options);

  processResult(this, render(source, lessOptions));
}

export default lessLoader;
