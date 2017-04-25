'use strict';

var $ = require('jquery')
var FilterPanel = require('fec-style/js/filter-panel').FilterPanel;
var filterTags = require('fec-style/js/filter-tags');
var Calendar = require('./calendar').Calendar;
var calendarHelpers = require('./calendar-helpers');

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
