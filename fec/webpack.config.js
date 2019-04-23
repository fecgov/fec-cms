/* global __dirname */

const path = require('path');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
//   .BundleAnalyzerPlugin;

const fs = require('fs');

const entries = {
  init: './fec/static/js/init.js',
  'data-init': './fec/static/js/data-init.js',
  vendor: ['jquery', 'handlebars'],
  fonts: [
    // TODO - move these to their final home
    './fec/static/fonts/fec-mono-regular.eot',
    './fec/static/fonts/fec-mono-regular.ttf',
    './fec/static/fonts/fec-mono-regular.woff',
    './fec/static/fonts/fec-mono-regular.woff2'
  ]
};

const datatablePages = [];

fs.readdirSync('./fec/static/js/pages').forEach(function(f) {
  if (f.search('.js') < 0) {
    return;
  } // Skip non-js files
  let name = f.split('.js')[0];
  let p = path.join('./fec/static/js/pages', f);
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
      new CleanWebpackPlugin(
        ['./dist/fec/static/js', './dist/fec/static/fonts'],
        {
          verbose: true,
          dry: false
        }
      ),
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
        filename: 'vendor.js'
      }),
      new webpack.SourceMapDevToolPlugin(),
      new ManifestPlugin({
        fileName: 'rev-manifest-js.json',
        basePath: '/static/js/'
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      })
      // Uncomment to compress and analyze the size of bundles
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
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: ['latest']
          }
        },
        {
          // TODO - move these to their final home
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: '../fonts'
              }
            }
          ]
        }
      ]
    },
    resolve: {
      alias: {
        // There's a known issue with jquery.inputmask and webpack.
        // These aliases resolve the issues
        jquery: path.join(__dirname, '../node_modules/jquery/dist/jquery.js'),
        'inputmask.dependencyLib': path.join(
          __dirname,
          '../node_modules/jquery.inputmask/dist/inputmask/inputmask.dependencyLib.js'
        ),
        'jquery.inputmask/dist/inputmask/inputmask.date.extensions': path.join(
          __dirname,
          '../node_modules/jquery.inputmask/dist/inputmask/inputmask.date.extensions.js'
        ),
        inputmask: path.join(
          __dirname,
          '../node_modules/jquery.inputmask/dist/inputmask/inputmask.js'
        ),
        'jquery.inputmask': path.join(
          __dirname,
          '../node_modules/jquery.inputmask/dist/inputmask/jquery.inputmask.js'
        )
      }
    },
    node: {
      fs: 'empty'
    },
    watchOptions: {
      ignored: /node_modules/
    },
    stats: {
      assetsSort: 'field',
      modules: false,
      warnings: false
    }
  },
  {
    // The modules are separate because we want them in a specific place and named predictably
    name: 'modules',
    entry: {
      'aggregate-totals': './fec/static/js/modules/aggregate-totals.js'
    },
    output: {
      filename: 'modules/[name].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    node: {
      fs: 'empty',
      path: true
    },
    plugins: [
      new webpack.SourceMapDevToolPlugin(),
      new ManifestPlugin({
        fileName: 'rev-modules-manifest-js.json',
        basePath: '/static/js/'
      })
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
      assetsSort: 'field',
      modules: false,
      warnings: false
    }
  },
  {
    name: 'legal',
    entry: {
      legalApp: './fec/static/js/legal/LegalApp.js',
      polyfills: './fec/static/js/polyfills.js'
    },
    output: {
      filename: '[name]-[hash].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    plugins: [
      new webpack.SourceMapDevToolPlugin(),
      new ManifestPlugin({
        fileName: 'rev-legal-manifest-js.json',
        basePath: '/static/js/'
      })
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
      assetsSort: 'field',
      modules: false,
      warnings: false
    }
  },
  {
    name: 'draftail',
    entry: { draftail: './fec/static/js/draftail/App.js' },
    output: {
      filename: '[name]-[hash].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    node: {
      fs: 'empty',
      path: true
    },
    plugins: [
      new webpack.SourceMapDevToolPlugin(),
      new ManifestPlugin({
        fileName: 'rev-draftail-manifest-js.json',
        basePath: '/static/js/'
      })
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
      assetsSort: 'field',
      modules: false,
      warnings: false
    }
  }
];
