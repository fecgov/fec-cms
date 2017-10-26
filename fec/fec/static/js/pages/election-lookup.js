'use strict';

/* global require, document */

var $ = require('jquery');
var lookup = require('../modules/election-search');

$(document).ready(function() {
  new lookup.ElectionSearch('#election-lookup', true);
});
