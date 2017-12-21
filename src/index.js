import less from 'less';
import pify from 'pify';
import validateOptions from 'schema-utils';
import processResult from './processResult';
import getOptions from './getOptions';
import schema from './options.json';

const render = pify(less.render.bind(less));

function lessLoader(source) {
  const loaderContext = this;
  const options = getOptions(loaderContext);
  validateOptions(schema, options, 'lessLoader');
  const done = loaderContext.async();
  const isSync = typeof done !== 'function';

  if (isSync) {
    throw new Error(
      'Synchronous compilation is not supported anymore. See https://github.com/webpack-contrib/less-loader/issues/84'
    );
  }

  processResult(loaderContext, render(source, options));
}

export default lessLoader;
