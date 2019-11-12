const merge = require('webpack-merge');
const baseConfig = require('./webpack.config.base');
const path = require('path');

module.exports = merge(baseConfig, {
    mode: 'production',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].bundle.js',
    },
});
