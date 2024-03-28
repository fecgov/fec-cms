/* global import */

// import { CleanWebpackPlugin } from 'clean-webpack-plugin';
// import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

// import fs from 'fs';
// import webpack from 'webpack';
const fs = require('fs');
const webpack = require('webpack');

// import path from 'path';
// import { fileURLToPath } from 'url';
const path = require('path');
const fileURLToPath = require('url');

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

let entries = {
  polyfills: './fec/static/js/polyfills.js',
  vendors: ['handlebars', 'jquery'],
  global: './fec/static/js/global.js',
  home: './fec/static/js/pages/home.js',
  init: './fec/static/js/init.js',
  'data-init': './fec/static/js/data-init.js',
  // 'calc-admin-fines-modal': './fec/static/js/modules/calc-admin-fines-modal.js', // Used inside base.html
  'calc-admin-fines': './fec/static/js/modules/calc-admin-fines.js',
  'candidate-single': './fec/static/js/pages/candidate-single.js',
  'dataviz-common':
    [
      './fec/static/js/pages/data-landing.js',
      // './fec/static/js/pages/candidate-single.js',
      './fec/static/js/pages/committee-single.js',
      './fec/static/js/pages/elections.js'
    ],
    // 'aggregate-totals': './fec/static/js/widgets/aggregate-totals.js',
    'aggregate-totals-box': {
      import: './fec/static/js/widgets/aggregate-totals-box.js',
      filename: 'widgets/aggregate-totals-box.js',
      // publicPath: '/widgets/aggregate-totals-box.js'
    },
    // 'contributions-by-state':
      // './fec/static/js/widgets/contributions-by-state.js',
    'contributions-by-state-box': {
      import: './fec/static/js/widgets/contributions-by-state-box.js',
      filename: 'widgets/contributions-by-state-box.js',
      // publicPath: '/widgets/contributions-by-state-box.js'
    },
    'pres-finance-map-box': {
      import: './fec/static/js/widgets/pres-finance-map-box.js',
      filename: 'widgets/pres-finance-map-box.js',
      // publicPath: '/widgets/contributions-by-state-box.js'
    },
};

const datatablePages = [];

fs.readdirSync('./fec/static/js/pages').forEach(function(f) {
  if (f.search('.js') < 0) {
    return;
  } // Skip non-js files
  let name = f.split('.js')[0];
  // console.log('readdirSync.forEach name: ', name);
  let p = path.join('./fec/static/js/pages', f);
//   entries[name] = './' + p;
  if (['bythenumbers', 'dataviz-common', 'election-lookup'].includes(name))
    entries[name] = './' + p;
//   // Note all datatable pages for getting the common chunk
  if (name.search('datatable-') > -1) {
//     datatablePages.push(name);
  }
});

const env = { production: false };

module.exports = [
  // return [
    {
      // MOST ENTRIES
      mode: env.production ? 'production' : 'development',
      entry: entries,
      optimization: {
        chunkIds: 'named',
        emitOnErrors: true,
        innerGraph: true,
        splitChunks: {
          maxSize: 1000000,
          // maxAsyncSize: 1,
          // cacheGroups: {
          //   defaultVendors: {
          //     test: /[\\/]node_modules[\\/]/,
          //     priority: -10,
          //     reuseExistingChunk: true,
          //   },
          //   default: {
          //     // minChunks: 2,
          //     priority: -20,
          //     reuseExistingChunk: true,
          //   }
          // }
        }
      },
      module: {
        rules: [
          { test: /\.hbs/, use: ['handlebars-loader'] }
        ]
      },
      resolve: {
        // fallback: {
        //   path: require.resolve('path-browserify')
        // },
        extensions: ['.js'],
        // fullySpecified: false,
        // modules: [path.join(__dirname, '../node_modules')],
        alias: {
          // These were 18F but have been archived so we've moved them to our own */modules/*
          'aria-accordion': path.join(__dirname, 'fec/static/js/modules/aria-accordion/src/accordion.js'),
          'component-sticky': path.join(__dirname, 'fec/static/js/modules/component-sticky/index.js'),
          'glossary-panel': path.join(__dirname, 'fec/static/js/modules/glossary-panel/src/glossary.js'),
          // jQuery aliases
          jquery: path.join(__dirname, '../node_modules/jquery/dist/jquery.js'),
          'inputmask.dependencyLib': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.dependencyLib.js'),
          inputmask: path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.js'),
          'inputmask.date.extensions': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.date.extensions.js'),
          //
          'abortcontroller-polyfill': path.join(__dirname, '../node_modules/abortcontroller-polyfill/dist/polyfill-patch-fetch.js'),
          underscore: path.join(__dirname, '../node_modules/underscore/underscore-umd.js'),
        }
      },
      // // webpackChunkName: 'human-friendly'
      plugins: [
        new CleanWebpackPlugin({
          cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, '..', '.tmp')],
          cleanAfterEveryBuildPatterns: ['!images/**/*', '!fonts/**/*'],
          verbose: true,
          dry: false
        }),
        new webpack.SourceMapDevToolPlugin({
          filename: '[file].map[query]'
        }),
        new WebpackManifestPlugin({
          fileName: 'rev-manifest-js.json',
          basePath: '/static/js/',
          publicPath: '/static/js/',
        }),
        // new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.DefinePlugin({
          // 'process.env': {
          //   NODE_ENV: '"production"'
          // }
          context: {},
        }),
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery'
        })
      ],
      output: {
        // [fullhash] change any content for any file, and all files get a single new hash
        // [chunkhash] change any content, and all chunks of that files share a new hash (other files are untouched)
        // [contenthash] change content, and any changed chunk will get a new hash
        filename: '[name]-[contenthash].js',
        path: path.resolve(__dirname, './dist/fec/static/js')
      }
    },
    {
      // LEGAL ENTRIES
      //     name: 'legal',
      mode: env.production ? 'production' : 'development',
      entry: {
        legalApp: './fec/static/js/legal/LegalApp.js',
        // polyfills: './fec/static/js/polyfills.js'
      },
      output: {
        filename: '[name]-[contenthash].js',
        path: path.resolve(__dirname, './dist/fec/static/js')
      },
      plugins: [
        // new webpack.SourceMapDevToolPlugin(),
        new WebpackManifestPlugin({
          fileName: 'rev-legal-manifest-js.json',
          basePath: '/static/js/'
        }),
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery'
        })
      ],
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              // presets: ['es2015', 'react']
              presets: ['@babel/preset-env', "@babel/preset-react"]
            }
        }
        ]
      },
      //     stats: {
      //       assetsSort: 'field',
      //       modules: false,
      //       warnings: false
      //     }
      //   },
    },
    {
      // DRAFTAIL ENTRY
      // name: 'draftail',
      mode: env.production ? 'production' : 'development',
      entry: { draftail: './fec/static/js/draftail/App.js' },
      output: {
        filename: '[name]-[contenthash].js',
        path: path.resolve(__dirname, './dist/fec/static/js')
      },
      // node: {
      //   fs: 'empty',
      //   path: true
      // },
      plugins: [
        // new webpack.SourceMapDevToolPlugin(),
        new WebpackManifestPlugin({
          fileName: 'rev-draftail-manifest-js.json',
          basePath: '/static/js/'
        }),
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery'
        })
      ],
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', "@babel/preset-react"]
            }
          }
        ]
      },
      // stats: {
      //   assetsSort: 'field',
      //   modules: false,
      //   warnings: false
      // }
    }
  // ]
];

// const ManifestPlugin = require('webpack-manifest-plugin');
// // const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
// //   .BundleAnalyzerPlugin;

// const entries = {
//   polyfills: './fec/static/js/polyfills.js',
//   init: './fec/static/js/init.js',
//   'data-init': './fec/static/js/data-init.js',
//   vendor: ['jquery', 'handlebars'],
//   'calc-admin-fines-modal': './fec/static/js/modules/calc-admin-fines-modal.js', // Used inside base.html
//   'calc-admin-fines': './fec/static/js/modules/calc-admin-fines.js'
// };

// const datatablePages = [];

// fs.readdirSync('./fec/static/js/pages').forEach(function (f) {
//   if (f.search('.js') < 0) {
//     return;
//   } // Skip non-js files
//   let name = f.split('.js')[0];
//   let p = path.join('./fec/static/js/pages', f);
//   entries[name] = './' + p;

//   // Note all datatable pages for getting the common chunk
//   if (name.search('datatable-') > -1) {
//     datatablePages.push(name);
//   }
// });

// module.exports = [
//   {
//     name: 'all',
//     entry: entries,
//     plugins: [
//       // deletes old build files
//       new CleanWebpackPlugin(['./dist/fec/static/js'], {
//         verbose: true,
//         dry: false
//       }),
//       new webpack.optimize.CommonsChunkPlugin({
//         // Contains d3, leaflet, and other shared code for maps and charts
//         // Included on data landing, candidate single, committee single and election pages
//         name: 'dataviz-common',
//         filename: 'dataviz-common-[hash].js',
//         minChunks: 3,
//         chunks: ['landing', 'candidate-single', 'committee-single', 'elections']
//       }),
//       new webpack.optimize.CommonsChunkPlugin({
//         // Contains shared datatable and filter code
//         // Included on all datatable pages
//         name: 'datatable-common',
//         filename: 'datatable-common-[hash].js',
//         chunks: datatablePages
//       }),
//       new webpack.optimize.CommonsChunkPlugin({
//         // Contains jquery and handlebars
//         // Included on every page
//         name: 'vendor',
//         filename: 'vendor.js'
//       }),
//       new webpack.SourceMapDevToolPlugin(),
//       new ManifestPlugin({
//         fileName: 'rev-manifest-js.json',
//         basePath: '/static/js/'
//       }),
//       new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
//       new webpack.DefinePlugin({
//         'process.env': {
//           NODE_ENV: '"production"'
//         }
//       })
//       // Uncomment to compress and analyze the size of bundles
//       // new BundleAnalyzerPlugin()
//     ],
//     output: {
//       filename: '[name]-[hash].js',
//       path: path.resolve(__dirname, './dist/fec/static/js')
//     },
//     module: {
//       loaders: [
//         {
//           test: /\.hbs/,
//           use: ['handlebars-template-loader', 'cache-loader']
//         },
//         {
//           test: /\.js$/,
//           exclude: /node_modules/,
//           loader: 'babel-loader',
//           options: {
//             presets: ['es2015']
//           }
//         }
//       ]
//     },
//     resolve: {
//       alias: {
//         // There's a known issue with jquery.inputmask and webpack.
//         // These aliases resolve the issues
//         jquery: path.join(__dirname, '../node_modules/jquery/dist/jquery.js'),
//         'inputmask.dependencyLib': path.join(
//           __dirname,
//           '../node_modules/jquery.inputmask/dist/inputmask/inputmask.dependencyLib.js'
//         ),
//         'jquery.inputmask/dist/inputmask/inputmask.date.extensions': path.join(
//           __dirname,
//           '../node_modules/jquery.inputmask/dist/inputmask/inputmask.date.extensions.js'
//         ),
//         inputmask: path.join(
//           __dirname,
//           '../node_modules/jquery.inputmask/dist/inputmask/inputmask.js'
//         ),
//         'jquery.inputmask': path.join(
//           __dirname,
//           '../node_modules/jquery.inputmask/dist/inputmask/jquery.inputmask.js'
//         )
//       }
//     },
//     node: {
//       fs: 'empty'
//     },
//     watchOptions: {
//       ignored: /node_modules/
//     },
//     stats: {
//       assetsSort: 'field',
//       modules: false,
//       warnings: false
//     }
//   },
//   {
//     // The modules are separate because we want them in a specific place and named predictably
//     name: 'widgets',
//     entry: {
//       'aggregate-totals': './fec/static/js/widgets/aggregate-totals.js',
//       'aggregate-totals-box': './fec/static/js/widgets/aggregate-totals-box.js',
//       'contributions-by-state':
//         './fec/static/js/widgets/contributions-by-state.js',
//       'contributions-by-state-box':
//         './fec/static/js/widgets/contributions-by-state-box.js',
//       'pres-finance-map-box': './fec/static/js/widgets/pres-finance-map-box.js'
//     },
//     output: {
//       filename: 'widgets/[name].js',
//       path: path.resolve(__dirname, './dist/fec/static/js')
//     },
//     node: {
//       fs: 'empty',
//       path: true
//     },
//     plugins: [
//       new webpack.SourceMapDevToolPlugin(),
//       new ManifestPlugin({
//         fileName: 'rev-widgets-manifest-js.json',
//         basePath: '/static/js/'
//       }),
//       new webpack.ProvidePlugin({ _: 'lodash', $: 'jquery', jQuery: 'jquery' })
//     ],
//     module: {
//       rules: [
//         {
//           test: /\.js$/,
//           exclude: /node_modules/,
//           loader: 'babel-loader',
//           options: {
//             presets: ['es2015', 'react']
//           }
//         }
//       ]
//     },
//     stats: {
//       assetsSort: 'field',
//       modules: false,
//       warnings: false
//     }
//   },
//   {
//     name: 'legal',
//     entry: {
//       legalApp: './fec/static/js/legal/LegalApp.js',
//       polyfills: './fec/static/js/polyfills.js'
//     },
//     output: {
//       filename: '[name]-[hash].js',
//       path: path.resolve(__dirname, './dist/fec/static/js')
//     },
//     plugins: [
//       new webpack.SourceMapDevToolPlugin(),
//       new ManifestPlugin({
//         fileName: 'rev-legal-manifest-js.json',
//         basePath: '/static/js/'
//       })
//     ],
//     module: {
//       loaders: [
//         {
//           test: /\.js$/,
//           exclude: /node_modules/,
//           loader: 'babel-loader',
//           options: {
//             presets: ['es2015', 'react']
//           }
//         }
//       ]
//     },
//     stats: {
//       assetsSort: 'field',
//       modules: false,
//       warnings: false
//     }
//   },
//   {
//     name: 'draftail',
//     entry: { draftail: './fec/static/js/draftail/App.js' },
//     output: {
//       filename: '[name]-[hash].js',
//       path: path.resolve(__dirname, './dist/fec/static/js')
//     },
//     node: {
//       fs: 'empty',
//       path: true
//     },
//     plugins: [
//       new webpack.SourceMapDevToolPlugin(),
//       new ManifestPlugin({
//         fileName: 'rev-draftail-manifest-js.json',
//         basePath: '/static/js/'
//       })
//     ],
//     module: {
//       loaders: [
//         {
//           test: /\.js$/,
//           exclude: /node_modules/,
//           loader: 'babel-loader',
//           options: {
//             presets: ['es2015', 'react']
//           }
//         }
//       ]
//     },
//     stats: {
//       assetsSort: 'field',
//       modules: false,
//       warnings: false
//     }
//   }
// ];
