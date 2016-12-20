'use strict';

var $ = require('jquery');

function Homepage(opts) {

  $.getJSON(opts.url).done(function(events) {

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

module.exports = {Homepage: Homepage};
