import { customEvent } from '../modules/analytics.js';
import { TopEntities } from '../modules/top-entities.js';

new TopEntities('.js-top-entities', window.context.type);

$('.js-ga-event').each(function() {
  var eventName = $(this).data('ga-event');
  $(this).on('click', function() {
    customEvent({
      event: 'Widget Interaction',
      eventName: 'fecCustomEvent',
      eventCategory: 'Misc. events',
      eventAction: eventName,
      eventValue: 1
    });
  });
});
