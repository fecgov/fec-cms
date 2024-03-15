/**
 * 
 */
import { chain as _chain, each as _each, pairs as _pairs, reduce as _reduce } from 'underscore';
import { default as moment } from 'moment';
require('fullcalendar');

import { default as Dropdown } from './dropdowns.js';

import { default as eventTemplate } from '../templates/calendar/events.hbs';

var FC = $.fullCalendar;
var View = FC.View;

// 'Sort by: Category' view
// Property name is the category
// Then followed by a list of the types of events under that category
// List items are the first token of the event category parameter from the API
// example: 'ie' for 'IE Periods'
var categories = {
  Elections: ['election'],
  'Filing deadlines': ['reporting', 'pre'],
  'Reporting and compliance periods': ['ie', 'ec', 'fea'],
  Outreach: ['roundtables', 'conferences'],
  Meetings: ['open', 'executive'],
  Rules: ['aos'],
  Other: ['other']
};

var categoriesInverse = _reduce(
  _pairs(categories),
  function(memo, pair) {
    var key = pair[0];
    var values = pair[1];
    _each(values, function(value) {
      memo[value] = key;
    });
    return memo;
  },
  {}
);

var categoryGroups = function(events, start, end) {
  return _chain(events)
    .filter(function(event) {
      return start <= event.start && event.start < end;
    })
    .sortBy('start')
    .groupBy(function(event) {
      var category = event.category
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

var chronologicalGroups = function(events, start, end) {
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

var ListView = View.extend({
  setDate: function(date) {
    var intervalUnit = this.options.duration.intervalUnit || this.intervalUnit;
    View.prototype.setDate.call(this, date.startOf(intervalUnit));
  },

  renderEvents: function(events) {
    var groups = this.options.categories
      ? categoryGroups(events, this.start, this.end)
      : chronologicalGroups(events, this.start, this.end);
    var settings = {
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
