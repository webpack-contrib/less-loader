import less from 'less';
import pify from 'pify';
import processResult from './processResult';
import getOptions from './getOptions';

const render = pify(less.render.bind(less));

function lessLoader(source) {
  const loaderContext = this;
  const options = getOptions(loaderContext);
  const done = loaderContext.async();
  const isSync = typeof done !== 'function';

  if (isSync) {
    throw new Error('Synchronous compilation is not supported anymore. See https://github.com/webpack-contrib/less-loader/issues/84');
  }

  processResult(loaderContext, render(source, options));
}

export default lessLoader;
