'use strict';

var $ = require('jquery');
var _ = require('underscore');
var moment = require('moment');
require('fullcalendar');

var dropdown = require('../dropdowns');

var eventTemplate = require('../templates/calendar/events.hbs');

var FC = $.fullCalendar;
var View = FC.View;

var categories = {
  Elections: ['election'],
  'Reporting Deadlines': ['report'],
  'Reporting and compliance periods': ['ie', 'ec', 'fea'],
  Outreach: ['roundtables', 'conferences'],
  Meetings: ['open', 'executive'],
  Rules: ['aos'],
  Other: ['other']
};

var categoriesInverse = _.reduce(_.pairs(categories), function(memo, pair) {
  var key = pair[0];
  var values = pair[1];
  _.each(values, function(value) {
    memo[value] = key;
  });
  return memo;
}, {});

var categoryGroups = function(events, start, end) {
  return _.chain(events)
    .filter(function(event) {
      return start <= event.start && event.start < end;
    })
    .sortBy('start')
    .groupBy(function(event) {
      var category = event.category ? event.category.split(/[ -]+/)[0].toLowerCase() : null;
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
  events = _.chain(events)
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
    var groups = this.options.categories ?
      categoryGroups(events, this.start, this.end) :
      chronologicalGroups(events, this.start, this.end);
    var settings = {
      duration: this.options.duration.intervalUnit,
      sortBy: this.options.sortBy
    };
    this.el.html(eventTemplate({groups: groups, settings: settings}));
    this.dropdowns = $(this.el.html).find('.dropdown').map(function(idx, elm) {
      return new dropdown.Dropdown($(elm), {checkboxes: false});
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
