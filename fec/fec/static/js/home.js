'use strict';

var $ = require('jquery');

var upcomingEvents = require('./upcoming-events');
var Search = require('fec-style/js/search');

// accessible tabs for alt sidebar
require('./vendor/tablist').init();

/* Homepage Upcoming Events */

// - What's Happening section
new upcomingEvents.UpcomingEvents();

// - Candidate and committee support
new upcomingEvents.UpcomingDeadlines();

// Initialize search toggle
new Search($('.js-search'));
