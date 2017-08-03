'use strict';

var $ = require('jquery');
var calendarHelpers = require('./calendar-helpers');
var moment = require('moment');

var today = new Date();
var day = today.getDate();
var month = today.getMonth() + 1;
var year = today.getFullYear();
var todaysDate = year + '-' + month + '-' + day;

var eventsTemplate = require('../hbs/homepage/events-and-deadlines.hbs');

var updates = {
  '.js-next-commission-meeting': ['Executive+Sessions', 'Open+Meetings', 'Public+Hearings'],
  '.js-next-filing-deadline': ['report+E', 'report-M', 'report-MY', 'report-Q', 'report-YE'],
  '.js-next-training-or-conference': ['Conferences', 'Roundtables'],
  '.js-next-public-comment-deadline': ['AOs+and+Rules']
};

// Home Page: Events and deadlines
function HomepageEvents() {
  $.each(updates, function(eventClass, eventCategories) {
    var url = calendarHelpers.getUrl('calendar-dates',
      { 'sort': 'start_date',
        'min_start_date': todaysDate,
        'category': eventCategories
      });

    $.getJSON(url).done(function(events) {
      var event = events.results[0];
      var startDate = '';

      if (typeof event !== 'undefined') {
        startDate = moment(event.start_date).format('MMMM D');
      }
      else {
        event = '';
      }

      $(eventClass).html(eventsTemplate({
        startDate: startDate,
        url: event.url,
        summary: event.summary
      }));
    });
  });
}

module.exports = {
  HomepageEvents: HomepageEvents
};
