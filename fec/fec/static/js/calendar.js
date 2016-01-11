'use strict';

var $ = require('jquery');
var URI = require('urijs');
var _ = require('underscore');
var moment = require('moment');

var urls = require('fec-style/js/urls');
var dropdown = require('fec-style/js/dropdowns');
require('fec-style/js/helpers');

require('fullcalendar');

var eventsTemplate = require('../hbs/calendar/events.hbs');

var FC = $.fullCalendar;
var View = FC.View;

var ListView = View.extend({

  setDate: function(date) {
    var intervalUnit = this.options.duration.intervalUnit || this.intervalUnit;
    View.prototype.setDate.call(this, date.startOf(intervalUnit));
  },

  renderEvents: function(events) {
    var self = this;
    events = events.filter(function(event) {
      return self.start <= event.start && event.start < self.end;
    }).sort(function(event1, event2) {
      return event1.start - event2.start;
    });
    this.el.html(eventsTemplate({events: events}));
  },

  unrenderEvents: function() {
    this.el.html('');
  }

});

FC.views.list = ListView;

var templates = {
  day: require('../hbs/calendar/day.hbs'),
  details: require('../hbs/calendar/details.hbs'),
  download: require('../hbs/calendar/download.hbs'),
  subscribe: require('../hbs/calendar/subscribe.hbs')
};

function Calendar(opts) {
  this.opts = $.extend({}, Calendar.defaultOpts, opts);

  this.$calendar = $(this.opts.selector).fullCalendar(this.opts.calendarOpts);
  this.url = URI(this.opts.url);
  this.exportUrl = URI(this.opts.exportUrl);
  this.filterPanel = this.opts.filterPanel;
  this.filterSet = this.filterPanel.filterSet;

  this.sources = null;
  this.params = null;

  this.$download = $(opts.download);
  this.$subscribe = $(opts.subscribe);

  this.$calendar.on('calendar:rendered', this.filterPanel.setHeight());
  this.filterPanel.$form.on('change', this.filter.bind(this));
  $(window).on('popstate', this.filter.bind(this));

  urls.updateQuery(this.filterSet.serialize(), this.filterSet.fields);

  this.filter();
  this.styleButtons();
  this.filterPanel.setHeight();
}

Calendar.defaultOpts = {
  calendarOpts: {
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'listQuarter,listMonth,month,agendaWeek,agendaDay'
    },
    buttonIcons: false,
    buttonText: {
      today: 'Today',
      week: 'Week',
      day: 'Day'
    },
    eventAfterAllRender: handleRender,
    eventClick: handleEventClick,
    eventLimit: true,
    eventLimitClick: handleEventLimitClick,
    nowIndicator: true,
    views: {
      month: {
        eventLimit: 3,
        buttonText: 'Month - Grid'
      },
      listMonth: {
        type: 'list',
        buttonText: 'Month - List',
        duration: {months: 1}
      },
      listQuarter: {
        type: 'list',
        buttonText: 'Quarter',
        duration: {quarters: 1, intervalUnit: 'quarter'}
      }
    }
  },
  sourceOpts: {}
};

function handleRender(view) {
  $(document.body).trigger($.Event('calendar:rendered'));
}

function handleEventClick(calEvent, jsEvent, view) {
  var $eventContainer = $(jsEvent.target).closest('.fc-event-container');
  var tooltip = new CalendarTooltip(templates.details(calEvent));
  $eventContainer.append(tooltip.$content);
}
function handleEventLimitClick(cellInfo, jsEvent) {
  var tooltip = new CalendarTooltip(templates.day(cellInfo));
  $(cellInfo.dayEl).append(tooltip.$content);
}

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

var classMap = {
  aos: 'fc--rules',
  election: 'fc--election',
  report: 'fc--deadline',
  open: 'fc--meeting',
  executive: 'fc--meeting',
  roundtables: 'fc--outreach',
  conferences: 'fc--outreach',
  litigation: 'fc--other',
  fea: 'fc--other',
  ie: 'fc--deadline',
  ec: 'fc--deadline'
};

function getEventClass(event) {
  var className = '';
  var category = event.category ? event.category.split(/[ -]+/)[0] : null;

  className += event.end_Date !== null ? 'fc--allday' : '';
  className += category ? ' ' + classMap[category.toLowerCase()] : '';
  return className;
}

function success(response) {
  return response.results.map(function(event) {
    return {
      category: event.category,
      title: event.description || 'Event title',
      summary: event.summary || 'Event summary',
      start: event.start_date ? moment.utc(event.start_date) : null,
      end: event.end_date ? moment.utc(event.end_date) : null,
      allDay: event.end_date === null,
      className: getEventClass(event)
    };
  });
}

var fecSources = {
  startParam: 'min_start_date',
  endParam: 'max_start_date',
  success: success
};

function getUrl(path, params) {
  return URI(window.API_LOCATION)
    .path([window.API_VERSION].concat(path || []).join('/'))
    .addQuery({
      api_key: window.API_KEY,
      per_page: 500
    })
    .addQuery(params || {})
    .toString();
}

function CalendarTooltip(content) {
  this.$content = $(content);
  this.$close = this.$content.find('.js-close');
  this.$content.on('click', this.$close, this.close.bind(this));
}

CalendarTooltip.prototype.close = function() {
  this.$content.remove();
};

module.exports = {
  Calendar: Calendar,
  fecSources: fecSources,
  getUrl: getUrl
};
