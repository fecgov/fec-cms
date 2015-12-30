'use strict';

var moment = require('moment');
var Handlebars = require('hbsfy/runtime');

function datetime(value, options) {
  var hash = options.hash || {};
  var format = hash.pretty ? 'MMM D, YYYY' : 'MM-DD-YYYY';
  var parsed = moment(value, 'YYYY-MM-DDTHH:mm:ss');
  return parsed.isValid() ? parsed.format(format) : null;
}

Handlebars.registerHelper('datetime', datetime);

module.exports = {
  datetime: datetime
}
