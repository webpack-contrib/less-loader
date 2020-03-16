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

  const callback = this.async();
  const lessOptions = getLessOptions(this, options, source);

  processResult(this, render(lessOptions.data, lessOptions), callback);
}

export default lessLoader;
