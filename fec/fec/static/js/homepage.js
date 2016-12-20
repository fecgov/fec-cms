'use strict';

var $ = require('jquery');

function Homepage(opts) {

  $.getJSON(opts.url).done(function(events) {

    $.each(events.results, function(i, event) {
      $('.homepage-upcoming-events').append('<li>' + event.summary + '</li>');

      return i < 2;
    });
  });
}

module.exports = {Homepage: Homepage};
