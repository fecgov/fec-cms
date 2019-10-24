'use strict';

var $ = require('jquery');
var analytics = require('../modules/analytics'); // TODO - move this to Tag Manager?
var TopEntities = require('../modules/top-entities').TopEntities;
var ReactionBox = require('../modules/reaction-box').ReactionBox;

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

window.reactionBoxes = {};

window.submitReactionWccf = function(token) {
  window.reactionBoxes['contributions-by-state'].handleSubmit(token);
};

$(document).ready(function() {
  window.reactionBoxes['contributions-by-state'] = new ReactionBox(
    '[data-name="contributions-by-state"][data-location="raising-by-the-numbers"]'
  );
});
