'use strict';

/* global ga */

var _ = require('underscore');
var URI = require('urijs');

var helpers = require('./helpers');

function trackerExists() {
  if (typeof ga !== 'undefined') {
    return true;
  }
}

/* Initialize a non Digital Analytics Program GA tracker
 * This tracker's name is "nonDAP", so all commands will need to be prefixed
*/
function init() {
  if (!trackerExists()) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
  }

  ga('create', 'UA-48605964-22', 'auto', 'notDAP');
  ga('notDAP.set', 'forceSSL', true);
  ga('notDAP.set', 'anonymizeIp', true);
}

function pageView() {
  if (typeof ga === 'undefined') { return; }
  var path = document.location.pathname;
  if (document.location.search) {
    var query = helpers.sanitizeQueryParams(URI.parseQuery(document.location.search));
    path += '?' + sortQuery(query);
  }
  ga('notDAP.send', 'pageview', path);
}

function sortQuery(query) {
  return _.chain(query)
    .pairs()
    .map(function(pair) {
      return [pair[0], _.isArray(pair[1]) ? pair[1] : [pair[1]]];
    })
    .reduce(function(memo, pair) {
      return memo.concat(_.map(pair[1], function(value) {
        return [pair[0], value];
      }));
    }, [])
    .sort()
    .map(function(pair) {
      return pair.join('=');
    })
    .join('&')
    .value();
}

module.exports = {
  init: init,
  pageView: pageView,
  sortQuery: sortQuery,
  trackerExists: trackerExists
};
