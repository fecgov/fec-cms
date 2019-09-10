'use strict';

/* global require, ga */

var $ = require('jquery');
var lookup = require('../modules/election-lookup');
var analytics = require('../modules/analytics'); // TODO - move this to Tag Manager?

$(document).ready(function() {
  new lookup.ElectionLookup('#election-lookup', false);
});

$('.js-ga-event').each(function() {
  var eventName = $(this).data('ga-event');
  $(this).on('click', function() {
    if (analytics.trackerExists()) {
      var gaEventData = {
        eventCategory: 'Misc. events',
        eventAction: eventName,
        eventValue: 1
      };
      ga('nonDAP.send', 'event', gaEventData);
    }
  });
});
