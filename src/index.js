import less from 'less';

import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';
import getLessOptions from './getLessOptions';
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
  data = prependData(data, options.prependData);
  data = appendData(data, options.appendData);

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

  function prependData(target, addedData) {
    if (!addedData) {
      return target;
    }

    return typeof addedData === 'function'
      ? `${addedData(this)}\n${target}`
      : `${addedData}\n${target}`;
  }

  function appendData(target, addedData) {
    if (!addedData) {
      return target;
    }

    return typeof addedData === 'function'
      ? `${target}\n${addedData(this)}`
      : `${target}\n${addedData}`;
  }
}

export default lessLoader;
