const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
    mode: 'development',
    entry: {
        inject: path.join(__dirname, '/src/inject.js'),
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: '[name].bundle.js',
        jsonpFunction: 'available_second_react'
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
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                enforce: "pre", // preload the jshint loader
                use: [{
                    loader: "url-loader",
                    options: {
                        query: {limit: 25000}
                    }
                }]
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./test_page.html"
        }),
    ],
    devServer: {historyApiFallback: true},
};

module.exports = config;