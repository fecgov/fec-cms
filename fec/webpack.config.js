/* global __dirname */

var path = require('path');
var ManifestPlugin = require('webpack-manifest-plugin');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var fs = require('fs');

var entries = {
  'init': './fec/static/js/init.js',
  'data-init': './fec/static/js/data-init.js'
};


fs.readdirSync('./fec/static/js/pages').forEach(function(f) {
  var name = f.split('.js')[0];
  var p = path.join('./fec/static/js/pages', f);
  entries[name] = './' + p;
});

module.exports = {
  entry: entries,
  plugins: [
    new UglifyJSPlugin(),
    new ManifestPlugin({
      fileName: 'rev-manifest.json',
      basePath: '/static/js/'
    })
  ],
  output: {
    filename: '[name]-[hash].js',
    path: path.resolve(__dirname, './dist/fec/static/js')
  },
  module: {
      loaders: [
          {
            test: /\.hbs/,
            loader: 'handlebars-template-loader'
          }
      ]
  }
};
