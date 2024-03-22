/**
 * 
 */
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
  download: '#calendar-download',
  subscribe: '#calendar-subscribe',
  url: getUrl(['calendar-dates']),
  exportUrl: calendarDownload(['calendar-dates', 'export']),
  subscribeUrl: getUrl(['calendar-dates', 'export'], '', [
    'sub'
  ]),
  filterPanel: filterPanel
});
