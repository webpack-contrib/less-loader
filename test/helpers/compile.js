const path = require('path');
const webpack = require('webpack');

const lessLoader = require.resolve('../../src');
const helperLoader = require.resolve('./helperLoader.js');
const fixturePath = path.resolve(__dirname, '..', 'fixtures');
const outputPath = path.resolve(__dirname, '..', 'output');

function compile(fixture, loaderOptions, loaderContext) {
  return new Promise((resolve, reject) => {
    const entry = path.resolve(fixturePath, 'less', `${fixture}.less`);
    let inspect;

    webpack({
      entry,
      output: {
        path: outputPath,
        filename: 'bundle', // omitting the js extension to prevent jest's watcher from triggering
      },
      module: {
        rules: [{
          test: /\.less$/,
          loaders: [{
            loader: helperLoader,
            options: loaderContext,
          }, {
            loader: 'inspect-loader',
            options: {
              callback(i) {
                inspect = i;
              },
            },
          },
          {
            loader: lessLoader,
            options: loaderOptions,
          }],
        }],
      },
    }, (err, stats) => {
      const problem = err || stats.compilation.errors[0] || stats.compilation.warnings[0];

      if (problem) {
        const message = typeof problem === 'string' ? problem : 'Unexpected error';
        const error = new Error(problem.message || message);

        error.originalError = problem;
        error.stats = stats;

        reject(error);

        return;
      }

      resolve({
        inspect,
        stats,
      });
    });
  });
}

module.exports = compile;
