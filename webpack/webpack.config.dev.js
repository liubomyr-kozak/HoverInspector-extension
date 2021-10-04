const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const baseConfig = require('./webpack.config.base');

module.exports = merge(baseConfig, {
  mode: 'development',
  // devtool: 'source-map',
  plugins: [
    new HtmlWebpackPlugin({
      template: "./webpack/public/index.html"
    }),
  ],
  devServer: { hot: true }
});