const fs = require('fs');
const path = require('path');
// const fileURLToPath = require('url');

const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

const js = './fec/static/js';
const sharedManifestSeed = {};
const sharedManifestPlugin = new WebpackManifestPlugin({
  fileName: 'rev-manifest-js.json',
  basePath: '/static/js/',
  publicPath: '/static/js/',
  seed: sharedManifestSeed,
  generate: (seed, files, entries) => {
    let toReturn = {};
    for (let entry in entries) {
      toReturn[`/static/js/${entry}.js`] = entries[entry].length === 1 ? entries[entry][0] : entries[entry];
    }
    return toReturn;
  }
});

/**
 * Queue up the files for the entries for the homepage and the data pages
 */
const homeAndDataEntries = {
  global: `${js}/global.js`,
  home: {
    dependOn: 'global',
    import: `${js}/pages/home.js`
  'candidate-single': `${js}/pages/candidate-single.js`,
  'committee-single': `${js}/pages/committee-single.js`,
  },
  init: './fec/static/js/init.js',
  'data-init': './fec/static/js/data-init.js',
  'calc-admin-fines-modal': './fec/static/js/modules/calc-admin-fines-modal.js', // Used inside base.html
  'calc-admin-fines': './fec/static/js/modules/calc-admin-fines.js',
  'data-elections': './fec/static/js/pages/elections.js',
  'data-landing': './fec/static/js/pages/data-landing.js',
  // 'aggregate-totals': './fec/static/js/widgets/aggregate-totals.js',
  'aggregate-totals-box': {
    import: './fec/static/js/widgets/aggregate-totals-box.js',
    filename: 'widgets/aggregate-totals-box.js',
    // publicPath: '/widgets/aggregate-totals-box.js'
  },
  // 'contributions-by-state':
    // './fec/static/js/widgets/contributions-by-state.js',
  'contributions-by-state-box': {
    filename: 'widgets/contributions-by-state-box.js',
    // publicPath: '/widgets/contributions-by-state-box.js'
    import: `${js}/widgets/contributions-by-state-box.js`,
  },
  'pres-finance-map-box': {
    filename: 'widgets/pres-finance-map-box.js',
    // publicPath: '/widgets/contributions-by-state-box.js'
    import: `${js}/widgets/pres-finance-map-box.js`,
  },
};

/**
 * Start the list of datatable pages
 */
const datatablePages = [];

/**
 * For every .js file in fec/static/js/pages,
 */
fs.readdirSync(`${js}/pages`).forEach(function(f) {
  // Skip non-js files
  if (f.search('.js') < 0) {
    return;
  }
  // Grab the name (the filename before the first .)
  const name = f.split('.js')[0];
  // Set the path to be fec/static/js/pages/ plus its filename
  // If the file name isn't 'home', create an entry for this filename and point it to this file
  if (name != 'home')
    homeAndDataEntries[name] = './' + p;
  const p = path.join(`${js}/pages`, f);
  // // Note all datatable pages for getting the common chunk
// // if (['bythenumbers', 'dataviz-common', 'election-lookup'].includes(name))
  // if it's a datatable page, queue it into datatablePages
  if (name.search('datatable-') > -1) {
    datatablePages.push(`./fec/static/js/pages/${name}`);
  }
});

// Create a single datatable-common entry for all of the datatablePages queued
// TODO: is this still necessary
// TODO: i.e. do we still need a -common file if the individual datatable pages have their own file
// TODO: and share webpack chunks?
homeAndDataEntries['datatable-common'] = datatablePages;

/**
 * Which source map type should devtool use?
 */
const sourceMapType = 'source-map'; // separate files
// const sourceMapType = 'eval-source-map';
const mode = process.argv[process.argv.indexOf('--mode') + 1] || 'development';

module.exports = [
  {
    // Data and Home
    name: 'data_and_home',
    entry: homeAndDataEntries,
    devtool: mode == 'production' ? undefined : sourceMapType,
    optimization: {
      emitOnErrors: true,
      innerGraph: true,
      moduleIds: 'named',
      removeAvailableModules: true, // TESTING
      splitChunks: {
        chunks: 'all',
        minChunks: 2,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/](jquery)[\\/]/,
            name: 'vendors',
            enforce: true,
            priority: 100
          }
        }
      }
    },
    module: {
      rules: [
        { test: /\.hbs/, use: ['handlebars-loader'] }
      ]
    },
    resolve: {
      extensions: ['.js'],
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
    plugins: [
      new webpack.DefinePlugin({
        context: {}
      }),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      }),
      sharedManifestPlugin
    ],
    output: {
      // clean: // Only run clean on the last module.exports
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
      'legal-app': `${js}/legal/LegalApp.cjs`
    },
    output: {
      // clean: // Only run clean on the last module.exports
      filename: '[name]-[contenthash].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    devtool: mode == 'production' ? undefined : sourceMapType,
    plugins: [
      new webpack.DefinePlugin({
        context: {}
      }),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      }),
      sharedManifestPlugin
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
    entry: { draftail: `${js}/draftail/App.js` },
    output: {
      clean: true,
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
