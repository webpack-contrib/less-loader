const MIN_BABEL_VERSION = 7;

module.exports = (api) => {
  api.assertVersion(MIN_BABEL_VERSION);

  const env = api.env();
  const isTestEnv = env === 'test';

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: isTestEnv ? '6.9.0' : '4.8.0',
          },
        },
      ],
    ],
  };
};
