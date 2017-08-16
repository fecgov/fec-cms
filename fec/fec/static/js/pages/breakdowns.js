'use strict';

/* global context, ga */

var $ = require('jquery');
var analytics = require('fec-style/js/analytics');
var TopEntities = require('../modules/top-entities').TopEntities;

new TopEntities('.js-top-entities', context.type);

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
