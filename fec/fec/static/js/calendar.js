'use strict';

var $ = require('jquery');
var URI = require('urijs');
var dropdown = require('fec-style/js/dropdowns');

require('fullcalendar');

var templates = {
  download: require('../hbs/calendar/download.hbs'),
  subscribe: require('../hbs/calendar/subscribe.hbs')
};

function Calendar(opts) {
  this.opts = $.extend({}, Calendar.defaultOpts, opts);

  this.$calendar = $(this.opts.selector).fullCalendar(this.opts.calendarOpts);
  this.url = URI(this.opts.url);
  this.exportUrl = URI(this.opts.exportUrl);
  this.sources = null;

  this.$download = $(opts.download);
  this.$subscribe = $(opts.subscribe);

  this.filter();
  this.styleButtons();
}

Calendar.defaultOpts = {
  calendarOpts: {},
  sourceOpts: {}
};

Calendar.prototype.filter = function(params) {
  var url = this.url.clone().addQuery(params || {}).toString();
  this.$calendar.fullCalendar('removeEventSource', this.sources);
  this.sources = $.extend({}, this.opts.sourceOpts, {url: url});
  this.$calendar.fullCalendar('addEventSource', this.sources);
  this.updateLinks(params);
};

Calendar.prototype.updateLinks = function(params) {
  var url = this.exportUrl.clone().addQuery(params || {});
  var urls = {
    ics: url.toString(),
    csv: url.query({renderer: 'csv'}).toString(),
    google: 'https://calendar.google.com/calendar/render?cid=' + url.toString(),
    calendar: url.protocol('webcal').toString()
  };
  this.$download.html(templates.download(urls));
  this.$subscribe.html(templates.subscribe(urls));

  new dropdown.Dropdown(this.$download, {checkboxes: false});
  new dropdown.Dropdown(this.$subscribe, {checkboxes: false});
};

Calendar.prototype.styleButtons = function() {
  var baseClasses = 'button button--neutral';
  this.$calendar.find('.fc-button').addClass(baseClasses);
  this.$calendar.find('.fc-next-button').addClass('button--next');
  this.$calendar.find('.fc-prev-button').addClass('button--previous');
  this.$calendar.find('.fc-right .fc-button-group').addClass('toggles--buttons');
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

function getUrl(path, params) {
  return URI(window.API_LOCATION)
    .path([window.API_VERSION].concat(path || []).join('/'))
    .addQuery({api_key: window.API_KEY})
    .addQuery(params || {})
    .toString();
}

module.exports = {
  Calendar: Calendar,
  fecSources: fecSources,
  getUrl: getUrl
};
