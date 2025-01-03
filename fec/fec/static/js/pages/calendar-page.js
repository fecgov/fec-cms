/* eslint-disable */
/**
 *
 */
import { Calendar as FullCalendar } from '@fullcalendar/core';

import { calendarDownload, getUrl } from '../modules/calendar-helpers.js';
import Calendar from '../modules/calendar.js';
import FilterPanel from '../modules/filters/filter-panel.js';
import TagList from '../modules/filters/filter-tags.js';

// Initialize filters
const filterPanel = new FilterPanel();

// Initialize filter tags
const $tagList = new TagList({
  resultType: 'events',
  emptyText: 'all events'
}).$body;

$('.js-filter-tags').prepend($tagList);

// Initialize calendar
new Calendar({
  selector: '#calendar',
  selector_download: '#calendar-download',
  selector_subscribe: '#calendar-subscribe',
  url: getUrl(['calendar-dates']),
  // url: '/static/calendar-dates.json',
  exportUrl: calendarDownload(['calendar-dates', 'export']),
  subscribeUrl: getUrl(['calendar-dates', 'export'], '', [
    'sub'
  ]),
  filterPanel: filterPanel,
  initialDate: '2024-12-15',
});
