import { promisify } from 'util';

import less from 'less';

import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';
import getLessOptions from './getLessOptions';

const render = promisify(less.render.bind(less));
const removeSourceMappingUrl = require('./removeSourceMappingUrl');
const formatLessError = require('./formatLessError');

function lessLoader(source) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'Less Loader',
    baseDataPath: 'options',
  });

  const callback = this.async();
  const lessOptions = getLessOptions(this, options, source);

  render(lessOptions.data, lessOptions)
    .then(({ css, map, imports }) => {
      imports.forEach(this.addDependency, this);

      // Removing the sourceMappingURL comment.
      // See removeSourceMappingUrl.js for the reasoning behind this.
      callback(
        null,
        removeSourceMappingUrl(css),
        typeof map === 'string' ? JSON.parse(map) : map
      );
    })
    .catch((lessError) => {
      if (lessError.filename) {
        this.addDependency(lessError.filename);
      }

      callback(formatLessError(lessError));
    });
}

export default lessLoader;
