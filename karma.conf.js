/* global process */

const istanbul = require('browserify-istanbul');
const path = require('path');
const puppeteer = require('puppeteer');
process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function(config) {
  const browserify = {
    debug: true,
    transform: ['hbsfy']
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
        { type: 'html' },
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
