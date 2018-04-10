const lessLoader = require.resolve('../../src/cjs');
const helperLoader = require.resolve('./helperLoader.js');
const someFileLoader = require.resolve('./someFileLoader.js');

function basic(
  lessLoaderOptions,
  lessLoaderContext = {},
  inspectCallback = () => {}
) {
  return [
    {
      test: /\.less$/,
      loaders: [
        {
          loader: helperLoader,
          options: lessLoaderContext,
        },
        {
          loader: 'inspect-loader',
          options: {
            callback: inspectCallback,
          },
        },
        {
          loader: lessLoader,
          options: lessLoaderOptions,
        },
      ],
    },
  ];
}

function nonLessImport(inspectCallback) {
  return [
    {
      test: /\.less$/,
      loaders: [
        {
          loader: helperLoader,
        },
        {
          loader: 'inspect-loader',
          options: {
            callback: inspectCallback,
          },
        },
        {
          loader: lessLoader,
        },
      ],
    },
    {
      test: /some\.file$/,
      loaders: [
        {
          loader: someFileLoader,
        },
      ],
    },
  ];
}

exports.basic = basic;
exports.nonLessImport = nonLessImport;
