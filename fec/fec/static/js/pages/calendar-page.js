/**
 * For the calendar page,
 * - initializes the filterPanel
 * - initializes the tagList
 * - initializes the Calendar (Calendar is the FEC implementation of @fullcalendar/core)
 */
import { getUrl } from '../modules/calendar-helpers.js';
import Calendar from '../modules/calendar.js';
import FilterPanel from '../modules/filters/filter-panel.js';
import TagList from '../modules/filters/filter-tags.js';

// Initialize filters
const filterPanel = new FilterPanel();

// Initialize filter tags
const tagList = new TagList({
  resultType: 'events',
  emptyText: 'all events'
});

$('.js-filter-tags').prepend(tagList.$body);

// Initialize calendar
new Calendar({
  filterPanel: filterPanel,
  tagList: tagList,
  selector: '#calendar',
  selector_download: '#calendar-download',
  selector_subscribe: '#calendar-subscribe',
  url_api: getUrl(['calendar-dates']),
  url_export: getUrl(['calendar-dates', 'export']),
  url_subscribe: getUrl(['calendar-dates', 'export'], '', ['sub'])
});
