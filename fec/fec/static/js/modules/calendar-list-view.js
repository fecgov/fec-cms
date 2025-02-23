/* eslint-disable */ // TODO: remove eslint-disable
/**
 * @fileoverview Plugin for fullcalendar.io being used by ./calendar.js
 * @license CC0-1.0
 * @owner fec.gov
 * @version 2.0
 */

import { createPlugin, sliceEvents } from '@fullcalendar/core';

import { dateTimeFormatOptions, getDownloadUrl, getGoogleUrl, getMs365Url } from '../modules/calendar-helpers.js';

import Dropdown from './dropdowns.js';
import { default as template_events } from '../templates/calendar/events.hbs';
import { default as template_listToggles } from '../templates/calendar/listToggles.hbs';

// 'Sort by: Category' view
// Property name is the category
// Then followed by a list of the types of events under that category
// List items are the first token of the event category parameter from the API
// example: 'ie' for 'IE Periods'

/** */
const customClassName = 'fec-list-view';
const LIST_SORT = ['monthTime', 'monthCategory'];

/** @enum {string[]} */
const categories_lookup = {
  Elections: ['election'],
  'Filing deadlines': ['reporting', 'pre'],
  'Reporting and compliance periods': ['ie', 'ec', 'fea'],
  Outreach: ['roundtables', 'conferences'],
  Meetings: ['open', 'executive'],
  Rules: ['aos'],
  Other: ['other']
};

/**
 * Similar to categories_lookup but flipped so every value there is a key here.
 * e.g. {Meetings: ['open', 'executive']} in categories_lookup would be {open: 'Meetings', executive: 'Meetings']} here
 * @enum {string[]}
 */
const categories_reverseLookup = Object.getOwnPropertyNames(categories_lookup).reduce((accumulator, key) => {
  categories_lookup[key].forEach(val => {
    accumulator[val] = key;
  })
  return accumulator;
}, {});

/**
 * Group the events by category,<br />
 * otherwise events with no recognized category will be group at the top as Unknown.
 * @param {Object[]} events - Array of Objects with event details
 * @param {string} [start] - ISO-formatted date string
 * @param {string} [end] - ISO-formatted date string
 * @returns {Object[]} An array of objects groups of events like [{title: 'Filing deadlines', datetime_string: '', events: [{}]}, …]
 */
const categoryGroups = function(events, start, end) {
  const filteredEvents = [...events];//.filter(event => (event.range.start && event.range.start < end));

  filteredEvents.forEach(event => {
    // When does the event start?
    const eventStartDate = new Date(event.range.start);
    // Adjust for the time offset // TODO: this may need to be done elsewhere, too
    eventStartDate.setMinutes(eventStartDate.getMinutes() + eventStartDate.getTimezoneOffset());
    event.groupByLabel = categories_reverseLookup[event.def.extendedProps.category];
    event.datetime = eventStartDate.toISOString().substring(0,10); // used inside <time datetime=""></time>
  });

  // Sort them by date
  filteredEvents.sort((a, b) => {
    if (a.range.start == b.range.start) return 0;
    else return a.range.start < b.range.start ? -1 : 1;
  });

  const toReturn = [];
  let nextGroup = {title: '', datetime_string: '', events: []};
  // For each pretty category name
  Object.getOwnPropertyNames(categories_lookup).forEach(key => {
    // The events with this pretty category name
    const eventsInThisCat = filteredEvents.filter(event => {
      const lowerFirstWordOfCategory = event.def.extendedProps.category.split(/[ -]+/)[0].toLowerCase();
      return key == categories_reverseLookup[lowerFirstWordOfCategory];
    });

    // To account for any events that aren't in designated categories,
    // let's remove each of these chosen events from filteredEvents
    eventsInThisCat.forEach(event => {
      filteredEvents.splice(filteredEvents.indexOf(event), 1);
    });

    // If there are events, create a new group
    if (eventsInThisCat.length > 0) {
      nextGroup = {title: key, datetime_string: '', events: [...eventsInThisCat]};
      toReturn.push(nextGroup);
    }
  });

  // If there are filteredEvents left, they didn't get a category, so…
  if (filteredEvents.length > 0) {
    nextGroup = {title: 'Unknown category', datetime_string: '', events: [...filteredEvents]};
    // …let's put them at the top of the list
    toReturn.unshift(nextGroup);
  }

  return toReturn;
};

/**
 * Group the events by the formatted value of their start dates,
 * @param {Object[]} events - Array of Objects with event details
 * @param {string} [start] - ISO-formatted date string
 * @param {string} [end] - ISO-formatted date string
 * @returns {Object[]} An array of objects groups of events like [{title: 'January 1, 1970', datetime_string: '1970-01-01', events: [{}]}, …]
 */
const chronologicalGroups = function(events, start, end) {
  const filteredEvents = [...events];//events.filter(event => (event.range.start && event.range.start < end));

  // Go through every event and add its eventStartTime, the string like January 1, 1970
  filteredEvents.forEach(event => {
    console.log('chronologicalGroups.forEach()');
    console.log('  event: ', event);
    const thisEventObj = calendar.getEventById(event.def.publicId);
    console.log('  thisEventObj: ', thisEventObj);
    console.log('    .id: ', thisEventObj.id);
    console.log('    .start: ', thisEventObj.start);
    console.log('    .end: ', thisEventObj.end);
    console.log('    .startStr: ', thisEventObj.startStr);
    console.log('    .endStr: ', thisEventObj.endStr);
    console.log('    .extendedProps: ', thisEventObj.extendedProps);
    
    // When does the event start?
    const eventStartDate = new Date(event.range.start);
    console.log('    eventStartDate: ', eventStartDate);
    console.log('    typeof, start, eventStartDate: ', typeof thisEventObj.start, typeof eventStartDate);
    console.log('    typeof, start, eventStartDate: ', Date.parse(thisEventObj.start), Date.parse(eventStartDate));
    // Adjust for the time offset // TODO: this may need to be done elsewhere, too
    eventStartDate.setMinutes(eventStartDate.getMinutes() + eventStartDate.getTimezoneOffset());
    event.groupByLabel = eventStartDate.toLocaleDateString('en-US', dateTimeFormatOptions.DATE_FULL);
    event.datetime = eventStartDate.toISOString().substring(0,10); // used inside <time datetime=""></time>
  });

  filteredEvents.sort((a, b) => {
    if (a.range.start == b.range.start) return 0;
    else return a.range.start < b.range.start ? -1 : 1;
  });

  const toReturn = [];
  let prevGroupTitle = '';
  let nextGroup = {title: '', datetime_string: '', events: []};
  filteredEvents.forEach(event => {
    // If the label has changed, we'll need to start a new group
    if (event.groupByLabel != prevGroupTitle) {
      // First, close out the previous group if it's not empty
      if (nextGroup.events.length > 0) toReturn.push(nextGroup);
      // Save this label
      prevGroupTitle = event.groupByLabel;
      // Start a new group
      nextGroup = {title: event.groupByLabel, datetime_string: event.datetime, events: []};
    }
    nextGroup.events.push(event);
  });
  toReturn.push(nextGroup);

  return toReturn;
};

/**
 * 
 * @param {*} view 
 */
const manageListToggles = function(listEventOrder) {
  const listTogglesSelector = '.cal-list__toggles';
  
  const headerToolbarCenter = document.querySelector('.fc-header-toolbar .fc-toolbar-center');

  let listToggles = document.querySelector('.cal-list__toggles');

  // If there's no listToggles, create it
  if (!listToggles) {
    listToggles = document.createElement('div');
    listToggles.classList.add(`${listTogglesSelector.substring(1)}`); // drop the period from the selector
    headerToolbarCenter.appendChild(listToggles);
  }

  listToggles.innerHTML = template_listToggles({listEventOrder: listEventOrder});

  // Activate the list buttons
  listToggles.querySelectorAll('.js-toggle-list-sort').forEach(button => {
    button.addEventListener('click', e => {
      // If we aren't already sorting like this
      if (!e.target.classList.contains('is-active')) {
        calendar.view.custom.listEventOrder = e.target.dataset.triggerSort;
        calendar.render();
      }
    });
  });

  if (!listEventOrder) listToggles.setAttribute('aria-hidden', true);
  else listToggles.removeAttribute('aria-hidden');

  // Highlight the "List" button on monthTime
  // if (view.name === 'monthCategory') {
  //   this.$calendar.find('.fc-monthTime-button').addClass('fc-state-active');
  // }
};

/**
 * Called from inside `content` after an animation frame.
 * `didMount` fires first, which doesn't do any good here.
 * `content` fires next but only returns the html for every calendar entry and the view and
 * doesn't actually create the elements.
 * TODO: as fullcalendar adds it for custom views, I'd like to move this to something like eventDidMount
 */
const initDropdowns = function() {
  const dropdownsToInit = document.querySelectorAll(`.${customClassName} .dropdown`);
  dropdownsToInit.forEach(el => {
    new Dropdown($(el), { checkboxes: false });
  });
};

const fecListViewConfig = {
  classNames: [customClassName],

  /**
   * Called when this view is created
   * @param {Object}      d
   * @param {Object}      d.dateProfile
   * @param {HTMLElement} d.el
   * @param {Object}      d.eventStore
   * @param {Object}      d.eventUiBases
   * @param {Function} [callback]
   */
  didMount: function(props, callback) {
    calendar.el.dataset.fecView = 'list';
  },
  willUnmount: function(e, e1) {
    manageListToggles(false);
    calendar.el.dataset.fecView = 'grid';
  },
  
  eventDidMount: function(e) {
    console.log('CustomViewConfig.eventDidMount(e): ', e);
  },
  
  /**
   * @param {Object} d 
   * @param {(Function)} callback
   * @returns {Object} {html: ''}
  */
  content: function(props) {   
    console.log('CustomViewConfig.content(props): ', props);

    const segs = sliceEvents(props, false);
    console.log('  segs: ', segs);
   
    if (!calendar.view.custom) calendar.view.custom = {};
    if (!calendar.view.custom.settings) calendar.view.custom.settings = {};
    if (!calendar.view.custom.listEventOrder) calendar.view.custom.listEventOrder = 'monthTime';

    if (LIST_SORT.includes(calendar.view.custom.listEventOrder))
      manageListToggles(calendar.view.custom.listEventOrder);

    const groups = calendar.view.custom.listEventOrder == 'monthCategory'
      ? categoryGroups(
        segs,
        props.dateProfile.currentRange.start,
        props.dateProfile.currentRange.end)
      : chronologicalGroups(
        segs,
        props.dateProfile.currentRange.start,
        props.dateProfile.currentRange.end);
      
    // Let's convert these events to something the template can use
    const groupsForTemplate = [];
    groups.forEach(group => {
      const newGroup = {title: group.title, datetime_string: group.datetime_string, events: []};
      // 
      group.events.forEach(event => {
        // Start with a new event, based on the incoming extendedProps
        console.log('  customview.forEach(event): ', event);
        const newEvent = Object.assign({},event.def.extendedProps);
        // Get the start and end Date objects (GMT)
        let start_date = new Date(event.range.start);
        let end_date = event.def.hasEnd ? new Date(event.range.end) : false;

        newEvent.start_google = 'YAY-start';
        newEvent.end_google = 'YAY-end';

        start_date.setMinutes(start_date.getMinutes() + start_date.getTimezoneOffset());
        newEvent.start_iso = start_date.toISOString();
        newEvent.start_day = start_date.toLocaleDateString('en-US', dateTimeFormatOptions.WEEKDAY_FULL);
        newEvent.start_date_string = start_date.toLocaleDateString('en-US', dateTimeFormatOptions.DATE_FULL);
        if (newEvent.hasStartTime)
          newEvent.start_time_string = start_date.toLocaleTimeString('en-US', dateTimeFormatOptions.TIME_SIMPLE)
            .toLowerCase().replace(' ', '');

        if (end_date) {
          end_date.setMinutes(end_date.getMinutes() + end_date.getTimezoneOffset());
          newEvent.end_iso = end_date.toISOString();
          newEvent.end_day = end_date.toLocaleDateString('en-US', dateTimeFormatOptions.WEEKDAY_FULL);
          newEvent.end_date_string = end_date.toLocaleDateString('en-US', dateTimeFormatOptions.DATE_FULL);
          if (newEvent.hasStartTime)
            newEvent.end_time_string = end_date.toLocaleTimeString('en-US', dateTimeFormatOptions.TIME_SIMPLE)
              .toLowerCase().replace(' ', '');
        }
        newEvent.download = getDownloadUrl(newEvent);
        newEvent.google = getGoogleUrl({
          start: new Date(event.range.start).toISOString(),
          end: newEvent.hasStartTime && event.range.end ? new Date(event.range.end).toISOString() : false,
          title: newEvent.title,
          summary: newEvent.description || newEvent.title
        });
        newEvent.ms365 = getMs365Url({
          start: new Date(event.range.start).toISOString(),
          end: newEvent.hasStartTime && event.range.end ? new Date(event.range.end).toISOString() : false,
          title: newEvent.title,
          summary: newEvent.description || newEvent.title
        });

        newGroup.events.push(newEvent);
      });
      groupsForTemplate.push(newGroup);
    });

    window.requestAnimationFrame(initDropdowns.bind(this));

    return { html: template_events({
      groups: groupsForTemplate, settings: {listEventOrder: calendar.view.custom.listEventOrder}
    }) };
    
    // TRYING TO ADD MOUSE EVENT LISTENERS TO DROPDOWNS
  },
  // dayHeaderContent: function(d, two) {}, // Doesn't do anything here
  // render: function(d) {} // Not valid here


  // Deprecated
  // setDate: function(date) {
  //   console.log('CustomViewConfig.setDate(props): ', props);
  //   const intervalUnit = this.options.duration.intervalUnit || this.intervalUnit;
  //   ViewRoot.prototype.setDate.call(this, date.startOf(intervalUnit));
  // },

  // Deprecated
  /*
  renderEvents: function(events) {
    console.log('CustomViewConfig.renderEvents(events): ', events);
    const groups = this.options.categories
      ? categoryGroups(events, this.start, this.end)
      : chronologicalGroups(events, this.start, this.end);
    const settings = {
      duration: this.options.duration.intervalUnit,
      sortBy: this.options.sortBy
    };

    this.el.html(template_events({ groups: groups, settings: settings }));
    this.dropdowns = $(this.el.html)
      .find('.dropdown')
      .map(function(idx, elm) {
        return new Dropdown($(elm), { checkboxes: false });
      });
  },*/

  // Deprecated
  /*
  unrenderEvents: function() {
    console.log('CustomViewConfig.unrenderEvents(props): ', props);
    this.dropdowns.each(function(idx, dropdown) {
      dropdown.destroy();
    });
    this.el.html('');
  }*/
};







export default createPlugin({
  views: {
    fecList: fecListViewConfig
  }
});
