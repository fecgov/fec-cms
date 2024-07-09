const fs = require('fs');
const path = require('path');
const fileURLToPath = require('url');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

let entries = {
  polyfills: './fec/static/js/polyfills.js',
  vendors: ['handlebars', 'jquery'],
  global: './fec/static/js/global.js',
  home: './fec/static/js/pages/home.js',
  init: './fec/static/js/init.js',
  'data-init': './fec/static/js/data-init.js',
  'calc-admin-fines-modal': './fec/static/js/modules/calc-admin-fines-modal.js', // Used inside base.html
  'calc-admin-fines': './fec/static/js/modules/calc-admin-fines.js',
  'data-elections': './fec/static/js/pages/elections.js',
  'data-landing': './fec/static/js/pages/data-landing.js',
  'candidate-single': './fec/static/js/pages/candidate-single.js',
  'committee-single': './fec/static/js/pages/committee-single.js',
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
  const name = f.split('.js')[0];
  const p = path.join('./fec/static/js/pages', f);
  entries[name] = './' + p;
//   // Note all datatable pages for getting the common chunk
// if (['bythenumbers', 'dataviz-common', 'election-lookup'].includes(name))
  if (name.search('datatable-') > -1) {
    datatablePages.push(`./fec/static/js/pages/${name}`);
  }
});

// entries['datatable-common'] = datatablePages;

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
          // bloodhound: path.join(__dirname, '../node_modules/corejs-typeahead/dist/typeahead.jquery.min.js'),
          // typeahead: path.join(__dirname, '../node_modules/corejs-typeahead/dist/bloodhound.min.js'),
          // These were 18F but have been archived so we've moved them to our own */modules/*
          // 'aria-accordion': path.join(__dirname, 'fec/static/js/modules/aria-accordion/src/accordion.js'),
          // 'component-sticky': path.join(__dirname, 'fec/static/js/modules/component-sticky/index.js'),
          // 'glossary-panel': path.join(__dirname, 'fec/static/js/modules/glossary-panel/src/glossary.js'),
          // jQuery aliases
          jquery: require.resolve(path.join(__dirname, '../node_modules/jquery/dist/jquery.js')),
          // inputmask: path.join(__dirname, '../node_modules/inputmask/dist/inputmask.es6.js'),
          // 'inputmask.date.extensions': path.join(__dirname, '../node_modules/inputmask/lib/extensions/inputmask.date.extensions.js'),
          // 'inputmask.dependencyLib': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.dependencyLib.js'),
          // inputmask: path.join(__dirname, '../node_modules/inputmask/dist/jquery.inputmask.js'),
          // 'inputmask.date.extensions': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.date.extensions.js'),
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
          publicPath: '/static/js/'
        }),
        // new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.DefinePlugin({
          context: {}
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
        'legal-app': './fec/static/js/legal/LegalApp.cjs',
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
          basePath: '/static/js/',
          publicPath: '/static/js/'
        }),
        new webpack.DefinePlugin({
          context: {}
        }),
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery'
        })
      ],
      module: {
        rules: [
          {
            test: /\.(cjs|js)$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              // presets: ['es2015', 'react']
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
        }
        ]
      },
      // resolve: {
      //   extensions: ['*', '.js', 'jsx']
      // }
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
              presets: ['@babel/preset-env', '@babel/preset-react']
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
