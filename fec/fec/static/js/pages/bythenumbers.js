'use strict';

var $ = require('jquery');
var analytics = require('../modules/analytics');
var TopEntities = require('../modules/top-entities').TopEntities;

new TopEntities('.js-top-entities', context.type);

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
