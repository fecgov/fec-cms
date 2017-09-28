/* global __dirname */
/* jslint maxlen: false */

var path = require('path');
var webpack = require('webpack');
var ManifestPlugin = require('webpack-manifest-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var fs = require('fs');

var entries = {
  'init': './fec/static/js/init.js',
  'data-init': './fec/static/js/data-init.js',
  'vendor': ['jquery', 'handlebars']
};

var datatablePages = [];

fs.readdirSync('./fec/static/js/pages').forEach(function(f) {
  if (f.search('.js') < 0 ) { return; } // Skip non-js files
  var name = f.split('.js')[0];
  var p = path.join('./fec/static/js/pages', f);
  entries[name] = './' + p;

  // Note all datatable pages for getting the common chunk
  if (name.search('datatable-') > -1) {
    datatablePages.push(name);
  }
});

module.exports = [
  {
    name: 'all',
    entry: entries,
    plugins: [
      // deletes old build files
      new CleanWebpackPlugin(['./dist/fec/static/js'], {
        verbose: true,
        dry: false
      }),
      new webpack.optimize.CommonsChunkPlugin({
        // Contains d3, leaflet, and other shared code for maps and charts
        // Included on data landing, candidate single, committee single and election pages
        name: 'dataviz-common',
        filename: 'dataviz-common-[hash].js',
        minChunks: 3,
        chunks: ['landing', 'candidate-single', 'committee-single', 'elections']
      }),
      new webpack.optimize.CommonsChunkPlugin({
        // Contains shared datatable and filter code
        // Included on all datatable pages
        name: 'datatable-common',
        filename: 'datatable-common-[hash].js',
        chunks: datatablePages
      }),
      new webpack.optimize.CommonsChunkPlugin({
        // Contains jquery and handlebars
        // Included on every page
        name: 'vendor',
        filename: 'vendor.js',
      }),
      new webpack.SourceMapDevToolPlugin(),
      new ManifestPlugin({
        fileName: 'rev-manifest.json',
        basePath: '/static/js/'
      }),
      // Uncomment to compress and analyze the size of bundles
      // new webpack.optimize.UglifyJsPlugin(),
      // new BundleAnalyzerPlugin()
    ],
    output: {
      filename: '[name]-[hash].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    module: {
        loaders: [
            {
              test: /\.hbs/,
              use: ['handlebars-template-loader', 'cache-loader']
            }
        ],
    },
    resolve: {
      alias: {
        // There's a known issue with jquery.inputmask and webpack.
        // These aliases resolve the issues
        'jquery': path.join(__dirname, '../node_modules/jquery/dist/jquery.js'),
        'inputmask.dependencyLib': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.dependencyLib.js'),
        'jquery.inputmask/dist/inputmask/inputmask.date.extensions': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.date.extensions.js'),
        'inputmask': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.js'),
        'jquery.inputmask': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/jquery.inputmask.js')
      }
    },
    node: {
      fs: 'empty'
    },
    watchOptions: {
      ignored: /node_modules/
    },
    stats: {
      assetSort: 'field',
      modules: false,
      warnings: false
    }
  },
  {
    name: 'legal',
    entry: {'legalApp': './fec/static/js/legal/LegalApp.js'},
    output: {
      filename: 'legalApp-[hash].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    plugins: [
      new webpack.SourceMapDevToolPlugin(),
      new ManifestPlugin({
        fileName: 'rev-legal-manifest.json',
        basePath: '/static/js/'
      }),
    ],
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: ['latest', 'react']
          }
        }
      ]
    },
    stats: {
      assetSort: 'field',
      modules: false,
      warnings: false
    }
  }
];
