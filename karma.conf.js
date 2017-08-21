/* global process */

var istanbul = require('browserify-istanbul');

module.exports = function(config) {
  var browserify = {
    debug: true,
    transform: ['hbsfy']
  };

  var reporters = ['progress'];

  if (process.argv.indexOf('--debug') === -1) {
    browserify.transform.push(
      istanbul({
        ignore: [
          '**/tests/**/*.js',
          '**/*.hbs'
        ]
      })
    );
    reporters.push('coverage');
  }

  config.set({
    frameworks: ['browserify', 'phantomjs-shim', 'mocha', 'chai-sinon'],

    files: [
      'fec/fec/tests/js/**/*.js',
    ],

    exclude: [
      '**/hallo-edit-html.js',
      'fec/fec/static/js/init.js'
    ],

    preprocessors: {
      'fec/fec/tests/js/**/*.js': ['browserify'],
    },

    browserify: browserify,

    coverageReporter: {
      subdir: '.',
      reporters: [
        {type: 'html'},
        {type: 'text'},
        {type: 'json', file: 'coverage.json'}
      ]
    },

    reporters: reporters,
    browsers: ['Chrome'],
    port: 9876
  });
};
