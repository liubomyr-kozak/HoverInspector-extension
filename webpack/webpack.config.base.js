const path = require('path');

const config = {
  mode: 'development',
  entry: {
    inject_launcher:  ["regenerator-runtime/runtime.js", path.join(__dirname, '../src/index.js')],
    background_popup_script: path.join(__dirname, '../background_popup_script/background_popup_script.js'),
    browser_action_script: path.join(__dirname, '../background_popup_script/browser_action_script.js')
  },
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].bundle.js',
    // jsonpFunction: 'available_second_react'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loaders: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: [
            '@babel/plugin-proposal-class-properties',
          ]
        },
      },
      {
        test: /\.scss$/,
        // use: ['style-loader', 'css-loader'],
        use: ['style-loader', 'css-loader', 'sass-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.(woff(2)?|ttf|eot|png|jpe|jpeg)(\?v=\d+\.\d+\.\d+)?$/,
        enforce: "pre", // preload the jshint loader
        use: [{
          loader: "url-loader",
          options: {
            query: { limit: 25000 }
          }
        }]
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
    ],
  },
  devServer: { historyApiFallback: true },
};

module.exports = config;