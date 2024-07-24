const istanbul = require('browserify-istanbul');

module.exports = function(config) {
  const browserify = {
    debug: true,
    transform: ['hbsfy', ['babelify', { presets: ['es2015'] }]]
  };

  let reporters = ['progress', 'coverage-istanbul'];

  if (process.argv.indexOf('--debug') === -1) {
    browserify.transform.push(
      istanbul({
        ignore: ['**/tests/**/*.js', '**/*.hbs']
      })
    );
    reporters.push('coverage');
  }

  config.set({
    files: [
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/babel-polyfill/dist/polyfill.js',
      'fec/fec/tests/js/**/*.js'
    ],

    exclude: [
      '**/hallo-edit-html.js',
      'fec/fec/static/js/init.js',
      '**/node_modules/*'
    ],

    frameworks: ['browserify', 'mocha', 'chai-sinon', 'webpack'],

    preprocessors: {
      'fec/fec/tests/js/*.js': ['webpack', 'babel'],
      'fec/fec/tests/js/draftail/**/*.js': ['webpack']
    },

    babelPreprocessor: {
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
        sourceMap: 'inline'
      }
    },

    browserify: browserify,

    coverageReporter: {
      subdir: '.',
      reporters: [
        //uncomenting to generate coverage/index.html, but this will result in Instanbul error: Cannot read property 'text' of undefined
        //{ type: 'html'},
        { type: 'text' },
        { type: 'json', file: 'coverage.json' }
      ]
    },

    webpack: {
      devtool: 'inline-source-map',
      module: {
        rules: [
          { test: /\.hbs/, use: ['handlebars-loader'] },
          {
            test: /\.(?:js|mjs|cjs)$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              // presets: ['es2015', 'react']
              presets: ['@babel/preset-env', '@babel/preset-react'],
              plugins: [
                ['@babel/plugin-syntax-import-attributes', {
                  deprecatedAssertSyntax: true
                }]
              ]
            }
          },
          // {
          //   test: /\.js$/,
          //   exclude: /node_modules/,
          //   loader: 'istanbul-instrumenter-loader',
          //   // query: {
          //   //   esModules: true
          //   // }
          // }
        ]
      },
      resolve: {
        fallback: {
          stream: require.resolve('stream-browserify')
        }
      }
    },

    reporters: reporters,

    coverageIstanbulReporter: {
      reports: ['text-summary'],
      fixWebpackSourcePaths: true
    },

    browsers: ['ChromeHeadless'],

    port: 9876,

    autoWatch: false,

    colors: true,

    logLevel: config.LOG_INFO
  });
};
