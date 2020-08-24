import path from 'path';

import less from 'less';

import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';
import { getLessOptions, isUnsupportedUrl } from './utils';
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

  if (typeof options.additionalData !== 'undefined') {
    data =
      typeof options.additionalData === 'function'
        ? `${options.additionalData(data, this)}`
        : `${options.additionalData}\n${data}`;
  }

  less
    .render(data, lessOptions)
    .then(({ css, map, imports }) => {
      imports.forEach((item) => {
        if (isUnsupportedUrl(item)) {
          return;
        }

        // `less` return forward slashes on windows when `webpack` resolver return an absolute windows path in `WebpackFileManager`
        // Ref: https://github.com/webpack-contrib/less-loader/issues/357
        this.addDependency(path.normalize(item));
      });

      callback(null, css, typeof map === 'string' ? JSON.parse(map) : map);
    })
    .catch((lessError) => {
      if (lessError.filename) {
        // `less` return forward slashes on windows when `webpack` resolver return an absolute windows path in `WebpackFileManager`
        // Ref: https://github.com/webpack-contrib/less-loader/issues/357
        this.addDependency(path.normalize(lessError.filename));
      }

      callback(new LessError(lessError));
    });
}

export default lessLoader;
