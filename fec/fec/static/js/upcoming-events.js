'use strict';

var $ = require('jquery');
var calendarHelpers = require('./calendar-helpers');
var moment = require('moment');

function UpcomingEvents() {

  // set variable to today's date for homepage upcoming event filtering
  var today = new Date();
  var day = today.getDate();
  var month = today.getMonth() + 1;
  var year = today.getFullYear();
  var date = year + '-' + month + '-' + day;

  var url = calendarHelpers.getUrl('calendar-dates',
    { 'sort': 'start_date',
      'min_start_date': date,
      'category': ['report-M', 'report-Q', 'Open+Meetings', 'Executive+Sessions', 'Public+Hearings', 'Conferences', 'Roundtables']});

  $.getJSON(url).done(function(events) {

    $.each(events.results, function(i, event) {
      var startDate = moment(event.start_date);
      var startDateMonth = startDate.format('MMMM');
      var startDateDay = startDate.format('D');
      var eventSummary = '';

      if (event.url) {
        eventSummary = '<a href="' + event.url + '">' + event.summary + '</a>';
      }
      else {
        eventSummary = event.summary;
      }

      $('.js-homepage-upcoming-events').append('<li class="grid__item">' + startDateMonth + ' ' + startDateDay + ': ' + eventSummary + '</li>');

      return i < 3;
    });
  });
}

module.exports = {UpcomingEvents: UpcomingEvents};
