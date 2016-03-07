'use strict';

var $ = require('jquery');
var URI = require('urijs');
var _ = require('underscore');
var moment = require('moment');
require('fullcalendar');

var urls = require('fec-style/js/urls');
var dropdown = require('fec-style/js/dropdowns');
var Handlebars = require('hbsfy/runtime');
var helpers = require('fec-style/js/helpers');

var calendarTooltip = require('./calendar-tooltip');
var calendarHelpers = require('./calendar-helpers');
require('./calendar-list-view');

Handlebars.registerHelper(helpers.helpers);

var templates = {
  details: require('../hbs/calendar/details.hbs'),
  download: require('../hbs/calendar/download.hbs'),
  subscribe: require('../hbs/calendar/subscribe.hbs'),
  listToggles: require('../hbs/calendar/listToggles.hbs'),
  viewToggles: require('../hbs/calendar/viewToggles.hbs')
};

var LIST_VIEWS = ['quarterTime', 'quarterCategory', 'monthTime', 'monthCategory'];
var MONTH_VIEWS = ['month', 'monthTime', 'monthCategory'];

var FC = $.fullCalendar;
var Grid = FC.Grid;

// Globally override event sorting to order all-day events last
// TODO: Convince fullcalendar.io support this behavior without monkey-patching
Grid.prototype.compareEventSegs = function(seg1, seg2) {
  return seg1.event.allDay - seg2.event.allDay || // put all-day events last (booleans cast to 0/1)
    seg1.eventStartMS - seg2.eventStartMS || // tie? earlier events go first
    seg2.eventDurationMS - seg1.eventDurationMS || // tie? longer events go first
    FC.compareByFieldSpecs(seg1.event, seg2.event, this.view.eventOrderSpecs);
};

function Calendar(opts) {
  this.opts = $.extend({}, this.defaultOpts(), opts);

  this.$calendar = $(this.opts.selector);
  this.$calendar.fullCalendar(this.opts.calendarOpts);
  this.url = URI(this.opts.url);
  this.exportUrl = URI(this.opts.exportUrl);
  this.filterPanel = this.opts.filterPanel;
  this.filterSet = this.filterPanel.filterSet;

  this.popoverId = 'calendar-popover';
  this.detailsId = 'calendar-details';

  this.sources = null;
  this.params = null;

  this.$download = $(opts.download);
  this.$subscribe = $(opts.subscribe);

  this.$calendar.on('calendar:rendered', this.filterPanel.setHeight());
  this.$calendar.on('click', '.js-toggle-view', this.toggleListView.bind(this));

  this.$calendar.on('keypress', '.fc-event, .fc-more, .fc-close', this.simulateClick.bind(this));
  this.$calendar.on('click', '.fc-more', this.managePopoverControl.bind(this));

  this.filterPanel.$form.on('change', this.filter.bind(this));
  $(window).on('popstate', this.filter.bind(this));

  urls.updateQuery(this.filterSet.serialize(), this.filterSet.fields);

  this.filter();
  this.styleButtons();
  this.filterPanel.setHeight();
}

Calendar.prototype.toggleListView = function(e) {
  var newView = $(e.target).data('trigger-view');
  this.$calendar.fullCalendar('changeView', newView);
};

Calendar.prototype.defaultOpts = function() {
  return {
    calendarOpts: {
      header: {
        left: 'prev,next',
        center: 'title',
        right: 'month,quarterCategory'
      },
      buttonIcons: false,
      buttonText: {
        today: 'Today',
        week: 'Week',
      },
      contentHeight: 'auto',
      dayRender: this.handleDayRender.bind(this),
      dayPopoverFormat: 'MMM D, YYYY',
      defaultView: this.defaultView(),
      eventRender: this.handleEventRender.bind(this),
      eventAfterAllRender: this.handleRender.bind(this),
      eventClick: this.handleEventClick.bind(this),
      eventLimit: true,
      nowIndicator: true,
      views: {
        agenda: {
          scrollTime: '09:00:00',
          minTime: '08:00:00',
          maxTime: '20:00:00'
        },
        month: {
          eventLimit: 3,
          buttonText: 'Month'
        },
        quarterCategory: {
          type: 'list',
          buttonText: 'Quarter',
          categories: true,
          sortBy: 'category',
          duration: {quarters: 1, intervalUnit: 'quarter'}
        },
        quarterTime: {
          type: 'list',
          sortBy: 'time',
          duration: {quarters: 1, intervalUnit: 'quarter'}
        },
        monthCategory: {
          type: 'list',
          categories: true,
          sortBy: 'category',
          duration: {months: 1, intervalUnit: 'month'}
        },
        monthTime: {
          type: 'list',
          sortBy: 'time',
          duration: {months: 1, intervalUnit: 'month'}
        },
      }
    },
    sourceOpts: {
      startParam: 'min_start_date',
      endParam: 'max_start_date',
      success: this.success.bind(this)
    }
  };
};

Calendar.prototype.filter = function() {
  var params = this.filterSet.serialize();
  if (_.isEqual(params, this.params)) {
    return;
  }
  var url = this.url.clone().addQuery(params || {}).toString();
  urls.pushQuery(this.filterSet.serialize(), this.filterSet.fields);
  this.$calendar.fullCalendar('removeEventSource', this.sources);
  this.sources = $.extend({}, this.opts.sourceOpts, {url: url});
  this.$calendar.fullCalendar('addEventSource', this.sources);
  this.updateLinks(params);
  this.params = params;
};

Calendar.prototype.success = function(response) {
  var self = this;
  return response.results.map(function(event) {
    var processed = {
      category: event.category,
      location: event.location,
      title: event.description || 'Event title',
      summary: event.summary || 'Event summary',
      state: event.state ? event.state.join(', ') : null,
      start: event.start_date ? moment.utc(event.start_date) : null,
      end: event.end_date ? moment.utc(event.end_date) : null,
      allDay: moment.utc(event.start_date).format('HHmmss') === '000000' && event.end_date === null,
      className: calendarHelpers.getEventClass(event),
      detailUrl: event.url
    };
    _.extend(processed, {
      google: calendarHelpers.getGoogleUrl(processed),
      download: self.exportUrl.clone().addQuery({event_id: event.event_id}).toString()
    });
    return processed;
  });
};

Calendar.prototype.updateLinks = function(params) {
  var url = this.exportUrl.clone().addQuery(params || {});
  var urls = {
    ics: url.toString(),
    csv: url.clone().addQuery({renderer: 'csv'}).toString(),
    // Note: The cid parameter silently rejects https links; use http and allow
    // the backend to redirect to https
    google: 'https://calendar.google.com/calendar/render?cid=' +
      encodeURIComponent(url.clone().protocol('http').toString()),
    calendar: url.protocol('webcal').toString()
  };
  this.$download.html(templates.download(urls));
  this.$subscribe.html(templates.subscribe(urls));

  if (this.downloadButton) {
    this.downloadButton.destroy();
  }

  if (this.subscribeButton) {
    this.subscribeButton.destroy();
  }

  this.downloadButton = new dropdown.Dropdown(this.$download, {checkboxes: false});
  this.subscribeButton = new dropdown.Dropdown(this.$subscribe, {checkboxes: false});
};

Calendar.prototype.styleButtons = function() {
  var baseClasses = 'button button--neutral';
  this.$calendar.find('.fc-button').addClass(baseClasses);
  this.$calendar.find('.fc-next-button').addClass('button--next');
  this.$calendar.find('.fc-prev-button').addClass('button--previous');
  this.$calendar.find('.fc-right .fc-button-group').addClass('toggles--buttons');
};

Calendar.prototype.defaultView = function() {
  if ($(document).width() < helpers.BREAKPOINTS.MEDIUM) {
    return 'monthTime';
  } else {
    return 'month';
  }
};

Calendar.prototype.handleRender = function(view) {
  $(document.body).trigger($.Event('calendar:rendered'));
  this.highlightToday();
  this.manageViewToggles(view);
  if (MONTH_VIEWS.indexOf(view.name) !== -1) {
    this.$viewToggles.removeClass('is-disabled');
    this.$calendar.find('.fc-month-button').addClass('fc-state-active');
  } else if (this.$viewToggles) {
    this.$viewToggles.addClass('is-disabled');
  }

   if (LIST_VIEWS.indexOf(view.name) !== -1) {
    this.manageListToggles(view);
  } else if (this.$listToggles) {
    this.$listToggles.remove();
    this.$listToggles = null;
  }
  this.$calendar.find('.fc-more').attr({'tabindex': '0', 'aria-describedby': this.popoverId});
};

Calendar.prototype.manageListToggles = function(view) {
  if (!this.$listToggles) {
    this.$listToggles = $('<div class="cal-list__toggles"></div>');
    this.$listToggles.prependTo(this.$calendar.find('.fc-view-container'));
  }
  this.$listToggles.html(templates.listToggles(view.options));
  // Highlight the quarter button on quarterTime
  if (view.name === 'quarterTime') {
    this.$calendar.find('.fc-quarterCategory-button').addClass('fc-state-active');
    this.$calendar.find('.fc-month-button').removeClass('fc-state-active');
  }
};

Calendar.prototype.manageViewToggles = function(view) {
  if (!this.$viewToggles) {
    this.$viewToggles = $('<div class="cal-view__toggles"></div>');
    this.$viewToggles.prependTo(this.$calendar.find('.fc-toolbar .fc-right'));
  }
  this.$viewToggles.html(templates.viewToggles(view))
};

Calendar.prototype.handleEventRender = function(event, element) {
  var eventLabel = event.title + ' ' +
    event.start.format('dddd MMMM D, YYYY') +
    '. Category: ' + event.category;
  element.attr({
    'tabindex': '0',
    'aria-describedby': this.detailsId,
    'aria-label': eventLabel
  });
};

Calendar.prototype.handleDayRender = function(date, cell) {
  if (date.date() === 1) {
    cell.append(date.format('MMMM'));
  }
};

Calendar.prototype.handleEventClick = function(calEvent, jsEvent, view) {
  var $target = $(jsEvent.target);
  if (!$target.closest('.tooltip').length) {
    var $closest = $target.closest('.fc-content');
    var $eventContainer = $closest.length ? $closest : $target.find('.fc-content');
    var tooltip = new calendarTooltip.CalendarTooltip(
      templates.details(_.extend({}, calEvent, {detailsId: this.detailsId})),
      $eventContainer.parent()
    );
    $eventContainer.append(tooltip.$content);
  }
};

// Simulate clicks when hitting enter on certain full-calendar elements
Calendar.prototype.simulateClick = function(e) {
  if (e.keyCode === 13) {
    $(e.target).click();
  }
};

Calendar.prototype.managePopoverControl = function(e) {
  var $target = $(e.target);
  var $popover = this.$calendar.find('.fc-popover');
  $popover.attr('id', this.popoverId).attr('role', 'tooltip');
  $popover.find('.fc-close')
    .attr('tabindex', '0')
    .focus()
    .on('click', function() {
      $target.focus();
    });
};

Calendar.prototype.highlightToday = function() {
  var $today = this.$calendar.find('thead .fc-today');
  var todayIndex = $today.index() + 1;
  $today
    .closest('table')
    .find('tbody tr td:nth-child(' + todayIndex + ')')
    .addClass('fc-today');
};

module.exports = {Calendar: Calendar};
