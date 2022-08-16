'use strict';

var $ = require('jquery');
var lookup = require('../modules/election-search');

$(document).ready(function() {
  // If #election-lookup doesn't also have the na-map class, init it
  if (document.querySelector('#election-lookup:not(.na-map)'))
    new lookup.ElectionSearch('#election-lookup', true);
});
