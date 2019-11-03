var path = require('path');
var webpack = require('webpack');
// var UglifyJsPlugin = require('uglifyjs-webpack-plugin');
// https://github.com/webpack-contrib/uglifyjs-webpack-plugin/issues/362 ось такі пироги.. чого треба юзати тестер
var TerserPlugin = require('terser-webpack-plugin');
var JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
    mode: 'production',
    entry: {
        'webpage.chrome': './src/webpage/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'extension'),
        filename: '[name].js'
    },
    optimization: {
        minimizer: [new TerserPlugin({
            terserOptions: {
                ecma: undefined,
                warnings: false,
                parse: {},
                compress: {
                    drop_console: true,
                },
                mangle: true, // Note `mangle.properties` is `false` by default.
                module: false,
                output: null,
                toplevel: false,
                nameCache: null,
                ie8: false,
                keep_classnames: undefined,
                keep_fnames: false,
                safari10: false
            }
        })]
    }
};





