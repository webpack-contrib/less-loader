import less from 'less';

import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';
import { getLessOptions } from './utils';
import LessError from './LessError';

function lessLoader(source) {
  const options = getOptions(this);

  validateOptions(schema, options, {
    name: 'Less Loader',
    baseDataPath: 'options',
  });

  const callback = this.async();
  const lessOptions = getLessOptions(this, options);

  let data = source;

  if (typeof options.prependData !== 'undefined') {
    data =
      typeof options.prependData === 'function'
        ? `${options.prependData(this)}\n${data}`
        : `${options.prependData}\n${data}`;
  }

  if (typeof options.appendData !== 'undefined') {
    data =
      typeof options.appendData === 'function'
        ? `${data}\n${options.appendData(this)}`
        : `${data}\n${options.appendData}`;
  }

  less
    .render(data, lessOptions)
    .then(({ css, map, imports }) => {
      imports.forEach(this.addDependency, this);

      // Removing the sourceMappingURL comment.
      // See removeSourceMappingUrl.js for the reasoning behind this.
      callback(null, css, typeof map === 'string' ? JSON.parse(map) : map);
    })
    .catch((lessError) => {
      if (lessError.filename) {
        this.addDependency(lessError.filename);
      }

      callback(new LessError(lessError));
    });
}

export default lessLoader;
