'use strict';

var URI = require('urijs');
var moment = require('moment');

function getGoogleUrl(event) {
  var fmt, dates;
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

function getUrl(path, params) {
  var url = URI(window.API_LOCATION)
    .path(Array.prototype.concat(window.API_VERSION, path || [], '').join('/'))
    .addQuery({
      api_key: window.API_KEY_PUBLIC,
      per_page: 500
    })
    .addQuery(params || {})
    .toString();

  // Decode in order to preserve + signs
  return URI.decode(url);
}

function className(event) {
  var start = event.start_date ? moment(event.start_date).format('M D') : null;
  var end = event.end_date ? moment(event.end_date).format('M D') : null;
  if (end && start !== end) {
    return 'fc-multi-day';
  } else {
    return '';
  }
}

function checkStartTime(event) {
  if (event.start_date) {
    return moment(event.start_date).hour() ? true : false;
  } else {
    return false;
  }
}

function mapCategoryDescription(category) {
  // matches the category parameter from calendar date API
  var tooltipContent = {
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

module.exports = {
  getGoogleUrl: getGoogleUrl,
  checkStartTime: checkStartTime,
  getUrl: getUrl,
  className: className,
  mapCategoryDescription: mapCategoryDescription
};
