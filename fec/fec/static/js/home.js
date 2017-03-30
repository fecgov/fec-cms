'use strict';

var $ = require('jquery');

var upcomingEvents = require('./upcoming-events');
var Search = require('fec-style/js/search');

// Homepage - What's Happening section
new upcomingEvents.UpcomingEvents();

// Initialize search toggle
new Search($('.js-search'));
