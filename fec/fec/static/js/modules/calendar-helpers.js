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
 * @enum {Object} - Returns an object with settings for various datetime formats. 
 * For dates, use .toLocaleDateString('en-US', {}), for time use .toLocaleTimeString('en-US', {});
 * Converts all dates to U.S. Eastern (i.e. 'America/New_York')
 * For ISO dates (i.e. 1970-01-01), use only .toISOString();
 * @see https://moment.github.io/luxon/#/formatting?id=presets
 */
export const dateTimeFormatOptions = {
  /** @example '1/1/1970' (This is the default for en-US) */
  DATE_SHORT: {},

  /** @example '01/01/1970' */
  DATE_SHORT_01: { month: '2-digit', day: '2-digit', year: 'numeric' },

  /** @example 'January 1, 1970' */
  DATE_FULL: { month: 'long', day: 'numeric', year: 'numeric' },

  /** @example 'January 01, 1970' */
  DATE_FULL_01: { month: 'long', day: '2-digit', year: 'numeric' },

  /** @example 'January 1 */
  DATE_FULL_MONTH_DAY: { month: 'long', day: '2-digit' },

  /** @example 'Wednesday' */
  WEEKDAY_FULL: { weekday: 'long' },

  /** @example '1:30 PM' */
  TIME_SIMPLE: { hour: "numeric", minute: "2-digit" },

  /** @example '13:30' */
  TIME_24_SIMPLE: {},
};

/**
 * @param {Object} event - {start: '', end: '', title: '', summary: ''}
 * @param {string} event.start
 * @param {string} [event.end]
 * @param {string} [event.title]
 * @param {string} [event.summary]
 * @returns {string}
 */
export function getGoogleUrl(event) {
  console.log('getGoogleUrl(event): ', event);
  let datesString;

  if (event.end) {
    datesString = `${convertDateForGoogle(event.start, true)}/${convertDateForGoogle(event.end, true)}`;

  } else {
    const startDateObj = new Date(event.start);
    startDateObj.setHours(startDateObj.getHours() + 24);
    const fakeEndDate = startDateObj.toISOString();
    const startEndComboString = `${convertDateForGoogle(event.start, false).substring(0,10)}/${convertDateForGoogle(fakeEndDate, false)}`;
    datesString = startEndComboString;
  }

  const toReturn = 
  URI('https://calendar.google.com/calendar/render')
    .addQuery({
      action: 'TEMPLATE',
      text: event.title,
      details: event.summary,
      dates: datesString
    })
    .toString();

  console.log('  toReturn: ', toReturn);

  return toReturn;
}

export function getMs365Url(event) {
  console.log('getMs365Url(event): ', event);
  let datesString;

  if (event.end) {
    datesString = `${convertDateForGoogle(event.start, true)}/${convertDateForGoogle(event.end, true)}`;

  } else {
    const startDateObj = new Date(event.start);
    startDateObj.setHours(startDateObj.getHours() + 24);
    const fakeEndDate = startDateObj.toISOString();
    const startEndComboString = `${convertDateForGoogle(event.start, false).substring(0,10)}/${convertDateForGoogle(fakeEndDate, false)}`;
    datesString = startEndComboString;
  }

  const toReturn = 
  URI('https://outlook.office.com/calendar/0/deeplink/compose')
    .addQuery({
      allday: true,
      body: event.summary,
      enddt: '2025-01-31',
      location: '',
      // path: '',
      // rru: '',
      startdt: '2025-01-30',
      subject: event.title
      // action: 'TEMPLATE',
      // text: event.title,
      // details: event.summary,
      // dates: datesString
    })
    .toString();
  console.log('  toReturn: ', toReturn);

  return toReturn;
}

/**
 * Takes a Date object, removes the dashes and colon
 * @param {string} input -sdf
 * @param {boolean} [includeTime=true] - Whether the returned string should be 200012311945 or 20001231
 * @returns {string}
 */
function convertDateForGoogle(input, includeTime = true) {
  // const passedDate = new Date(input);
  const toReturn = input.replaceAll(/[-:.]/g, '');
  return includeTime ? toReturn : toReturn.substring(0, 7);
}

/**
 * @param {Object} event - {start: '', end: '', title: '', summary: ''}
 * @param {Moment} [event.start]
 * @param {Moment} [event.end]
 * @param {string} [event.title]
 * @param {string} [event.summary]
 * @returns {string}
 */
export function getGoogleUrl_moment(event) {
  let fmt, dates;
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
// export function calendarDownload(path, params) {
export function getDownloadUrl(path, params) {
  console.log('getDownloadUrl(path, params): ', path, params);
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

/**
 * Builds a URL from the parameters provided plus API_LOCATION and API_VERSION
 * @param {string[]} path - An array of strings to be combined to build the path. ex: ['data', 'path'] will become 'data/path'
 * @param {Object} params - Key/value pairs to add after the ? in the full URL
 * @param {string} [type] - Adds the public key or, if 'sub', uses the calendar public key
 * @returns {string}
 */
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
