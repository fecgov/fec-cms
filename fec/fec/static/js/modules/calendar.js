/* eslint-disable */
/**
 *
 */
import { Calendar as FullCalendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import bootstrap5Plugin from '@fullcalendar/bootstrap5'; // Being included because fullcalendar requires a themesystem and the default is too bossy
// import '@fullcalendar/core';
// new Calendar();
// import '@fullcalendar/common/vdom';
import { default as Handlebars } from 'hbsfy/runtime.js';
import $ from 'jquery';
// import moment from 'moment';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as _isEqual } from 'underscore/modules/isEqual.js';
import { default as URI } from 'urijs';

import { checkStartTime, className, getGoogleUrl, mapCategoryDescription } from './calendar-helpers.js';
import { CalendarTooltip } from './calendar-tooltip.js';
import Dropdown from './dropdowns.js';
import { LOADING_DELAY, SUCCESS_DELAY, datetime, eq, isLargeScreen, toUpperCase } from './helpers.js';
import { pushQuery, updateQuery } from './urls.js';
import { eventHtmlString } from './calendar-list-view.js';
import { default as CustomViewPlugin } from './calendar-list-view.js';
import { default as template_details } from '../templates/calendar/details.hbs';
import { default as template_download } from '../templates/calendar/download.hbs';
import { default as template_listToggles } from '../templates/calendar/listToggles.hbs';
import { default as template_subscribe } from '../templates/calendar/subscribe.hbs';

// TODO: do we need to registerHelper?
// Handlebars.registerHelper('eq', eq);
// Handlebars.registerHelper('datetime', datetime);
// Handlebars.registerHelper('toUpperCase', toUpperCase);

/** @enum {html} */
const templates = {
  details: template_details,
  download: template_download,
  subscribe: template_subscribe,
  listToggles: template_listToggles
};

const LIST_VIEWS = ['monthTime', 'monthCategory'];

// const FC = $.fullCalendar;
// const Grid = FC.Grid;

// Globally override event sorting to order all-day events last
// TODO: Convince fullcalendar.io support this behavior without monkey-patching
// Grid.prototype.compareEventSegs = function(seg1, seg2) {
//   return (
//     seg1.event.allDay - seg2.event.allDay || // put all-day events last (booleans cast to 0/1)
//     seg1.eventStartMS - seg2.eventStartMS || // tie? earlier events go first
//     seg2.eventDurationMS - seg1.eventDurationMS || // tie? longer events go first
//     FC.compareByFieldSpecs(seg1.event, seg2.event, this.view.eventOrderSpecs)
//   );
// };

export default function Calendar(opts) {
  this.trashname = Calendar.name;
  // this.opts = $.extend({}, this.defaultOpts(), opts);
  this.opts = Object.assign({}, this.defaultOpts(), opts);

  // this.$calendar = $(this.opts.selector);
  console.log('this.opts.selector: ', this.opts.selector);
  this.calendarEl = document.querySelector(this.opts.selector);
  // this.$head = $('.data-container__head');
  this.headEl = document.querySelector('.data-container__head');
  // this.$calendar.fullCalendar(this.opts.calendarOpts);
  // console.log('this.calendarEl: ', this.calendarEl);
  this.calendar = new FullCalendar(this.calendarEl, this.opts.calendarOpts);
  window.calendar = this.calendar;
  this.url = URI(this.opts.url);
  this.subscribeUrl = URI(this.opts.subscribeUrl);
  this.exportUrl = URI(this.opts.exportUrl);
  this.filterPanel = this.opts.filterPanel;
  this.filterSet = this.filterPanel.filterSet;

  this.popoverId = 'calendar-popover';
  this.detailsId = 'calendar-details';

  this.eventSources = null;
  this.params = null;

  // this.$download = $(opts.selector_download);
  this.downloadEl = document.querySelector(opts.selector_download);
  // this.$subscribe = $(opts.selector_subscribe);
  this.subscribeEl = document.querySelector(opts.selector_subscribe);

  // this.$calendar.on('click', '.js-toggle-view', this.toggleListView.bind(this));
  const toggleView = this.calendarEl.querySelector('.js-toggle-view');
  // toggleView.addEventListener('click', this.toggleListView.bind(this));

  // this.$calendar.on(
  //   'keypress',
  //   '.fc-event, .fc-more, .fc-close',
  //   this.simulateClick.bind(this)
  // );
  const keypressElements = document.querySelectorAll('.fc-event, .fc-more, .fc-close');
  keypressElements.forEach(el => {
    el.addEventListener('keypress', this.simulateClick.bind(this));
  });

  // this.$calendar.on('click', '.fc-more', this.managePopoverControl.bind(this));
  // this.calendarEl.querySelector('.fc-more').addEventListener('click', this.managePopoverControl.bind(this));

  // this.filterPanel.$form.on('change', this.filter.bind(this));
  // this.filterPanel.$form.addEventListener('change', this.filter.bind(this));
  // $(window).on('popstate', this.filter.bind(this));
  window.addEventListener('popstate', this.filter.bind(this));

  updateQuery(this.filterSet.serialize(), this.filterSet.fields);

  this.filter();

  if (!isLargeScreen()) {
    // this.$head.after($('#filters'));
    this.headEl.after(document.querySelector('#filters'));
  }

  // Make it exist
  this.calendar.render();

  this.styleButtons();
}

Calendar.prototype.toggleListView = function(e) {
  console.log('Calendar.toggleListView(e): ', e);
  // const newView = $(e.target).data('trigger-view');
  const newView = e.target.dataset.triggerView;
  // this.$calendar.fullCalendar('changeView', newView);
  this.calendar.changeView(newView);
};

/**
 *
 */
Calendar.prototype.defaultOpts = function() {
  return {
    calendarOpts: {
      headerToolbar: { //header: {
        left: 'prev,next,today',
        center: '',
        right: 'monthTime,month',
        // right: 'dayGridMonth,timeGridWeek,listWeek'
      },
      buttonIcons: false, // The icons fc should put on buttons
      buttonText: { // The text labels for buttons
        today: 'This Month',
        // next: '',
        // prev: ''
        // week: 'Week YAY'
      },
      // contentHeight: 'auto',
      // dayRender: this.handleDayRender.bind(this),
      // dayPopoverFormat: 'MMMM D, YYYY',
      initialView: 'custom',//'listMonth'
      themeSystem: 'bootstrap5', // of the three choices, bootstrap5 is the lowest impact
      // eventRender: this.handleEventRender.bind(this),
      // eventAfterAllRender: this.handleRender.bind(this),
      // eventClick: this.handleEventClick.bind(this),
      // success: this.success.bind(this),
      // failure: this.failure.bind(this),
      datesSet: this.datesSet.bind(this),
      // eventLimit: true,
      // nowIndicator: true,
      // plugins: [customViewPlugin],
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, bootstrap5Plugin, CustomViewPlugin], //CustomViewPlugin
      views: {
      //   dayGridMonth: {},
      //   timeGridWeek: {},
      //   dayGrid: {},
      //   timeGrid: {},
      //   week: {},
      //   day: {}
        // agenda: {
        //   scrollTime: '09:00:00',
        //   minTime: '08:00:00',
        //   maxTime: '20:00:00'
        // },
        month: {
          // eventLimit: 3,
          buttonText: 'Grid'
        },
        // monthCategory: {
        //   type: 'list',
        //   categories: true,
        //   sortBy: 'category',
        //   duration: { months: 1, intervalUnit: 'month' }
        // },
        monthTime: {
          type: 'list',
          buttonText: 'List',
          sortBy: 'time',
          duration: { months: 1, intervalUnit: 'month' }
        },
        custom: {
        // listMonth: {
          type: 'list',
          // categories: true,
          buttonText: 'List',
          // sortBy: 'time',
          // scopeThis: this,
          // props: {this: this},
          duration: { months: 1, intervalUnit: 'month' },
          viewDidMount: function(arg) {
            console.log('views.custom.viewDidMount(arg): ', arg);
          },
          viewWillUnmount: function(arg) {
            console.log('views.custom.viewWillUnmount(arg): ', arg);
          },
          // dayHeaderContent: function(d) {
          //   console.log('views.custom.dayHeaderContent(arg): ', d);
          //   return { html: `<time datetime="${d.date.toISOString()}" class="cal-list__title">${d.text}</time>` };
          // },
          // eventContent: function(arg) {
          //   console.log('views.custom.eventContent(arg): ', arg);
          //   console.log('  this: ', this);
          //   return {html: eventHtmlString(arg)};
          // },
          eventDataTransform: function(arg) {
            console.log('views.custom.eventDataTransform(arg): ', arg);
            // return {html: eventHtmlString(arg)};
          }
        },
        // noEventsDidMount: function(info) {
        //   console.log('noEventsDidMount(info): ', info);
        // }
      },
      dayHeaderContent: function(d) {
        console.log('Calendar.dayHeaderContent(arg): ', d);
        return { html: `<time datetime="${d.date}" class="cal-list__title">${d.text}</time>` };
      },
      eventContent: function(arg) {
        console.log('Calendar.eventContent(arg): ', arg);
      },
      // render: function(arg) {
      //   console.log('Calendar.render(arg): ', arg);
      // },
      // onRender: function(arg) {
      //   console.log('Calendar.onRender(arg): ', arg);
      // }
    },
    sourceOpts: {
      startParam: 'min_start_date',
      endParam: 'max_start_date',
      initialDate: '2024-12-15',
      success: this.success.bind(this),
      failure: this.failure.bind(this),
      datesSet: this.datesSet.bind(this)
    }
  };
};

Calendar.prototype.filter = function() {
  console.log('Calendar.filter()');
  const params = this.filterSet.serialize();
  if (_isEqual(params, this.params)) {
    return;
  }
  const url = this.url
    .clone()
    .addQuery(params || {})
    .toString();

  console.log('  url: ', url);
  pushQuery(this.filterSet.serialize(), this.filterSet.fields);
  // this.$calendar.fullCalendar('removeEventSource', this.eventSources);
  if (this.eventSources) this.eventSources.remove();
  // this.eventSources = $.extend({}, this.opts.sourceOpts, { url: url });
  this.eventSources = Object.assign(
    {},
    this.opts.sourceOpts,
    {
      url: url,
      // success: this.success.bind(this),
      // failure: this.failure.bind(this),
      // dayRender: this.handleDayRender.bind(this),
      // eventRender: this.handleEventRender.bind(this),
      // eventAfterAllRender: this.handleRender.bind(this),
      // eventClick: this.handleEventClick.bind(this)
    }
  );
  // this.$calendar.fullCalendar('addEventSource', this.eventSources);
  this.calendar.addEventSource(this.eventSources);
  this.updateLinks(params);
  this.params = params;

  // this.calendar.render();
};

Calendar.prototype.datesSet = function(v1) {
  v1.startStr = v1.startStr.slice(0,10);
  v1.endStr = v1.endStr.slice(0,10);
};

Calendar.prototype.failure = function(v1) {
  console.log('failure(v1): ', v1);
};

/**
 * 
 * @param {Object} content
 * @param {Response} response
 * @returns 
 */
Calendar.prototype.success = function(content, response) {
  console.log('Calendar.success(content, response): ', content, response);
  const self = this;

  setTimeout(function() {
  //   $('.is-loading')
  //     .removeClass('is-loading')
  //     .addClass('is-successful');
  // }, LOADING_DELAY);
    const elements = document.querySelectorAll('.is-loading');
    elements.forEach(el => {
      el.classList.remove('is-loading');
      el.classList.add('is-successful');
    });
  }, LOADING_DELAY);

  setTimeout(function() {
    // $('.is-successful').removeClass('is-successful');
    const elements = document.querySelectorAll('is-successful');
    elements.forEach(el => {
      el.classList.remove('is-successful');
    });
  }, SUCCESS_DELAY);

  self.handleRender(self.calendar.view);

  return content.results.map(function(event) {
    let processed = {
      category: event.category,
      location: event.location,
      title: event.summary || 'Event title',
      summary: event.summary || 'Event summary',
      description: event.description || 'Event description',
      state: event.state ? event.state.join(', ') : null,
      start: event.start_date,
      hasStartTime: checkStartTime(event),
      end: event.end_date,
      className: className(event),
      tooltipContent: mapCategoryDescription(event.category),
      allDay: event.all_day,
      detailUrl: event.url
    };
    processed.google = getGoogleUrl(processed);
    processed.download = self.subscribeUrl
      .clone()
      .addQuery({ event_id: event.event_id })
      .toString();

    return processed;
  });
};

Calendar.prototype.updateLinks = function(params) {
  console.log('Calendar.updateLinks(params): ', params);
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
  // this.$download.html(templates.download(urls));
  this.downloadEl.innerHTML = templates.download(urls);
  // this.$subscribe.html(templates.subscribe(urls));
  this.subscribeEl.innerHTML = templates.subscribe(urls);

  if (this.downloadButton) {
    this.downloadButton.destroy();
  }

  if (this.subscribeButton) {
    this.subscribeButton.destroy();
  }

  this.downloadButton = new Dropdown(this.opts.selector_download, {
    checkboxes: false
  });
  this.subscribeButton = new Dropdown(this.opts.selector_subscribe, {
    checkboxes: false
  });
};

/**
 * Adds the fec-specific class names to fc elements
 */
Calendar.prototype.styleButtons = function() {
  const baseClasses = ['button'];
  // document.querySelector('.fc-button').classList.add(...baseClasses);
  // document.querySelectorAll('.fc-button').forEach(el => { el.classList.add(...baseClasses) });
  document.querySelector('.fc-toolbar-start .fc-today-button').classList.add('button', 'button--alt');
  document.querySelector('.fc-toolbar-start .fc-next-button').classList.add(
    'button', 'button--next', 'button--standard');
  document.querySelector('.fc-toolbar-start .fc-prev-button').classList.add(
    'button', 'button--previous', 'button--standard');
  document.querySelector('.fc-toolbar-end .btn-group').classList.add('toggles--buttons');
  document.querySelector('.fc-toolbar-end .fc-monthTime-button').classList.add(
    'button', 'button--list', 'button--alt');
  document.querySelector('.fc-toolbar-end .fc-month-button').classList.add('button', 'button--grid', 'button--alt');
};

/**
 * 
 * @param {ViewImpl} view
 * No other params
 */
Calendar.prototype.handleRender = function(view) {
  console.log('Calendar.handleRender(view, two): ', view);
  console.log('  this: ', this);

  $(document.body).trigger($.Event('calendar:rendered'));

  // if (LIST_VIEWS.indexOf(view.name) !== -1) {
  if (LIST_VIEWS.indexOf(view.type) !== -1) {
    console.log('  if');
    this.manageListToggles(view);

  } else if (this.$listToggles) {
    console.log('  else if');
    this.$listToggles.remove();
    this.$listToggles = null;
  } else {
    console.log('  else');
  }
  // this.$calendar
  //   .find('.fc-more')
    // .attr({ tabindex: '0', 'aria-describedby': this.popoverId });
  const fcMore = this.calendarEl.querySelector('.fc-more');
  if (fcMore) fcMore.setAttribute('tabindex', 0);
  if (fcMore) fcMore.setAttribute('aria-describedby', this.popoverId);
  
  // Move 'Month YYYY' to be the page title, not just the view title
  document.querySelector('.js-calendar-title').innerHTML = view.title;
};

/**
 * 
 * @param {*} view 
 */
Calendar.prototype.manageListToggles = function(view) {
  console.log('Calendar.manageListToggles(view): ', view);
  if (!this.$listToggles) {
    this.$listToggles = $('<div class="cal-list__toggles"></div>');
    this.$listToggles.appendTo(this.$calendar.find('.fc-toolbar-end'));
  }
  this.$listToggles.html(templates.listToggles(view.options));
  // Highlight the "List" button on monthTime
  if (view.name === 'monthCategory') {
    this.$calendar.find('.fc-monthTime-button').addClass('fc-state-active');
  }
};

Calendar.prototype.handleEventRender = function(event, element) {
  console.log('Calendar.handleEventRender(event, element): ', event, element);
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
  console.log('Calendar.handleDayRender(date, cell): ', date, cell);
  if (date.date() === 1) {
    cell.append(date.format('MMMM'));
  }
};

Calendar.prototype.handleEventClick = function(calEvent, jsEvent) {
  console.log('Calendar.handleEventClick(calEvent, jsEvent): ', calEvent, jsEvent);
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
  console.log('Calendar.simulateClick(e): ', e);
  if (e.keyCode === 13) {
    $(e.target).trigger('click');
  }
};

Calendar.prototype.managePopoverControl = function(e) {
  console.log('Calendar.managePopoverControl(e): ', e);
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
