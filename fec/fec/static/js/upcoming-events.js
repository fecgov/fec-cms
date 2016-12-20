'use strict';

var $ = require('jquery');
var calendarHelpers = require('./calendar-helpers');

function upcomingEvents() {

  // set variable to today's date for homepage upcoming event filtering
  var today = new Date();
  var day = today.getDate();
  var month = today.getMonth() + 1;
  var year = today.getFullYear();
  var date = year + '-' + month + '-' + day;

  var url = calendarHelpers.getUrl('calendar-dates',
    { 'sort': 'start_date',
      'min_start_date': date,
      'category': ['report-M', 'report-Q', 'Open+Meetings', 'Executive+Sessions', 'Public+Hearings', 'Conferences', 'Roundtables']})

  $.getJSON(url).done(function(events) {

    $.each(events.results, function(i, event) {
      var locale = 'en-us';
      var startDate = new Date(event.start_date);
      var startDateMonth = startDate.toLocaleString(locale, { month: 'long'});
      var startDateDay = startDate.getDate();
      var eventSummary = '';

      if (event.url) {
        eventSummary = '<a href="' + event.url + '">' + event.summary + '</a>';
      }
      else {
        eventSummary = event.summary;
      }

      $('.homepage-upcoming-events').append('<li>' + startDateMonth + ' ' + startDateDay + ': ' + eventSummary + '</li>');

      return i < 2;
    });
  });
}

module.exports = {upcomingEvents: upcomingEvents};
