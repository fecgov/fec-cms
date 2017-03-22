'use strict';

var $ = require('jquery');
var calendarHelpers = require('./calendar-helpers');
var moment = require('moment');

var today = new Date();
var day = today.getDate();
var month = today.getMonth() + 1;
var year = today.getFullYear();
var todaysDate = year + '-' + month + '-' + day;

function UpcomingEvents() {
  var url = calendarHelpers.getUrl('calendar-dates',
    { 'sort': 'start_date',
      'min_start_date': todaysDate,
      'category': ['report-M', 'report-Q', 'Open+Meetings', 'Executive+Sessions', 'Public+Hearings', 'Conferences', 'Roundtables']
    });

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

      $('.js-homepage-upcoming-events').append(
          '<li class="grid__item t-sans"><span class="t-bold">' +
            startDateMonth + ' ' + startDateDay +
          '</span>: ' + eventSummary + '</li>'
      );

      return i < 3;
    });
  });
}

function UpcomingDeadlines() {
  var url = calendarHelpers.getUrl('calendar-dates',
    { 'sort': 'start_date',
      'min_start_date': todaysDate,
      'category': ['report-M', 'report-Q', 'report-E']
    });

  $.getJSON(url).done(function(events) {
    var upcomingDeadline = events.results[0];

    var startDate = moment(upcomingDeadline.start_date);
    var startDateMonth = startDate.format('MMMM');
    var startDateDay = startDate.format('D');
    var eventSummary = '';

    if (upcomingDeadline.url) {
      eventSummary = '<a href="' + upcomingDeadline.url + '">' + upcomingDeadline.summary + '</a>';
    }
    else {
      eventSummary = upcomingDeadline.summary;
    }

    $('.js-homepage-upcoming-deadlines').append(
        startDateMonth + ' ' + startDateDay + ':' +
        '<br>' + eventSummary
    );
  });
}

module.exports = {
  UpcomingEvents: UpcomingEvents,
  UpcomingDeadlines: UpcomingDeadlines
};
