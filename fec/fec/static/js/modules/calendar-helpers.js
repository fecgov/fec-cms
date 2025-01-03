/* eslint-disable */
/**
 *
 */
import moment from 'moment';
import { default as URI } from 'urijs';

function dateString(dateToParse, format, adjustmentHours) {
  const parsed = new Date(Date.parse(dateToParse));

  if (adjustmentHours) parsed.setHours(parsed.getHours() + adjustmentHours);

  let YYYY = parsed.getUTCFullYear();
  let MM = (parsed.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  let DD = (parsed.getUTCDate()).toString().padStart(2, '0');
  let hh = (parsed.getUTCHours()).toString().padStart(2, '0');
  let mm = (parsed.getUTCMinutes()).toString().padStart(2, '0');
  let ss = (parsed.getUTCSeconds()).toString().padStart(2, '0');

  if (format == 'YYYYMMDD')
    return `${YYYY}${MM}${DD}`;

  else if (format == 'YYYYMMDD[T]HHmmss')
    return `${YYYY}${MM}${DD}T${hh}${mm}${ss}`;

  return dateToParse;
}

/**
 * @param {Object} event - {start: '', end: '', title: '', summary: ''}
 * @param {Moment} [event.start]
 * @param {Moment} [event.end]
 * @param {string} [event.title]
 * @param {string} [event.summary]
 * @returns {string}
 */
export function getGoogleUrl(event) {
  let fmt, dates;
  // TODO: remove this .format check after Moment has been removed
  if (event.start.format) {
    // If we're dealing with a Moment date (i.e. it has a .format() )
    if (event.end) {
      fmt = 'YYYYMMDD[T]HHmmss';
      dates = event.start.format(fmt) + '/' + event.end.format(fmt);
    } else {
      fmt = 'YYYYMMDD';
      dates =
        event.start.format(fmt) +
        '/' +
        event.start
          .clone()
          .add(1, 'day')
          .format(fmt);
    }
  } else {
    // Otherwise, if we have a native date

    if (event.end) {
      dates = `${dateString(event.start, 'YYYYMMDD[T]HHmmss')}/${dateString(event.end, 'YYYYMMDD[T]HHmmss')}`;

    } else {
      dates = `${dateString(event.start, 'YYYYMMDD')}/${dateString(event.start, 'YYYYMMDD', 24)}`;
    }
  }
  return URI('https://calendar.google.com/calendar/render')
    .addQuery({
      action: 'TEMPLATE',
      text: event.title,
      details: event.summary,
      dates: dates
    })
    .toString();
}

/**
 * @param {string} path
 * @param {Object} params - key-value pairs on an Object
 * @returns {string} a string like '/v1/path/?param1key=param1val&param2key=param2val'
 */
export function calendarDownload(path, params) {
  const url = URI(window.API_LOCATION)
    .path(Array.prototype.concat(window.API_VERSION, path || [], '').join('/'))
    .addQuery({
      api_key: window.CALENDAR_DOWNLOAD_PUBLIC_API_KEY,
      per_page: 500
    })
    .addQuery(params || {})
    .toString();

  // Decode in order to preserve + signs
  return URI.decode(url);
}

export function getUrl(path, params, type) {
  //if 'type' arg is present and set to 'sub', use API_KEY_PUBLIC_CALENDAR as api_key, otherwise use API_KEY_PUBLIC;
  const apiKey =
    type == 'sub' ? window.API_KEY_PUBLIC_CALENDAR : window.API_KEY_PUBLIC;
  const url = URI(window.API_LOCATION)
    .path(Array.prototype.concat(window.API_VERSION, path || [], '').join('/'))
    .addQuery({
      api_key: apiKey,
      per_page: 500
    })
    .addQuery(params || {})
    .toString();
  return URI.decode(url);
}

/**
 * Returns a class name for multi-date events, i.e. those with valid but different start day and end day
 * @param {Object} event - Event object, looking at start_date and end_date
 * @returns {string} Returns a class name for multi-day events, else ''
 */
export function className(event) {
  const start = event.start_date ? moment(event.start_date).format('M D') : null;
  const end = event.end_date ? moment(event.end_date).format('M D') : null;
  if (end && start !== end) {
    return 'fc-multi-day';
  } else {
    return '';
  }
}

/**
 * Does event.start_date have an hour (vs only yyyy-mm-dd or null)
 * @param {Object} event
 * @returns {boolean} true if event.start_date has a legitimate hour included, otherwise false
 */
export function checkStartTime(event) {
  if (event.start_date) {
    return moment(event.start_date).hour() ? true : false;
  } else {
    return false;
  }
}

/**
 * Matches the category parameter from calendar date API
 * @param {string} category
 * @returns {string} String for the tooltip content for category
 */
export function mapCategoryDescription(category) {
  const tooltipContent = {
    'Reporting Deadlines':
      'Throughout the year, filers submit regularly scheduled reports about their campaign finance activity. These reporting requirements are outlined in Title 11 of the Code of Federal Regulations (CFR) and vary, depending on the type of filer.',
    'Election Dates':
      'Federal elections. These include primary, general and special elections as well as caucuses and conventions.',
    'EC Periods':
      'Electioneering communications are any broadcast, cable or satellite communication that:<ul class="list--bulleted"><li>Refer to a clearly identified candidate for federal office,</li><li>Are publicly distributed within certain time periods before an election, and</li><li>Are targeted to the relevant electorate. 11 CFR 100.29.</li></ul>',
    'IE Periods':
      'Independent expenditures are expenditures for a communication: <ul class="list--bulleted"><li>That expressly advocate the election or defeat of a clearly identified candidate and</li><li>That are not made in cooperation, consultation or concert with, or at the request or suggestion of, any candidate, or his or her authorized committees or agents, or a political party committee or its agents. 11 CFR 100.16.</li></ul>',
    'Executive Sessions':
      'Executive sessions are regular, closed meetings during which the Commission discusses pending enforcement actions, litigation and other matters that — by law — must be kept confidential.',
    'Open Meetings':
      'Open meetings are regular, public meetings during which the Commission adopts new regulations, issues advisory opinions, approves audit reports of political committees and takes other actions to administer the campaign finance law.',
    Roundtables:
      'Roundtables are training opportunities offered to FEC filers and those interested in learning about campaign finance law. These voluntary, online workshops focus on specific compliance topics. Register to access online materials and technical information.',
    'AOs and Rules':
      'The Commission follows these deadlines when issuing new guidance and rules. Advisory Opinions are official Commission responses about how to apply campaign finance regulations to specific, factual situations. The Commission writes rules and regulations and publishes them in the Federal Register.'
  };

  return tooltipContent[category];
}
