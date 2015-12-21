'use strict';

var $ = require('jquery');
var URI = require('urijs');

require('fullcalendar');

function Calendar(opts) {
  this.opts = $.extend({}, Calendar.defaultOpts, opts);

  this.calendar = $(this.opts.selector).fullCalendar(this.opts.calendarOpts);
  this.url = URI(this.opts.url);
  this.sources = null;

  this.filter();
}

Calendar.defaultOpts = {
  calendarOpts: {},
  sourceOpts: {}
};

Calendar.prototype.filter = function(params) {
  this.calendar.fullCalendar('removeEventSource', this.sources);
  var url = this.url.clone().addQuery(params || {}).toString();
  this.sources = $.extend({}, this.opts.sourceOpts, {url: url});
  this.calendar.fullCalendar('addEventSource', this.sources);
};

var colorMap = {
  election: 'blue',
  report: 'red'
};
var colorDefault = 'orange';

function formatColor(event) {
  var category = event.category ? event.category.split('-')[0] : null;
  return colorMap[category] || colorDefault;
}

function success(response) {
  return response.results.map(function(event) {
    return {
      title: event.summary,
      start: event.start_date,
      end: event.end_date,
      allDay: event.end_date !== null,
      color: formatColor(event)
    };
  });
}

var fecSources = {
  startParam: 'min_start_date_time',
  endParam: 'max_start_date_time',
  success: success
};

module.exports = {
  Calendar: Calendar,
  fecSources: fecSources
};
