import { customEvent } from '../modules/analytics.js';
// var homepageEvents = require('../modules/home-events');
import HomepageEvents from '../modules/home-events.js';
import { TopEntities } from '../modules/top-entities.js';

// accessible tabs for alt sidebar
// require('../vendor/tablist').init();
// import { init as initTabList } from '../vendor/tablist.js';
// initTabList();

$(function() {
  // Evergreen home page events and deadlines
  new HomepageEvents();

  // Init the "Who is raising and spending the most" section
  const topEntitiesHolder = document.querySelector('.js-top-entities');
  if (topEntitiesHolder !== null) {
    new TopEntities('.js-top-entities', 'receipts');

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
  }
});
