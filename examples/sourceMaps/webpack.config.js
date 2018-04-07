module.exports = {
  mode: 'development',
  entry: require.resolve('./main.less'),
  output: {
    filename: 'bundle.js',
  },
  devtool: 'eval',
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: require.resolve('../../dist'),
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  devServer: {
    inline: true,
  },
};
