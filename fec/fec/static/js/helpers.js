'use strict';

/* global require, module */
var _ = require('underscore');
var bleach = require('bleach');
var moment = require('moment');
var Handlebars = require('hbsfy/runtime');

var BREAKPOINTS = {
  MEDIUM: 640,
  LARGE: 860
};

var LOADING_DELAY = 1500;
var SUCCESS_DELAY = 5000;

var formatMap = {
  default: 'MM/DD/YYYY',
  pretty: 'MMMM D, YYYY',
  time: 'h:mma',
  dateTime: 'MMMM D, h:mma',
  dayOfWeek: 'ddd',
  fullDayOfWeek: 'dddd'
};

function getWindowWidth() {
  // window.innerWidth accounts for scrollbars and should match the width used
  // for media queries.
  return window.innerWidth;
}

function isLargeScreen() {
  if (window.innerWidth >= BREAKPOINTS.LARGE) {
    return true;
  } else {
    return false;
  }
}

function isMediumScreen() {
  if (window.innerWidth >= BREAKPOINTS.MEDIUM) {
    return true;
  } else {
    return false;
  }
}

function datetime(value, options) {
  var hash = options.hash || {};
  var format = formatMap[hash.format || 'default'];
  var parsed = moment(value, 'YYYY-MM-DDTHH:mm:ss');
  return parsed.isValid() ? parsed.format(format) : null;
}

// Sanitizes a single value by removing HTML tags and whitelisting valid
// characters.
function sanitizeValue(value) {
  var validCharactersRegEx = /[^a-z0-9-',.()\s]/ig;

  if (value !== null && value !== undefined) {
    if (_.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        if (value[i] !== null && value[i] !== undefined) {
          value[i] = bleach.sanitize(value[i]).replace(
            validCharactersRegEx,
            ''
          );
        }
      }
    } else {
      value = bleach.sanitize(value).replace(validCharactersRegEx, '');
    }
  }

  return value;
}

// Sanitizes all parameters retrieved from the query string in the URL.
function sanitizeQueryParams(query) {
  var param;

  for (param in query) {
    if (query.hasOwnProperty(param)) {
      query[param] = sanitizeValue(query[param]);
    }
  }

  return query;
}

Handlebars.registerHelper('datetime', datetime);

Handlebars.registerHelper({
  eq: function (v1, v2) {
    return v1 === v2;
  },
  toUpperCase: function(value) {
    return value.substr(0,1).toUpperCase() + value.substr(1);
  }
});

module.exports = {
  datetime: datetime,
  BREAKPOINTS: BREAKPOINTS,
  isMediumScreen: isMediumScreen,
  isLargeScreen: isLargeScreen,
  getWindowWidth: getWindowWidth,
  helpers: Handlebars.helpers,
  LOADING_DELAY: LOADING_DELAY,
  SUCCESS_DELAY: SUCCESS_DELAY,
  sanitizeValue: sanitizeValue,
  sanitizeQueryParams: sanitizeQueryParams
};
