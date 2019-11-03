var path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        'webpage.chrome': './src/webpage/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'extension'),
        filename: '[name].js'
    }
};