'use strict';

var $ = require('jquery');
var FilterPanel = require('../modules/filters/filter-panel').FilterPanel;
var filterTags = require('../modules/filters/filter-tags');
var Calendar = require('../modules/calendar').Calendar;
var calendarHelpers = require('../modules/calendar-helpers');

// Initialize filters
var filterPanel = new FilterPanel();

// Initialize filter tags
var $tagList = new filterTags.TagList({
  resultType: 'events',
  emptyText: 'all events',
}).$body;

$('.js-filter-tags').prepend($tagList);

// Initialize calendar
new Calendar({
  selector: '#calendar',
  download: '#calendar-download',
  subscribe: '#calendar-subscribe',
  url: calendarHelpers.getUrl(['calendar-dates']),
  exportUrl: calendarHelpers.getUrl(['calendar-dates', 'export']),
  filterPanel: filterPanel,
});
