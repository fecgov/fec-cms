'use strict';

var upcomingEvents = require('./upcoming-events');

// accessible tabs for alt sidebar
require('./vendor/tablist').init();

/* Homepage Upcoming Events */

// - What's Happening section
new upcomingEvents.UpcomingEvents();
