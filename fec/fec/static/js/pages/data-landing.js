'use strict';

var $ = require('jquery');
var lookup = require('../modules/election-lookup');
var analytics = require('../modules/analytics');

$(document).ready(function() {
  // If #election-lookup doesn't also have the na-map class, init it
  if (document.querySelector('#election-lookup:not(.na-map)'))
    new lookup.ElectionLookup('#election-lookup', false);
});

$('.js-ga-event').each(function() {
  var eventName = $(this).data('ga-event');
  $(this).on('click', function() {
    analytics.customEvent({
      eventName: 'fecCustomEvent',
      eventCategory: 'Misc. events',
      eventAction: eventName,
      eventValue: 1
    });
  });
});
