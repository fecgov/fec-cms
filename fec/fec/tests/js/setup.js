'use strict';

var $ = require('jquery');
var _ = require('underscore');

module.exports = function() {
  // Append jQuery to `window` for use by legacy libraries
  window.$ = window.jQuery = $;

  // Add global variables
  _.extend(window, {
    BASE_PATH: '/',
    API_LOCATION: '',
    API_VERSION: '/v1',
    API_KEY: '12345',
    DEFAULT_TIME_PERIOD: '2016'
  });
};
