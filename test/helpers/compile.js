const path = require('path');

const webpack = require('webpack');

const fixturePath = path.resolve(__dirname, '..', 'fixtures');
const outputPath = path.resolve(__dirname, '..', 'output');

function compile(fixture, moduleRules, resolveAlias = {}) {
  return new Promise((resolve, reject) => {
    const entry = path.resolve(fixturePath, 'less', `${fixture}.less`);

    webpack(
      {
        mode: 'development',
        entry,
        output: {
          path: outputPath,
          // omitting the js extension to prevent jest's watcher from triggering
          filename: 'bundle',
        },
        module: {
          rules: moduleRules,
        },
        resolve: {
          alias: resolveAlias,
        },
      },
      (err, stats) => {
        const problem =
          err || stats.compilation.errors[0] || stats.compilation.warnings[0];

        if (problem) {
          const message =
            typeof problem === 'string' ? problem : 'Unexpected error';
          const error = new Error(problem.message || message);

          error.originalError = problem;
          error.stats = stats;

          reject(error);

          return;
        }

        resolve(stats);
      }
    );
  });
}

module.exports = compile;
