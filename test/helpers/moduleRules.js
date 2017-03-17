const lessLoader = require.resolve('../../src');
const helperLoader = require.resolve('./helperLoader.js');

function basic(lessLoaderOptions, lessLoaderContext = {}, inspectCallback = () => {}) {
  return [{
    test: /\.less$/,
    loaders: [{
      loader: helperLoader,
      options: lessLoaderContext,
    }, {
      loader: 'inspect-loader',
      options: {
        callback: inspectCallback,
      },
    },
    {
      loader: lessLoader,
      options: lessLoaderOptions,
    }],
  }];
}

exports.basic = basic;
