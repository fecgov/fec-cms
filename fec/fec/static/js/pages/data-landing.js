import { customEvent } from '../modules/analytics.js';
import ElectionLookup from '../modules/election-lookup.js';

$(function() {
  if (!window.electionLookup) window.electionLookup = new ElectionLookup('#election-lookup', false);
});

$('.js-ga-event').each(function() {
  var eventName = $(this).data('ga-event');
  $(this).on('click', function() {
    customEvent({
      eventName: 'fecCustomEvent',
      eventCategory: 'Misc. events',
      eventAction: eventName,
      eventValue: 1
    });
  });
});
