'use strict';

var URI = require('urijs');
var moment = require('moment');

var classMap = {
  aos: 'fc--rules',
  election: 'fc--election',
  report: 'fc--deadline',
  open: 'fc--meeting',
  executive: 'fc--meeting',
  roundtables: 'fc--outreach',
  conferences: 'fc--outreach',
  litigation: 'fc--other',
  fea: 'fc--other',
  ie: 'fc--deadline',
  ec: 'fc--deadline'
};

function getEventClass(event) {
  var className = '';
  var category = event.category ? event.category.split(/[ -]+/)[0] : null;
  className += moment.utc(event.start_date).format('HHmmss') === '000000' ? 'fc--allday' : '';
  className += category ? ' ' + classMap[category.toLowerCase()] : '';
  return className;
}

function getGoogleUrl(event) {
  var fmt, dates;
  if (event.end) {
    fmt = 'YYYYMMDD[T]HHmmss';
    dates = event.start.format(fmt) + '/' + event.end.format(fmt);
  } else {
    fmt = 'YYYYMMDD';
    dates = event.start.format(fmt) + '/' + event.start.clone().add(1, 'day').format(fmt);
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
  return URI(window.API_LOCATION)
    .path(Array.prototype.concat(window.API_VERSION, path || [], '').join('/'))
    .addQuery({
      api_key: window.API_KEY,
      per_page: 500
    })
    .addQuery(params || {})
    .toString();
}

module.exports = {
  getEventClass: getEventClass,
  getGoogleUrl: getGoogleUrl,
  getUrl: getUrl
}
