// R O B E R T,
// KEEP LOOKING FOR
//   THE ORDER OF WHEN THINGS ARE LOADING
//   IF INIT, ETC ARE FIRING TOO OFTEN
//   IF WE ARE INCLUDING ONLY THE CODE WE NEED (AS OPPOSED TO LOADING JUST EVERYTHING)

/* global __dirname */

const path = require('path');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
// var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const fs = require('fs');

const entries = {
  vendor: ['jquery', 'handlebars'],
  init: './fec/static/js/init.js',
  'data-init': './fec/static/js/data-init.js',
  'dataviz-common': [
    './fec/static/js/pages/data-landing.js',
    './fec/static/js/pages/candidate-single.js',
    './fec/static/js/pages/committee-single.js',
    './fec/static/js/pages/elections.js'
  ],
  'datatable-common': []
};

// const datatablePages = [];
fs.readdirSync('./fec/static/js/pages').forEach(function(f) {
  if (f.search('.js') < 0) {
    return;
  } // Skip non-js files
  let name = f.split('.js')[0];
  let p = path.join('./fec/static/js/pages', f);
  entries[name] = './' + p;

  // Note all datatable pages for getting the common chunk
  if (name.search('datatable-') > -1) {
    entries['datatable-common'].push('./' + p);
  }
});

module.exports = [
  {
    name: 'all',
    bail: true,
    mode: 'none',
    entry: entries,
    output: {
      filename: '[name]-[hash].js',
      path: path.resolve('./dist/fec/static/js')
    },
    plugins: [
      // deletes old build files
      new CleanWebpackPlugin({
        // Clean the dist js path, but the defaults are good
        // cleanOnceBeforeBuildPatterns: ['./dist/fec/static/js'],
        // verbose: true,
        // dry: false
      }),
      new ManifestPlugin({
        fileName: 'rev-manifest-js.json',
        basePath: '/static/js/',
        publicPath: '/static/js/'
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
    optimization: {
      minimize: false,
      splitChunks: {
        chunks: 'initial',
        cacheGroups: {
          vendor: {
            // Contains jquery and handlebars
            // Included on every page
            filename: 'vendor.js',
            name: 'vendor',
            reuseExistingChunk: true,
            chunks: 'all'
          },
          'dataviz-common': {
            // Contains d3, leaflet, and other shared code for maps and charts
            // Included on data landing, candidate single, committee single and election pages
            filename: 'dataviz-common-[hash].js',
            name: 'dataviz-common',
            reuseExistingChunk: true
          },
          'datatable-common': {
            // Contains shared datatable and filter code
            // Included on all datatable pages
            // chunks: datatablePages,
            filename: 'datatable-common-[hash].js',
            name: 'datatable-common',
            reuseExistingChunk: true
          }
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.hbs/,
          use: ['handlebars-template-loader', 'cache-loader']
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }]
              ]
            }
          }
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
        ),
        'handlebars/runtime': path.join(
          __dirname,
          '../node_modules/handlebars/dist/cjs/handlebars.runtime'
        ),
        handlebars: path.join(
          __dirname,
          '../node_modules/handlebars/dist/handlebars.js'
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
      colors: true,
      errors: true,
      errorDetails: true,
      hash: true,
      modules: false,
      warnings: true
    }
  },
  {
    // The modules are separate because we want them in a specific place and named predictably
    name: 'widgets',
    entry: {
      'aggregate-totals': './fec/static/js/widgets/aggregate-totals.js',
      'aggregate-totals-box': './fec/static/js/widgets/aggregate-totals-box.js'
    },
    output: {
      filename: 'widgets/[name].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    node: {
      fs: 'empty',
      path: true
    },
    plugins: [
      new webpack.SourceMapDevToolPlugin(),
      new ManifestPlugin({
        fileName: 'rev-widgets-manifest-js.json',
        basePath: '/static/js/'
      })
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }]
              ]
            }
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
    bail: true,
    mode: 'none',
    entry: {
      legalApp: './fec/static/js/legal/LegalApp.js',
      polyfills: './fec/static/js/polyfills.js'
    },
    output: {
      filename: '[name].js',
      path: path.resolve('./dist/fec/static/js')
    },
    plugins: [
      // new webpack.SourceMapDevToolPlugin(),
      new ManifestPlugin({
        fileName: 'rev-legal-manifest-js.json',
        basePath: '/static/js/',
        publicPath: '/static/js/'
      })
    ],
    optimization: {
      minimize: false,
      splitChunks: {
        cacheGroups: {
          polyfills: {
            filename: '[name].js',
            name: 'polyfills'
          }
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        }
      ]
    },
    stats: {
      assetsSort: 'field',
      colors: true,
      errors: true,
      errorDetails: true,
      hash: true,
      modules: false,
      warnings: true
    }
  },
  {
    name: 'draftail',
    bail: true,
    mode: 'none',
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
      new ManifestPlugin({
        fileName: 'rev-draftail-manifest-js.json',
        basePath: '/static/js/',
        publicPath: '/static/js/'
      })
    ],
    optimization: {
      minimize: false
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        }
      ]
    },
    stats: {
      assetsSort: 'field',
      colors: true,
      errors: true,
      errorDetails: true,
      hash: true,
      modules: false,
      warnings: true
    }
  }
];
