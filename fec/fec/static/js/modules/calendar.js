/**
 *
 */
import { default as Handlebars } from 'hbsfy/runtime.js';
import $ from 'jquery';
import moment from 'moment';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as _isEqual } from 'underscore/modules/isEqual.js';
import { default as URI } from 'urijs';

import 'fullcalendar';

import { checkStartTime, className, getGoogleUrl, mapCategoryDescription } from './calendar-helpers.js';
import { CalendarTooltip } from './calendar-tooltip.js';
import Dropdown from './dropdowns.js';
import { LOADING_DELAY, SUCCESS_DELAY, datetime, eq, isLargeScreen, toUpperCase } from './helpers.js';
import { pushQuery, updateQuery } from './urls.js';
import './calendar-list-view.js';
import { default as template_details } from '../templates/calendar/details.hbs';
import { default as template_download } from '../templates/calendar/download.hbs';
import { default as template_listToggles } from '../templates/calendar/listToggles.hbs';
import { default as template_subscribe } from '../templates/calendar/subscribe.hbs';

// TODO: do we need to registerHelper?
Handlebars.registerHelper('eq', eq);
Handlebars.registerHelper('datetime', datetime);
Handlebars.registerHelper('toUpperCase', toUpperCase);

const templates = {
  details: template_details,
  download: template_download,
  subscribe: template_subscribe,
  listToggles: template_listToggles
};

const LIST_VIEWS = ['monthTime', 'monthCategory'];

const FC = $.fullCalendar;
const Grid = FC.Grid;

// Globally override event sorting to order all-day events last
// TODO: Convince fullcalendar.io support this behavior without monkey-patching
Grid.prototype.compareEventSegs = function(seg1, seg2) {
  return (
    seg1.event.allDay - seg2.event.allDay || // put all-day events last (booleans cast to 0/1)
    seg1.eventStartMS - seg2.eventStartMS || // tie? earlier events go first
    seg2.eventDurationMS - seg1.eventDurationMS || // tie? longer events go first
    FC.compareByFieldSpecs(seg1.event, seg2.event, this.view.eventOrderSpecs)
  );
};

export default function Calendar(opts) {
  this.opts = $.extend({}, this.defaultOpts(), opts);

  this.$calendar = $(this.opts.selector);
  this.$head = $('.data-container__head');
  this.$calendar.fullCalendar(this.opts.calendarOpts);
  this.url = URI(this.opts.url);
  this.subscribeUrl = URI(this.opts.subscribeUrl);
  this.exportUrl = URI(this.opts.exportUrl);
  this.filterPanel = this.opts.filterPanel;
  this.filterSet = this.filterPanel.filterSet;

  this.popoverId = 'calendar-popover';
  this.detailsId = 'calendar-details';

  this.sources = null;
  this.params = null;

  this.$download = $(opts.download);
  this.$subscribe = $(opts.subscribe);

  this.$calendar.on('click', '.js-toggle-view', this.toggleListView.bind(this));

  this.$calendar.on(
    'keypress',
    '.fc-event, .fc-more, .fc-close',
    this.simulateClick.bind(this)
  );
  this.$calendar.on('click', '.fc-more', this.managePopoverControl.bind(this));

  this.filterPanel.$form.on('change', this.filter.bind(this));
  $(window).on('popstate', this.filter.bind(this));

  updateQuery(this.filterSet.serialize(), this.filterSet.fields);

  this.filter();
  this.styleButtons();

  if (!isLargeScreen()) {
    this.$head.after($('#filters'));
  }
}

Calendar.prototype.toggleListView = function(e) {
  const newView = $(e.target).data('trigger-view');
  this.$calendar.fullCalendar('changeView', newView);
};

Calendar.prototype.defaultOpts = function() {
  return {
    calendarOpts: {
      header: {
        left: 'prev,next,today',
        center: '',
        right: 'monthTime,month'
      },
      buttonIcons: false,
      buttonText: {
        today: 'This Month',
        week: 'Week'
      },
      contentHeight: 'auto',
      dayRender: this.handleDayRender.bind(this),
      dayPopoverFormat: 'MMMM D, YYYY',
      defaultView: 'monthTime',
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
          buttonText: 'Grid'
        },
        monthCategory: {
          type: 'list',
          categories: true,
          sortBy: 'category',
          duration: { months: 1, intervalUnit: 'month' }
        },
        monthTime: {
          type: 'list',
          buttonText: 'List',
          sortBy: 'time',
          duration: { months: 1, intervalUnit: 'month' }
        }
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
  const params = this.filterSet.serialize();
  if (_isEqual(params, this.params)) {
    return;
  }
  const url = this.url
    .clone()
    .addQuery(params || {})
    .toString();
  pushQuery(this.filterSet.serialize(), this.filterSet.fields);
  this.$calendar.fullCalendar('removeEventSource', this.sources);
  this.sources = $.extend({}, this.opts.sourceOpts, { url: url });
  this.$calendar.fullCalendar('addEventSource', this.sources);
  this.updateLinks(params);
  this.params = params;
};

Calendar.prototype.success = function(response) {
  const self = this;

  setTimeout(function() {
    $('.is-loading')
      .removeClass('is-loading')
      .addClass('is-successful');
  }, LOADING_DELAY);

  setTimeout(function() {
    $('.is-successful').removeClass('is-successful');
  }, SUCCESS_DELAY);

  return response.results.map(function(event) {
    let processed = {
      category: event.category,
      location: event.location,
      title: event.summary || 'Event title',
      summary: event.summary || 'Event summary',
      description: event.description || 'Event description',
      state: event.state ? event.state.join(', ') : null,
      start: event.start_date ? moment(event.start_date) : null,
      hasStartTime: checkStartTime(event),
      end: event.end_date ? moment(event.end_date) : null,
      className: className(event),
      tooltipContent: mapCategoryDescription(event.category),
      allDay: event.all_day,
      detailUrl: event.url
    };
    _extend(processed, {
      google: getGoogleUrl(processed),
      download: self.subscribeUrl
        .clone()
        .addQuery({ event_id: event.event_id })
        .toString()
    });
    return processed;
  });
};

Calendar.prototype.updateLinks = function(params) {
  const url = this.exportUrl.clone().addQuery(params || {});
  const subscribeURL = this.subscribeUrl.clone().addQuery(params || {});
  const urls = {
    ics: url.toString(),
    csv: url
      .clone()
      .addQuery({ renderer: 'csv' })
      .toString(),
    // Note: The cid parameter silently rejects https links; use http and allow
    // the backend to redirect to https
    google:
      'https://calendar.google.com/calendar/render?cid=' +
      encodeURIComponent(
        url
          .clone()
          .protocol('http')
          .toString()
      ),
    calendar: url.protocol('webcal').toString(),

    googleSubscribe:
      'https://calendar.google.com/calendar/render?cid=' +
      encodeURIComponent(
        subscribeURL
          .clone()
          .protocol('http')
          .toString()
      ),
    calendarSubscribe: subscribeURL.protocol('webcal').toString()
  };
  this.$download.html(templates.download(urls));
  this.$subscribe.html(templates.subscribe(urls));

  if (this.downloadButton) {
    this.downloadButton.destroy();
  }

  if (this.subscribeButton) {
    this.subscribeButton.destroy();
  }

  this.downloadButton = new Dropdown(this.$download, {
    checkboxes: false
  });
  this.subscribeButton = new Dropdown(this.$subscribe, {
    checkboxes: false
  });
};

Calendar.prototype.styleButtons = function() {
  const baseClasses = 'button';
  this.$calendar.find('.fc-button').addClass(baseClasses);
  this.$calendar.find('.fc-today-button').addClass('button--alt');
  this.$calendar
    .find('.fc-next-button')
    .addClass('button--next button--standard');
  this.$calendar
    .find('.fc-prev-button')
    .addClass('button--previous button--standard');
  this.$calendar
    .find('.fc-right .fc-button-group')
    .addClass('toggles--buttons');
  this.$calendar
    .find('.fc-monthTime-button')
    .addClass('button--list button--alt');
  this.$calendar.find('.fc-month-button').addClass('button--grid button--alt');
};

Calendar.prototype.handleRender = function(view) {
  $(document.body).trigger($.Event('calendar:rendered'));
  if (LIST_VIEWS.indexOf(view.name) !== -1) {
    this.manageListToggles(view);
  } else if (this.$listToggles) {
    this.$listToggles.remove();
    this.$listToggles = null;
  }
  this.$calendar
    .find('.fc-more')
    .attr({ tabindex: '0', 'aria-describedby': this.popoverId });
  this.$head.find('.js-calendar-title').html(view.title);
};

Calendar.prototype.manageListToggles = function(view) {
  if (!this.$listToggles) {
    this.$listToggles = $('<div class="cal-list__toggles"></div>');
    this.$listToggles.appendTo(this.$calendar.find('.fc-right'));
  }
  this.$listToggles.html(templates.listToggles(view.options));
  // Highlight the "List" button on monthTime
  if (view.name === 'monthCategory') {
    this.$calendar.find('.fc-monthTime-button').addClass('fc-state-active');
  }
};

Calendar.prototype.handleEventRender = function(event, element) {
  const eventLabel =
    event.title +
    ' ' +
    event.start.format('dddd MMMM D, YYYY') +
    '. Category: ' +
    event.category;
  element.attr({
    tabindex: '0',
    'aria-describedby': this.detailsId,
    'aria-label': eventLabel
  });
};

Calendar.prototype.handleDayRender = function(date, cell) {
  if (date.date() === 1) {
    cell.append(date.format('MMMM'));
  }
};

Calendar.prototype.handleEventClick = function(calEvent, jsEvent) {
  const $target = $(jsEvent.target);
  if (!$target.closest('.tooltip').length) {
    const $eventContainer = $target.closest('.fc-event');
    const tooltip = new CalendarTooltip(
      templates.details(_extend({}, calEvent, { detailsId: this.detailsId })),

      $eventContainer
    );
    $eventContainer.append(tooltip.$content);
  }
};

// Simulate clicks when hitting enter on certain full-calendar elements
Calendar.prototype.simulateClick = function(e) {
  if (e.keyCode === 13) {
    $(e.target).trigger('click');
  }
};

Calendar.prototype.managePopoverControl = function(e) {
  const $target = $(e.target);
  const $popover = this.$calendar.find('.fc-popover');
  $popover.attr('id', this.popoverId).attr('role', 'tooltip');
  $popover
    .find('.fc-close')
    .attr('tabindex', '0')
    .trigger('focus')
    .on('click', function() {
      $target.trigger('focus');
    });
};
