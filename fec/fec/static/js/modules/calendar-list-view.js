/* eslint-disable */
/**
 *
 */
// import $ from 'jquery';
import { createPlugin, sliceEvents, Calendar } from '@fullcalendar/core';
import listPlugin from '@fullcalendar/list';
// import { ViewRoot } from '@fullcalendar/common';
import { default as moment } from 'moment';
import { default as _chain } from 'underscore/modules/chain.js';
import { default as _each } from 'underscore/modules/each.js';
import { default as _pairs } from 'underscore/modules/pairs.js';
import { default as _reduce } from 'underscore/modules/reduce.js';

import Dropdown from './dropdowns.js';
import { default as eventTemplate } from '../templates/calendar/event.hbs';
import { default as eventsTemplate } from '../templates/calendar/events.hbs';

// const FC = $.fullCalendar;
// const View = FC.View;

// 'Sort by: Category' view
// Property name is the category
// Then followed by a list of the types of events under that category
// List items are the first token of the event category parameter from the API
// example: 'ie' for 'IE Periods'

/** @enum {string[]} */
const categories = {
  Elections: ['election'],
  'Filing deadlines': ['reporting', 'pre'],
  'Reporting and compliance periods': ['ie', 'ec', 'fea'],
  Outreach: ['roundtables', 'conferences'],
  Meetings: ['open', 'executive'],
  Rules: ['aos'],
  Other: ['other']
};

const categoriesInverse = _reduce(
  _pairs(categories),
  function(memo, pair) {
    const key = pair[0];
    const values = pair[1];
    _each(values, function(value) {
      memo[value] = key;
    });
    return memo;
  },
  {}
);

const categoryGroups = function(events, start, end) {
  return _chain(events)
    .filter(function(event) {
      return start <= event.start && event.start < end;
    })
    .sortBy('start')
    .groupBy(function(event) {
      const category = event.category
        ? event.category.split(/[ -]+/)[0].toLowerCase()
        : null;
      return categoriesInverse[category];
    })
    .map(function(values, key) {
      return {
        title: key,
        events: values
      };
    })
    .sortBy(function(group) {
      return Object.keys(categories).indexOf(group.title);
    })
    .value();
};

/**
 * Group the events by the formatted value of their start dates,
 * otherwise events with a time on their date will be grouped separately from those that just have a date
 * @param {Object[]} events - Array of Objects with event details
 * @param {Moment} start
 * @param {Moment} end
 * @returns {Object[]}
 */
const chronologicalGroups = function(events, start, end) {
  events = _chain(events)
    .filter(function(event) {
      return start <= event.start && event.start < end;
    })
    .map(function(value) {
      // Group the events by the formatted value of their start dates,
      // otherwise events with a time on their date will be grouped separately
      // from those that just have a date
      value.groupByValue = value.start.format('MMMM D, YYYY');
      return value;
    })
    .sortBy('start')
    .groupBy('groupByValue')
    .map(function(values, key) {
      return {
        title: moment.utc(new Date(key)).format('MMMM D, YYYY'),
        events: values
      };
    })
    .value();
  return events;
};

// const ListView = View.extend({
const customViewConfig = {
  classNames: ['fec-list-view'],//'fec-list-VIEW'],

  /**
   * @param {Object} d 
   * @param {Object} d 
   * @param {Function} (callback?)
   * @returns {Object} {html: ''}
   */
  content: function(props) {


    // TODO: NEXT STEPS
    Working on sending vars like settings from the config option into this plugin so the events.hbs template can use them


    console.log('CustomViewConfig.content(props): ', props);
    console.log('  this: ', this);
    // console.log('  self: ', self);
    // console.log('  self.window: ', self.window);
    console.log('  root self var: ', window.calendar.view.customProps);
    // console.log('  self.window.calendar: ', self.window.calendar);
    // console.log('  self.calendar.view: ', self.window.calendar.view);
    // let segs = sliceEvents(props, true);
    // console.log('  segs, true: ', segs);
    let segs = sliceEvents(props, false);
    console.log('  segs, false: ', segs);
    let html = '';

    // const groups = this.options.categories
    //   ? categoryGroups(events, this.start, this.end)
    //   : chronologicalGroups(events, this.start, this.end);
    // const settings = {
    //   duration: this.options.duration.intervalUnit,
    //   sortBy: this.options.sortBy
    // };

    const eventsObj = {
      sortyBy: 'as'
    };

    

    return { html: eventsTemplate({
      
    }) };
  },
  // render: function(d) {
  //   console.log('CustomViewConfig.render(d): ', d);
  // },
  /**
   * @param {Object} d
   * @param {Date} d.date
   * @param {ViewImpl} d.view
   * @returns {Object} `{html: '<time>${d.text}</time>'}`
   */
  dayHeaderContent: function(d, two) {
    console.log('CustomViewConfig.dayHeaderContent(d, two): ', d, two);
    return { html: `<time datetime="${d.date}" class="cal-list__title">${d.text}</time>` };
  },

  /**
   * 
   * @param {Object}      d
   * @param {Object}      d.dateProfile
   * @param {HTMLElement} d.el
   * @param {Object}      d.eventStore
   * @param {Object}      d.eventUiBases
   * @param {Function} [callback]
   */
  didMount: function(props, callback) {
    console.log('CustomViewConfig.didMount(props): ', props);
    self.window.calendar.view.customProps = {self: this};
    console.log('  this: ', this);
  },
  /*eventContent: function(arg) {
    console.log('CustomViewConfig.eventContent(arg): ', arg);
    let toReturn = '';

    const groups = this.options.categories
      ? categoryGroups(events, this.start, this.end)
      : chronologicalGroups(events, this.start, this.end);
    const settings = {
      duration: this.options.duration.intervalUnit,
      sortBy: this.options.sortBy
    };

    this.el.html(eventsTemplate({ groups: groups, settings: settings }));


    return {html: toReturn};
      // templates.details(
        // Object.assign({}, calEvent, { detailsId: this.detailsId })
        // {
          // detailsId: ,
          // category: ,
          // allDay: ,
          // summary: ,
          // location: ,
          // description: ,
          // detailUrl: ,
          // download: ,
          // google: ,
      //   }
      // )
    // };
  },*/
  


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

    this.el.html(eventsTemplate({ groups: groups, settings: settings }));
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


/**
 * 
 * @param {Object} d 
 * @returns {string}
 */
export function eventHtmlString(d) {
  console.log('calendar-list-view.eventHtmlString(d): ', d);
  return '<p>YES!</p>';
}




const CustomViewConfig = customViewConfig;


export default createPlugin({
  views: {
    custom: CustomViewConfig
  }
});
