/* global process */

const istanbul = require('browserify-istanbul');
process.env.CHROME_BIN = require('puppeteer').executablePath();

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
    frameworks: ['browserify', 'mocha', 'chai-sinon'],

    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'fec/fec/tests/js/**/*.js'
    ],

    exclude: ['**/hallo-edit-html.js', 'fec/fec/static/js/init.js'],

    preprocessors: {
      'fec/fec/tests/js/*.js': ['browserify'],
      'fec/fec/tests/js/draftail/**/*.js': ['webpack']
    },

    browserify: browserify,

    coverageReporter: {
      subdir: '.',
      reporters: [
        //comenting out html since it causes errors on coverage reporting currently and we do not really use it
        //{ type: 'html'},
        { type: 'text' },
        { type: 'json', file: 'coverage.json' }
      ]
    },

    webpack: {
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              presets: ['latest', 'react']
            }
          },
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'istanbul-instrumenter-loader',
            query: {
              esModules: true
            }
          }
        ]
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
