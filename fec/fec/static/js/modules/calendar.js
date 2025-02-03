/* eslint-disable */ // TODO: remove eslint-disable
/**
 * @fileoverview Using fullcalendar.io, builds and runs the various views for the fec.gov calendar pages
 * @license CC0-1.0
 * @owner fec.gov
 * @version 2.0
 */

import bootstrap5Plugin from '@fullcalendar/bootstrap5'; // Being included because fullcalendar requires a themesystem and the default is too bossy
import { Calendar as FullCalendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
// import { default as Handlebars } from 'hbsfy/runtime.js';
import $ from 'jquery';
import { default as _isEqual } from 'underscore/modules/isEqual.js';
import { default as URI } from 'urijs';
import { checkStartTime, dateTimeFormatOptions, getGoogleUrl, getDownloadUrl, getMs365Url, mapCategoryDescription } from './calendar-helpers.js';
import { default as FecListViewPlugin } from './calendar-list-view.js';
import { CalendarTooltip } from './calendar-tooltip.js';
import Dropdown from './dropdowns.js';
import { LOADING_DELAY, SUCCESS_DELAY, isLargeScreen } from './helpers.js';
import { pushQuery, updateQuery } from './urls.js';
import { default as template_details } from '../templates/calendar/details.hbs';
import { default as template_download } from '../templates/calendar/download.hbs';
import { default as template_subscribe } from '../templates/calendar/subscribe.hbs';

/** @enum {html} */
const templates = {
  details: template_details,
  download: template_download,
  subscribe: template_subscribe,
};

// Moved to the plugin
// const FEC_LIST_SORT = ['monthTime', 'monthCategory'];

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
  console.log('new Calendar(opts): ', opts);
  this.opts = Object.assign({}, this.defaultOpts(), opts);

  this.calendarEl = document.querySelector(this.opts.selector);
  this.headEl = document.querySelector('.data-container__head');
  this.calendar = new FullCalendar(this.calendarEl, this.opts.calendarOpts);
  window.calendar = this.calendar;
  this.url_api = URI(this.opts.url_api);
  this.url_subscribe = URI(this.opts.url_subscribe);
  console.log('this.url_subscribe: ', this.url_subscribe);
  this.url_export = URI(this.opts.url_export);
  this.filterPanel = this.opts.filterPanel;
  this.filterSet = this.filterPanel.filterSet;
  this.tagList = this.opts.tagList;

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

  this.buildTagsForInitialFilters();
  
  // if (queryParams.search)
  //   

  this.filterPanel.$form.on('change', this.handleFilterChange.bind(this));
  // this.filterPanel.$form.addEventListener('change', this.handleFilterChange.bind(this));
  $(window).on('popstate', this.handleFilterChange.bind(this));
  // window.addEventListener('popstate', this.handleFilterChange.bind(this));

  updateQuery(this.filterSet.serialize(), this.filterSet.fields);

  this.handleFilterChange();

  if (!isLargeScreen()) {
    // this.$head.after($('#filters'));
    this.headEl.insertAdjacentElement('afterend', document.querySelector('#filters'));
  }

  // Make it exist
  // this.calendar.render();

  this.styleButtons();
}

Calendar.prototype.toggleListView = function(e) {
  // console.log('Calendar.toggleListView(e): ', e);
  // const newView = $(e.target).data('trigger-view');
  const newView = e.target.dataset.triggerView;
  // this.$calendar.fullCalendar('changeView', newView);
  this.calendar.changeView(newView);
};

/**
 * TODO: TEST HOW DATES DISPLAY FOR COMPUTERS IN OTHER TIME ZONES
 */
Calendar.prototype.defaultOpts = function() {
  return {
    calendarOpts: {
      timeZone: 'America/New_York', // or 'UTC'? 'GMT'?
      headerToolbar: {
        left: 'prev,next,today',
        center: '', // this is where we'll put the list toggles
        right: 'fecList,dayGridMonth', // fecList is custom, dayGridMonth comes from @fullcalendar/daygrid
      },
      buttonIcons: false, // The icons fc should put on buttons
      buttonText: { // The text labels for buttons
        today: 'This Month',
        // next: '',
        // prev: ''
        // week: 'Week YAY'
      },
      // contentHeight: 'auto',
      // dayRender: this.handleDayRender.bind(this), // Not valid here
      // dayPopoverFormat: 'MMMM D, YYYY',
      initialView: 'fecList',//'listMonth'
      themeSystem: 'bootstrap5', // of the three choices, bootstrap5 is the lowest impact
      // eventRender: this.handleEventRender.bind(this), // Not valid here
      // eventAfterAllRender: this.handleRender.bind(this), // Not valid here
      // eventClick: this.handleEventClick.bind(this), // TODO: What does this do?
      // success: this.success.bind(this), // Not valid here
      // failure: this.failure.bind(this), // Not valid here
      datesSet: this.handleCalendarDatesSet.bind(this), // TODO: Is this doing anything here?
      // eventLimit: true, // Not valid here
      nowIndicator: true,
      plugins: [dayGridPlugin, /*timeGridPlugin, listPlugin,*/ bootstrap5Plugin, FecListViewPlugin],
      views: {
        // dayGridMonth: {},
        // timeGridWeek: {},
        // dayGrid: {},
        // timeGrid: {},
        // week: {},
        // day: {}
        // agenda: {
        //   scrollTime: '09:00:00',
        //   minTime: '08:00:00',
        //   maxTime: '20:00:00'
        // },
        month: {
          type: 'grid',
          dayMaxEvents: 3,
          buttonText: 'Grid',
          editable: false,
          eventClassNames: function(info) { return ['FEC-EVENT']},
          duration: { months: 1, intervalUnit: 'month' },
          // render: function(arg) {}, // Not valid here
          // onRender: function(arg) {}, // Not valid here
          // noEventsDidMount: function(info) {}, // Not valid here
          // eventContent: function(info) {
            // If this exists, it's called instead of Calendar.eventContent()
            // If this doesn't return anything, events will be put onto the page but will have aria-hidden="true"
            // return {html: ''};
          // },
          // dayHeaderContent: function(d) {
            // The row of "Sun", "Mon", etc
            // console.log('views.month.dayHeaderContent(d): ', d);
            // If this exists, it's called instead of Calendar.dayHeaderContent()
            // If this doesn't return anything, day headers will be put onto the page but will have aria-hidden="true"
            // return { html: `<div class="fc-cell-inner fc-flex-col fc-padding-sm">${d.text}</div>` };
          // },
          // dayHeaderDidMount: function(d) {
          //   console.log('views.month.dayHeaderDidMount(d): ', d);
          //   // If this exists, it's called instead of Calendar.dayHeaderContent()
          //   // If this doesn't return anything, day headers will be put onto the page but will have aria-hidden="true"
          //   return d;
          // },
          viewDidMount: function(arg) {
            console.log('month.view.viewDidMount(arg): ', arg);
            // For some reason, the dayHeader (Sun, Mon, etc) and dateHeader (1, 2, 3) are getting aria-hidden
            const hiddenElementsToShow = document.querySelectorAll(
              `.fc-daygrid-header .fc-cell-inner[aria-hidden="true"], .fc-daygrid-day-number[aria-hidden="true"]`
            );
            hiddenElementsToShow.forEach(el => {el.removeAttribute('aria-hidden')});
          },
          viewWillUnmount: function(arg) {
            console.log('views.month.viewWillUnmount(arg): ', arg);
          },
          eventClick: this.handleEventClick.bind(this),
          // eventMouseEnter: function(info) { info.jsEvent.preventDefault(); console.log('eventMouseEnter(info): ', info); },
          // eventMouseLeave: function(info) { info.jsEvent.preventDefault(); console.log('eventMouseLeave(info): ', info); },
          eventDidMount: function(event) {
            console.log('views.month.eventDidMount(event): ', event);
            // console.log('  event.event._context.getCurrentData(): ', event.event._context.getCurrentData());
          }
        },
        fecList: {
          type: 'list',
          buttonText: 'List',
          duration: { months: 1, intervalUnit: 'month' },
          // noEventsDidMount: function(info) {}, // Not valid here
          // dayHeaderContent: function(d) {}, // Overridden by FecListViewPlugin
          // eventContent: function(arg) {}, // Overridden by FecListViewPlugin
          // eventDataTransform: function(arg) {}, // Overridden by FecListViewPlugin
          // viewDidMount: function(arg) {}, // Overridden by FecListViewPlugin
          // viewWillUnmount: function(arg) {}, // Overridden by FecListViewPlugin
          //
          // onRender: function(arg) {}, // Not valid here
          // render: function(arg) {}, // Not valid here
          eventDidMount: function(event) {
            console.log('views.fecList.eventDidMount(event): ', event);
            // console.log('  event.event._context.getCurrentData(): ', event.event._context.getCurrentData());
          }
        }
      },
      // dayHeaderContent: function(d) {
        // This is called if views.month.dayHeaderContent doesn't exist but is never called for views.fecList
        // If this doesn't return anything, day headers will be put onto the page but will have aria-hidden="true"
        // return { html: `<time datetime="${d.date}" class="cal-list__title">${d.text}</time>` };
      // },
      // eventContent: function(arg) {
        // This is called if views.month.eventContent doesn't exist but is never called for views.fecList
        // If this doesn't return anything, events will be put onto the page but will have aria-hidden="true"
        // console.log('Calendar.eventContent(arg): ', arg);
      // },
      // render: function(arg) {}, // Not valid here
      // onRender: function(arg) {}, // Not valid here
    },
    sourceOpts: {
      startParam: 'min_start_date',
      endParam: 'max_start_date',
      initialDate: '2024-12-15',
      success: this.handleCalendarSuccess.bind(this),
      failure: this.handleCalendarFailure.bind(this),
      datesSet: this.handleCalendarDatesSet.bind(this), // TODO: is this doing anything here?
      eventDidMount: function(event) {
        console.log('sourceOpts.eventDidMount(event): ', event);
        // console.log('  event.event._context.getCurrentData(): ', event.event._context.getCurrentData());
      }
    }
  };
};

/**
 * Called on $form.change, but also on window.popstate and inside the Calendar constructor
 * @returns 
 */
Calendar.prototype.handleFilterChange = function() {
  // console.log('Calendar.handleFilterChange()');
  const params = this.filterSet.serialize();
  // A possible way to get rid of _isEqual for Objects is to use
  // new Set(Object.getOwnPropertyNames(o1)).intersection(new Set(Object.getOwnPropertyNames(o2)));
  // and
  // new Set(Object.values(o1)).intersection(new Set(Object.values(o2)));
  if (_isEqual(params, this.params)) {
    return;
  }
  const url_data = this.url_api
    .clone()
    .addQuery(params || {})
    .toString();

  // console.log('  url_data: ', url_data);
  pushQuery(this.filterSet.serialize(), this.filterSet.fields);
  // this.$calendar.fullCalendar('removeEventSource', this.eventSources);
  // if (this.eventSources) this.eventSources.remove();// TODO: do we need to remove them anymore?
  // this.eventSources = $.extend({}, this.opts.sourceOpts, { url: url });
  this.eventSources = Object.assign(
    {},
    this.opts.sourceOpts,
    {
      url: url_data,
    }
  );
  this.calendar.removeAllEventSources();
  this.calendar.addEventSource(this.eventSources);
  this.updateLinks(params);
  this.params = params;

  this.calendar.render();
};

/**
 * Called when the view or month changes
 * TODO: Do we still need this? is it doing anything—are startStr or endStr being used anywhere?
 * @param {Object} obj
 */
Calendar.prototype.handleCalendarDatesSet = function(obj) {
  console.log('Calendar.handleCalendarDatesSet(obj): ', obj);
  // obj.startStr = obj.startStr.slice(0,10);
  // obj.endStr = obj.endStr.slice(0,10);
};

// TODO: do this?
Calendar.prototype.handleCalendarFailure = function(arg) {
  console.log('Calendar.handleCalendarFailure(arg): ', arg);
};

/**
 * 
 * @param {Object} content
 * @param {Response} response
 * @returns 
 */
Calendar.prototype.handleCalendarSuccess = function(content, response) {
  console.log('Calendar.handleCalendarSuccess(content, response): ', content, response);
  const self = this;

  setTimeout(function() {
    const elements = document.querySelectorAll('.is-loading');
    elements.forEach(el => {
      el.classList.remove('is-loading');
      el.classList.add('is-successful');
    });
  }, LOADING_DELAY);

  setTimeout(function() {
    const elements = document.querySelectorAll('is-successful');
    elements.forEach(el => {
      el.classList.remove('is-successful');
    });
  }, SUCCESS_DELAY);

  self.handleCalendarRender(self.calendar.view);

  content.results = content.results.map(event => {
    return self.convertEventImplToVisualEvent(event);
  });

  return content.results;
};

Calendar.prototype.updateLinks = function(params) {
  console.log('Calendar.updateLinks(params): ', params);
  const url = this.url_export.clone().addQuery(params || {});
  const url_subscribe = this.url_subscribe.clone().addQuery(params || {});
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
          .protocol('webcal')
          .toString()
      ),
    calendar: url.protocol('webcal').toString(),
    subscribe: url_subscribe.protocol('webcal').toString(),

    subscribe_webcal: url_subscribe.protocol('webcal').toString(),
    subscribe_google:
      'https://calendar.google.com/calendar/render?cid=' +
      encodeURIComponent(
        url_subscribe
          .clone()
          .protocol('webcal')
          .toString()
      ),
    subscribe_ms365:
      // 'https://outlook.office.com/owa?path=%2Fcalendar%2Faction%2Fcompose&rru=addsubscription&name=FEC&url=' +
      'https://outlook.office.com/calendar/addfromweb?name=FEC&url=' +
      encodeURIComponent(
        url_subscribe
          .clone()
          // .setSearch('min_start_date', '01/01/2025')
          // .setSearch('per_page', 2)
          .protocol('webcal')
          .toString()
      ),
      
      // url_subscribe.protocol('webcal').toString(),
  };
  // this.$download.html(templates.download(urls));
  this.downloadEl.innerHTML = templates.download(urls);
  // this.$subscribe.html(templates.subscribe(urls));
  this.subscribeEl.innerHTML = templates.subscribe(urls);

  if (this.downloadButton) this.downloadButton.destroy();
  this.downloadButton = new Dropdown(this.opts.selector_download, { checkboxes: false });

  if (this.subscribeButton) this.subscribeButton.destroy();
  this.subscribeButton = new Dropdown(this.opts.selector_subscribe, { checkboxes: false });
};

/**
 * Adds the fec-specific class names to fc elements
 */
Calendar.prototype.styleButtons = function() {
  const baseClasses = ['button'];
  // document.querySelector('.fc-button').classList.add(...baseClasses);
  // document.querySelectorAll('.fc-button').forEach(el => { el.classList.add(...baseClasses) });
  // document.querySelector('.fc-toolbar-start .fc-today-button').classList.add('button', 'button--alt');
  // document.querySelector('.fc-toolbar-start .fc-next-button').classList.add(
  //   'button', 'button--next', 'button--standard');
  // document.querySelector('.fc-toolbar-start .fc-prev-button').classList.add(
  //   'button', 'button--previous', 'button--standard');
  // document.querySelector('.fc-toolbar-end .btn-group').classList.add('toggles--buttons');
  // document.querySelector('.fc-toolbar-end .fc-fecList-button').classList.add(
  //   'button', 'button--list', 'button--alt');
  // document.querySelector('.fc-toolbar-end .fc-dayGridMonth-button').classList.add('button', 'button--grid', 'button--alt');
};

/**
 * 
 * @param {ViewImpl} view
 * No other params
 */
Calendar.prototype.handleCalendarRender = function(view) {
  console.log('Calendar.handleCalendarRender(view, two): ', view);
  console.log('  calendar.view: ', calendar.view);

  $(document.body).trigger($.Event('calendar:rendered')); // TODO: do we need this? Is anything listening to it?


  // const viewButtonMonth = document.querySelector('.fc-dayGrid-button');
  // viewButtonMonth.dataset.triggerView = 'dayGridMonth';
  // viewButtonMonth.addEventListener('click', this.handleViewToggle.bind(this));

  // MOVED TO THE PLUGIN
  // if (FEC_LIST_SORT.includes(calendar.view.custom.sortBy)) {
  //   console.log('  if');
  //   this.manageListToggles(view);

  // } else if (this.$listToggles) {
  //   console.log('  else if');
  //   this.$listToggles.remove();
  //   this.$listToggles = null;
  // } else {
  //   console.log('  else');
  // }
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
 * @param {PointerEvent} e
 */
Calendar.prototype.handleViewToggle = function(e) {
  // console.log('Calendar.handleViewToggle(view): ', e);
  calendar.changeView(e.target.dataset.triggerView);
  e.target.classList.add('active');

  // const togglesHolder = document.querySelector('.fc-header-toolbar .fc-toolbar-center');

  // if (!this.$listToggles) {
  //   this.$listToggles = $('<div class="cal-list__toggles"></div>');
  //   this.$listToggles.appendTo(this.$calendar.find('.fc-toolbar-end .toggles--buttons'));
  // }
  // this.$listToggles.html(templates.listToggles(view.options));
  // // Highlight the "List" button on monthTime
  // if (view.name === 'monthCategory') {
  //   this.$calendar.find('.fc-monthTime-button').addClass('fc-state-active');
  // }
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

/**
 * 
 * @param {Object} eventObject
 * @param {HTMLElement} eventObject.el - The button element clicked (.fc-event)
 * @param {EventImpl} eventObject.event
 * @param {PointerEvent} eventObject.jsEvent
 * @param {ViewImpl} eventObject.view
 */
Calendar.prototype.handleEventClick = function(eventObject) {
  console.log('Calendar.handleEventClick(eventObject): ', eventObject);
  // eventObject.jsEvent.preventDefault();
  // eventObject.jsEvent.stopPropagation();

  const tooltipParentEl = eventObject.el.parentNode;
  console.log('tooltipParentEl: ', tooltipParentEl);
  
  
  let tooltip = tooltipParentEl.querySelector('.tooltip');
  console.log('  tooltip: ', tooltip);
  
  // If there's no tooltip,
  if (!tooltip || tooltip == null) {
    // build its content,

    tooltip = document.createElement('div');
    tooltip.setAttribute('class', 'tooltip tooltip--under cal-details');
    tooltip.setAttribute('id', this.detailsId);
    tooltip.setAttribute('role', 'tooltip');
    // <div class="" id="{{ detailsId }}" role="tooltip"></div>


    const eventDataObjForTemplate = this.convertEventImplToVisualEvent(eventObject.event._def.publicId);
    // eventDataObjForTemplate.detailsId = this.detailsId;
    console.log('  eventDataObjForTemplate: ', eventDataObjForTemplate);
    const popupDetailsContent = templates.details(eventDataObjForTemplate);

    // console.log('  going to create this tooltip: ', popupDetailsContent);
    // append the content,
    tooltip.innerHTML = popupDetailsContent;
    // and select the element again.
    // tooltip = tooltipParentEl.querySelector('.tooltip');
    eventObject.el.insertAdjacentElement('afterend', tooltip);

    // tooltip = null;
    // event
    // tooltip = document.createElement('div');
    // tooltipHolder.classList.add('tooltip-holder');
    // target.appendChild(tooltipHolder);
  }

  new CalendarTooltip(tooltip);
  tooltip = null;

  // NOW we can activate the tooltip for this event


  // const tooltip = new CalendarTooltip(
  //   ,
  //   target
  // );
  // target.appendChild(tooltip.$content);
  
  // const $target = $(jsEvent.target);
  // if (!$target.closest('.tooltip').length) {
  //   const $eventContainer = $target.closest('.fc-event');
  //   const tooltip = new CalendarTooltip(
  //     templates.details(_extend({}, calEvent, { detailsId: this.detailsId })),

  //     $eventContainer
  //   );
  //   $eventContainer.append(tooltip.$content);
  // }
};

// Simulate clicks when hitting enter on certain full-calendar elements
Calendar.prototype.simulateClick = function(e) {
  console.log('Calendar.simulateClick(e): ', e);
  if (e.keyCode === 13) {
    $(e.target).trigger('click');
  }
};

/**
 *
 * @param {*} e 
 */
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

/**
 * Creates the original dataSources event, adds parameters as needed, and returns an object used to replace that 
 * initial element or used to send into hbs templates.
 * @param {(number|Object)} event - the number that comes in from dataSources or the value saved to publicId
 * @returns {Object} Data object to be used for events through the app and in hbs templates
 */
Calendar.prototype.convertEventImplToVisualEvent = function(event) {
  console.log('Calendar.convertEventImplToVisualEvent(event): ', event);

  let d = {};
  let toReturn = {};

  // If event is an object, we need to create it for the first time,
  if (typeof event == 'object') {
    d = event;

    toReturn = {
      allDay: d.all_day,
      category: d.category,
      className: '', // className(d),
      description: d.description || 'Event description',
      end: d.end_date ? d.end_date : null, // used by getGoogleUrl() // TODO: Do we need this if we're using GMT?
      end_google: d.end_date,
      event_id: d.event_id,
      display: 'block',
      hasStartTime: checkStartTime(d),
      id: d.event_id, // gets converted to publicId to be used with calendar.getEventById();
      location: d.location,
      start: d.start_date, // used by getGoogleUrl() // TODO: Do we need this if we're using GMT?
      start_google: d.start_date,
      state: d.state ? d.state.join(', ') : null,
      summary: d.summary || 'Event summary',
      title: d.summary || 'Event title',
      tooltipContent: mapCategoryDescription(d.category),
      url_details: d.url
    };

    // Adjusting the datetime here (from GMT to ET) doesn't seem to work

    toReturn.url_google = getGoogleUrl({
      start: 'START',
      end: 'END',
      title: 'TITLE',
      summary: 'SUMMARY'
    });
    toReturn.url_ms365 = getMs365Url({
      start: 'START',
      end: 'END',
      title: 'TITLE',
      summary: 'SUMMARY'
    });
    toReturn.url_download = getDownloadUrl(
      this.url_subscribe
        .clone()
        .addQuery({ event_id: d.event_id })
        .toString()
    );

  // But it's not an object, we need to find the calendar's event object to just use those values
  } else {
    d = calendar.getEventById(event);
    console.log('  d: ', d);
    toReturn = Object.assign(
      {},
      d._def.extendedProps,
      {
        allDay: d._def.allDay,
        className: d._def.className,
        hasEnd: d._def.hasEnd,
        // end: d._def.end_date ? d.end_date : null, // used by getGoogleUrl() // TODO: Do we need this if we're using GMT?
        id: d.event_id, // gets converted to publicId to be used with calendar.getEventById();
        publicId: d._def.publicId,
        range: d._instance.range,
        // start: d._def.start_date, // used by getGoogleUrl() // TODO: Do we need this if we're using GMT?
        title: d._def.title,
        // url_details: d._def.url,
      }
    );
    toReturn.url_google = getGoogleUrl({
      start: 'START2',
      end: 'END2',
      title: 'TITLE2',
      summary: 'SUMMARY2'
    });

    // Get the start and end Date objects (GMT)
    let start_date = new Date(toReturn.range.start);
    let end_date = toReturn.hasEnd ? new Date(toReturn.range.end) : false;

    start_date.setMinutes(start_date.getMinutes() + start_date.getTimezoneOffset());
    toReturn.start_dayMonthTime = start_date.toLocaleDateString('en-US', dateTimeFormatOptions.DATE_FULL_MONTH_DAY);
    toReturn.start_dayMonthTime += `, ${start_date.toLocaleTimeString('en-US', dateTimeFormatOptions.TIME_SIMPLE)}`;
    
    toReturn.start_iso = start_date.toISOString();
    // toReturn.start_day = start_date.toLocaleDateString('en-US', dateTimeFormatOptions.WEEKDAY_FULL);
    toReturn.start_date_string = start_date.toLocaleDateString('en-US', dateTimeFormatOptions.DATE_FULL);
    // if (toReturn.hasStartTime)
    //   toReturn.start_time = start_date.toLocaleTimeString('en-US', dateTimeFormatOptions.TIME_SIMPLE);

    if (end_date) {
      end_date.setMinutes(end_date.getMinutes() + end_date.getTimezoneOffset());
      toReturn.end_dayMonthTime = end_date.toLocaleDateString('en-US', dateTimeFormatOptions.DATE_FULL_MONTH_DAY);
      toReturn.end_dayMonthTime += `, ${end_date.toLocaleTimeString('en-US', dateTimeFormatOptions.TIME_SIMPLE)}`;
      toReturn.end_iso = end_date.toISOString();
    //   toReturn.end_dayMonth = end_date.toLocaleDateString('en-US', dateTimeFormatOptions.DATE_FULL_MONTH_DAY);

    //   toReturn.end_day = end_date.toLocaleDateString('en-US', dateTimeFormatOptions.WEEKDAY_FULL);
    //   toReturn.end_date_string = end_date.toLocaleDateString('en-US', dateTimeFormatOptions.DATE_FULL);
    //   if (toReturn.hasStartTime)
    //     toReturn.end_time = end_date.toLocaleTimeString('en-US', dateTimeFormatOptions.TIME_SIMPLE);
    }
  }
  console.log('  going to return: ', toReturn);
  return toReturn;
}

Calendar.prototype.buildTagsForInitialFilters = function() {
  const filterAndTagName = 'calendar_category_id';
  const selectedCategoryInputs = document.querySelectorAll(`#category-filters input[name="${filterAndTagName}"]:checked`);
  selectedCategoryInputs.forEach(input => {
    this.tagList.addTag(null, { key: input.value, name: filterAndTagName, value: input.labels[0].textContent });
  });
}
