const path = require('path');
const { NxWebpackPlugin } = require('@nx/webpack');

module.exports = {
  output: {
    path: path.join(__dirname, '../dist/ratings-service'),
  },
  target: 'node',
  plugins: [
    new NxWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      optimization: false,
      outputHashing: 'none',
      sourceMap: true,
      assets: [],
      webpackConfig: undefined,
    }),
  ],
};
