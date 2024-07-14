const fs = require('fs');
const path = require('path');
// const fileURLToPath = require('url');

const webpack = require('webpack');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

const js = './fec/static/js';
// This is the shared seed object for the manifest plugin but multiple entries is unreliable,
// So we'll push all entries here, and have this returned for every entry
let sharedManifestObject = {};

const sharedManifestPlugin = new WebpackManifestPlugin({
  fileName: 'rev-manifest-js.json',
  basePath: '/static/js/',
  publicPath: '/static/js/',
  seed: sharedManifestObject,
  generate: (seed, files, entries) => {
    for (let entry in entries) {
      // We need to put the /static/js/ path in front of each of the file names
      const entryChunks = entries[entry];
      for(let i = 0; i < entryChunks.length; i++) {
        entryChunks[i] = `/static/js/${entryChunks[i]}`;
      }
      sharedManifestObject[`/static/js/${entry}.js`] = entryChunks.length === 1 ? entryChunks[0] : entryChunks;
    }
    return sharedManifestObject;
  }
});

/**
 * Queue up the files for the entries for the homepage and the data pages
 */
const homeAndDataEntries = {
  global: `${js}/global.js`,
  home: {
    import: `${js}/pages/home.js`,
    dependOn: 'global'
  },
  init: {
    import: `${js}/init.js`,
    dependOn: 'global'
  },
  'data-init': {
    import: `${js}/data-init.js`,
    dependOn: 'global'
    // NOTE: because data-init depends on global, any entry that depends on data-init will also inherit global
  },
  'calc-admin-fines-modal': `${js}/modules/calc-admin-fines-modal.js`, // Used inside base.html
  'calc-admin-fines': `${js}/modules/calc-admin-fines.js`,
  'widgets/aggregate-totals-box': {
    import: `${js}/widgets/aggregate-totals-box.js`,
    filename: 'widgets/aggregate-totals-box.js',
    dependOn: 'bythenumbers'
    // publicPath: '/widgets/aggregate-totals-box.js`
  },
  // 'aggregate-totals': {
  //   import: `${js}/widgets/aggregate-totals.js`,
  //   // filename: 'widgets/aggregate-totals.js',
  //   // dependOn: 'aggregate-totals-box'
  // },
  // 'contributions-by-state': {
  //   import: `${js}/widgets/contributions-by-state.js`,
  //   dependOn: 'bythenumbers'
  // },
  'widgets/contributions-by-state-box': {
    import: `${js}/widgets/contributions-by-state-box.js`,
    filename: 'widgets/contributions-by-state-box.js',
    dependOn: 'bythenumbers'
    // publicPath: '/widgets/contributions-by-state-box.js`
  },
  'widgets/pres-finance-map-box': {
    import: `${js}/widgets/pres-finance-map-box.js`,
    filename: 'widgets/pres-finance-map-box.js',
    dependOn: 'data-init'
    // publicPath: '/widgets/contributions-by-state-box.js`
  },
  analytics: {
    import: `${js}/modules/analytics.js`,
    dependOn: 'global'
  }
};

/**
 * These are the pages/entries that depend on the data-init entry (which relies on global)
 */
const pagesThatDependOnInit = ['contact-form'];

/**
 * These are the pages/entries that depend on the data-init entry (which relies on global)
 */
const pagesThatDependOnDataInit = [
  'bythenumbers', 'candidate-single', 'committee-single', 'data-landing',
  'data-browse-data', 'data-map', 'election-lookup', 'elections'];

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
  const p = path.join(`${js}/pages`, f);
  // If the file name isn't already queued as an entry,
  if (!homeAndDataEntries[name]) {

    // If it's a datatable page, or a data page that requires data-init,
    if (name.indexOf('datatable-') >= 0 || pagesThatDependOnDataInit.includes(name)) {
      // add it so it depends on data-init (and inherits global)
      homeAndDataEntries[name] = {
        import: `./${p}`,
        dependOn: 'data-init'
      }
    // If it's a page that requires init,
    } else if (name.indexOf('datatable-') >= 0 || pagesThatDependOnInit.includes(name)) {
      // add it so it depends on init (and inherits global)
      homeAndDataEntries[name] = {
        import: `./${p}`,
        dependOn: 'init'
      }
    } else {
      // else add it so it depends on global
      homeAndDataEntries[name] = {
        import: `./${p}`,
        dependOn: 'global'
      }
    }
  }
  // // Note all datatable pages for getting the common chunk
// // if (['bythenumbers', 'dataviz-common', 'election-lookup'].includes(name))
  // if it's a datatable page, queue it into datatablePages
  if (name.search('datatable-') > -1) {
    datatablePages.push(`./fec/static/js/pages/${name}`);
  }
});

/**
 * Which source map type should devtool use?
 */
// const sourceMapType = 'source-map'; // separate files
const sourceMapType = 'eval-source-map';
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
      // chunkIds: 'named',
      removeAvailableModules: true, // TESTING
      splitChunks: {
        chunks: 'all',
        minChunks: 2,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/](jquery)[\\/]/,
            name: 'vendors',
            enforce: true,
            priority: 100,
            chunks: 'all'
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
        typeahead: path.join(__dirname, '../node_modules/corejs-typeahead/dist/bloodhound.min.js'),
        // These were 18F but have been archived so we've moved them to our own */modules/*
        // 'aria-accordion': path.join(__dirname, 'fec/static/js/modules/aria-accordion/src/accordion.js'),
        // 'component-sticky': path.join(__dirname, 'fec/static/js/modules/component-sticky/index.js'),
        // 'glossary-panel': path.join(__dirname, 'fec/static/js/modules/glossary-panel/src/glossary.js'),
        // jQuery aliases
        jquery: require.resolve(path.join(__dirname, '../node_modules/jquery/dist/jquery.js'))
        // inputmask: path.join(__dirname, '../node_modules/inputmask/dist/inputmask.es6.js'),
        // 'inputmask.date.extensions': path.join(__dirname, '../node_modules/inputmask/lib/extensions/inputmask.date.extensions.js'),
        // 'inputmask.dependencyLib': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.dependencyLib.js'),
        // inputmask: path.join(__dirname, '../node_modules/inputmask/dist/jquery.inputmask.js'),
        // 'inputmask.date.extensions': path.join(__dirname, '../node_modules/jquery.inputmask/dist/inputmask/inputmask.date.extensions.js'),
        // underscore: path.join(__dirname, '../node_modules/underscore/underscore-esm.js')
        // underscore: path.join(__dirname, '../node_modules/underscore/')
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        context: {}
      }),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
        // underscore: 'underscore'
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
    }
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
      // clean: mode === 'production' ? true : undefined,
      filename: '[name]-[contenthash].js',
      path: path.resolve(__dirname, './dist/fec/static/js')
    },
    devtool: mode === 'production' ? undefined : sourceMapType,
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      }),
      sharedManifestPlugin
      // new WebpackManifestPlugin({
      //   fileName: 'rev-draftail-manifest-js.json',
      //   basePath: '/static/js/'
      // })
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
    }
    // stats: {
    //   assetsSort: 'field',
    //   modules: false,
    //   warnings: false
    // }
  }
];
