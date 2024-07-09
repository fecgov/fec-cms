const fs = require('fs');
const path = require('path');
// const fileURLToPath = require('url');

const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

let entries = {
  polyfills: './fec/static/js/polyfills.js',
  global: './fec/static/js/global.js',
  home: {
    import: './fec/static/js/pages/home.js',
    dependOn: 'global',
    filename: 'YAY/home-filename.js',
    runtime: 'my-home-runtime'
  },
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

entries['datatable-common'] = datatablePages;

const sourceMapType = 'source-map'; // separate files
// const sourceMapType = 'eval-source-map';
const mode = process.argv[process.argv.indexOf('--mode') + 1] || 'development';

module.exports = [
  {
    // Data and Home
    name: 'data_and_home',
    entry: entries,
    externals: {
      jquery: 'jQuery'
    },
    devtool: mode == 'production' ? undefined : sourceMapType,
    optimization: {
      runtimeChunk: true,
      // chunkIds: 'named',
      emitOnErrors: true,
      innerGraph: true,
      moduleIds: 'deterministic',
      // concatenateModules: true, // REMOVE AFTER OPTIMIZATION? IF true, WE WANT THE DEFAULT
      // flagIncludedChunks: true, // REMOVE AFTER OPTIMIZATION? IF true, WE WANT THE DEFAULT
      removeAvailableModules: true, // TESTING
      splitChunks: {
        chunks: 'all',
        minChunks: 2,
        // minSize: 200000,`
        // maxSize: 1000000,
        // maxAsyncSize: 1,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/](jquery|handlebars)[\\/]/,
            name: 'vendors',
            enforce: true,
            priority: 100
          },
        //   defaultVendors: {
        //     test: /[\\/]node_modules[\\/]/,
        //     priority: -10,
        //     reuseExistingChunk: true,
        //   },
        //   default: {
        //     minChunks: 2,
        //     priority: -20,
        //     reuseExistingChunk: true,
        //   }
        }
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
        underscore: path.join(__dirname, '../node_modules/underscore/underscore-umd.js')
      }
    },
    // // webpackChunkName: 'human-friendly'
    plugins: [
      new WebpackManifestPlugin({
        fileName: 'rev-manifest-js.json',
        basePath: '/static/js/',
        publicPath: '/static/js/'
      }),
      new webpack.DefinePlugin({
        context: {}
      }),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      }),
      // new BundleAnalyzerPlugin() // This will open an instance of BundleAnalyzerPlugin in a browser window
    ],
    output: {
      // Clean applies to localhost and repeat builds.
      // Don't touch 'legal' or 'draftail' files while bundling these entries
      clean: {
        keep: /(legal)|(draftail)/
      },
      // [fullhash] change any content for any file, and all files get a single new hash
      // [chunkhash] change any content, and all chunks of that file shares a new hash (other files are untouched)
      // [contenthash] change content, and any changed chunk will get a new hash
      filename: '[name]-[contenthash].js',
      path: path.resolve(__dirname, './dist/fec/static/js'),
      chunkLoading: 'jsonp'
    }
  },
  {
    // LEGAL ENTRIES
    name: 'legal',
    entry: {
      'legal-app': './fec/static/js/legal/LegalApp.cjs'
    },
    output: {
      // Clean applies to localhost and repeat builds.
      // Don't clean any file whose name doesn't contain 'legal' (while bundling this entry)
      clean: {
        keep(asset) {
          return asset.indexOf('legal') < 0;
        }
      },
      filename: '[name]-[contenthash].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    devtool: mode == 'production' ? undefined : sourceMapType,
    plugins: [
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
    name: 'draftail',
    entry: { draftail: './fec/static/js/draftail/App.js' },
    output: {
      // Clean applies to localhost and repeat builds.
      // Don't clean any file whose name doesn't contain 'draftail' (while bundling this entry)
      clean: {
        keep(asset) {
          return !asset.indexOf('draftail') < 0;
        }
      },
      filename: '[name]-[contenthash].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    devtool: mode == 'production' ? undefined : sourceMapType,
    plugins: [
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
];
