import { default as moment } from 'moment';

import { getUrl } from './calendar-helpers.js';
// const eventsTemplate = require('../templates/homepage/events-and-deadlines.hbs');
import { default as eventsTemplate } from '../templates/homepage/events-and-deadlines.hbs';

const today = new Date();
const day = today.getDate();
const month = today.getMonth() + 1;
const year = today.getFullYear();
const todaysDate = year + '-' + month + '-' + day;

// These values come from constants.py
// and need to match API parameter `calendar_category_id`

const updates = {
  '.js-next-commission-meeting': ['32', '40'],
  '.js-next-filing-deadline': ['21', '25', '26', '27'],
  '.js-next-training-or-conference': ['33', '34'],
  '.js-next-public-comment-deadline': ['23']
};

// Home Page: Events and deadlines
export default function HomepageEvents() {
  $.each(updates, function(eventClass, eventCategories) {
    const url = getUrl('calendar-dates', {
      sort: 'start_date',
      min_start_date: todaysDate,
      calendar_category_id: eventCategories
    });

    $.getJSON(url).done(function(events) {
      let event = events.results[0];
      let startDate = '';

      if (events.results.length > 1) {
        event = events.results[0];
        const min_date = event.start_date;

        // Filters events by location 'FEC'
        // and checks if the minimum date is equal to the returned start date
        const filtered = events.results.filter(function(event) {
          return event.location == 'FEC' && event.start_date == min_date;
        });

        // Display the location 'FEC' events first,
        // Otherwise, there's no FEC events and get the first one in the list
        if (filtered.length > 0) {
          event = filtered[0];
        }
      }

      if (typeof event !== 'undefined') {
        startDate = moment(event.start_date).format('MMMM D');
      } else {
        event = '';
      }

      $(eventClass).html(
        eventsTemplate({
          startDate: startDate,
          url: event.url,
          summary: event.summary
        })
      );
    });
  });
}
