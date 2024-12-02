/**
 *
 */
import { Calendar } from '@fullcalendar/core';
// import $ from 'jquery';
import { default as moment } from 'moment';
import { default as _chain } from 'underscore/modules/chain.js';
import { default as _each } from 'underscore/modules/each.js';
import { default as _pairs } from 'underscore/modules/pairs.js';
import { default as _reduce } from 'underscore/modules/reduce.js';

import Dropdown from './dropdowns.js';
import { default as eventTemplate } from '../templates/calendar/events.hbs';

const FC = $.fullCalendar;
const View = FC.View;

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

const ListView = View.extend({
  setDate: function(date) {
    const intervalUnit = this.options.duration.intervalUnit || this.intervalUnit;
    View.prototype.setDate.call(this, date.startOf(intervalUnit));
  },

  renderEvents: function(events) {
    const groups = this.options.categories
      ? categoryGroups(events, this.start, this.end)
      : chronologicalGroups(events, this.start, this.end);
    const settings = {
      duration: this.options.duration.intervalUnit,
      sortBy: this.options.sortBy
    };

    this.el.html(eventTemplate({ groups: groups, settings: settings }));
    this.dropdowns = $(this.el.html)
      .find('.dropdown')
      .map(function(idx, elm) {
        return new Dropdown($(elm), { checkboxes: false });
      });
  },

  unrenderEvents: function() {
    this.dropdowns.each(function(idx, dropdown) {
      dropdown.destroy();
    });
    this.el.html('');
  }
});

FC.views.list = ListView;
