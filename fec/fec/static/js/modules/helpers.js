'use strict';

/* global Intl, BASE_PATH, API_LOCATION, API_VERSION, API_KEY */

var URI = require('urijs');
var $ = require('jquery');
var _ = require('underscore');
var moment = require('moment');
var decoders = require('./decoders');
var Handlebars = require('hbsfy/runtime');
var bleach = require('bleach');
var numeral = require('numeral');

// set parameters from the API
var API = {
  amendment_indicator_new: 'N',
  amendment_indicator_terminated: 'T',
  means_filed_e_file: 'e-file'
};

var BREAKPOINTS = {
  MEDIUM: 640,
  LARGE: 860
};

var LOADING_DELAY = 1500;
var SUCCESS_DELAY = 5000;

var formatMap = {
  default: 'MM/DD/YYYY',
  pretty: 'MMMM D, YYYY',
  time: 'h:mma',
  dateTime: 'MMMM D, h:mma',
  dayOfWeek: 'ddd',
  fullDayOfWeek: 'dddd'
};

function getWindowWidth() {
  // window.innerWidth accounts for scrollbars and should match the width used
  // for media queries.
  return window.innerWidth;
}

function isLargeScreen() {
  if (window.innerWidth >= BREAKPOINTS.LARGE) {
    return true;
  } else {
    return false;
  }
}

function isMediumScreen() {
  if (window.innerWidth >= BREAKPOINTS.MEDIUM) {
    return true;
  } else {
    return false;
  }
}

function datetime(value, options) {
  var hash = options.hash || {};
  var format = formatMap[hash.format || 'default'];
  var parsed = moment(value, 'YYYY-MM-DDTHH:mm:ss');
  return parsed.isValid() ? parsed.format(format) : null;
}

Handlebars.registerHelper('datetime', datetime);

var currencyFormatter = function(number) {
  return numeral(number).format('$0,0.00');
};

function currency(value) {
  if (!isNaN(parseInt(value))) {
    return currencyFormatter(value);
  } else {
    return '--';
  }
}
Handlebars.registerHelper('currency', currencyFormatter);

var numberFormatter = function(number) {
  return numeral(number).format('0,0');
};

Handlebars.registerHelper('formatNumber', numberFormatter);

Handlebars.registerHelper({
  eq: function (v1, v2) {
    return v1 === v2;
  },
  toUpperCase: function(value) {
    return value.substr(0,1).toUpperCase() + value.substr(1);
  }
});

var globals = {
  EARMARKED_CODE: '15E'
};

Handlebars.registerHelper('global', function(value) {
  return globals[value];
});

Handlebars.registerHelper('decodeAmendment', function(value) {
  return decoders.amendments[value];
});

Handlebars.registerHelper('decodeOffice', function(value) {
  return decoders.office[value];
});

Handlebars.registerHelper('decodeSupportOppose', function(value) {
  return decoders.supportOppose[value] || 'Unknown';
});

Handlebars.registerHelper('decodeForm', function(value) {
  return decoders.forms[value] || value;
});

Handlebars.registerHelper('decodeReport', function(value) {
  return decoders.reports[value] || value;
});

Handlebars.registerHelper('decodeState', function(value) {
  return decoders.states[value] || value;
});

Handlebars.registerHelper('decodeParty', function(value) {
  return decoders.parties[value] || value;
});

Handlebars.registerHelper('decodeMeans', function(value) {
  return decoders.means[value] || value;
});

Handlebars.registerHelper('formNumber', function(value) {
  // Strips the F from F3X etc.
  return value.split('F')[1];
});

Handlebars.registerHelper('basePath', BASE_PATH);

Handlebars.registerHelper('panelRow', function(label, options) {
  return new Handlebars.SafeString(
    '<tr>' +
      '<td class="panel__term">' + label + '</td>' +
      '<td class="panel__data">' + options.fn(this) + '</td>' +
    '</tr>'
  );
});

Handlebars.registerHelper('entityUrl', function(entity, options) {
  var query,
      id,
      url;
  if (options.hash.query) {
    query = {
      cycle: options.hash.query.cycle || null,
      election_full: options.hash.query.election_full || null
    };
  }
  id = entity.candidate_id || entity.committee_id;
  url = buildAppUrl([options.hash.type, id], query);
  return new Handlebars.SafeString(url);
});

Handlebars.registerHelper('electionUrl', function(year, options) {
  var url;
  var candidate = options.hash.parentContext;

  if (candidate.office === 'P') {
    url = buildAppUrl(['elections', 'president', year]);
  } else if (candidate.office === 'S') {
    url = buildAppUrl(['elections', 'senate', candidate.state, year]);
  } else if (candidate.office === 'H') {
    // Match election years with the election district
    var district = candidate.election_districts[options.hash.index];
    url = buildAppUrl(['elections', 'house', candidate.state, district, year]);
  }
  return new Handlebars.SafeString(url);
});

Handlebars.registerHelper('convertBoolean', function(bool) {
  if (bool) {
    return new Handlebars.SafeString('Yes');
  } else {
    return new Handlebars.SafeString('No');
  }
});

Handlebars.registerHelper('format_range', function(year) {
    var firstYear = Number(year) - 1;
    return new Handlebars.SafeString(firstYear.toString() + '–' + year.toString());
});

function formatCycleRange(year, duration) {
  var firstYear = Number(year) - duration + 1;
  return firstYear.toString() + '–' + year.toString();
}

function cycleDates(year) {
  return {
    min: '01-01-' + (year - 1),
    max: '12-31-' + year
  };
}

function ensureArray(value) {
  return _.isArray(value) ? value : [value];
}

function filterNull(params) {
  return _.chain(params)
    .pairs()
    .filter(function(pair) {
      return pair[1] !== '';
    })
    .object()
    .value();
}

function buildAppUrl(path, query) {
  return URI('')
    .path(Array.prototype.concat(BASE_PATH, path || [], '').join('/'))
    .addQuery(query || {})
    .toString();
}

function buildUrl(path, query) {
  return URI(API_LOCATION)
    .path(Array.prototype.concat(API_VERSION, path, '').join('/'))
    .addQuery({api_key: API_KEY})
    .addQuery(query)
    .toString();
}

function getTimePeriod(electionYear, cycle, electionFull, office) {
  var durations = {
    P: 3,
    S: 5,
    H: 1
  };
  var min,
      max,
      duration = durations[office];

  if (electionFull) {
    min = parseInt(electionYear) - duration;
    max = electionYear;
  } else {
    min = parseInt(cycle) - 1;
    max = cycle;
  }

  return min.toString() + '–' + max.toString();
}

/*
* zeroPad: used to add decimals to numbers in order to right-align them
* It does so by getting the width of a container element, measuring the length
* of an item, and then appending decimals until the item is as long as the container
*
* @param container: a selector for the item to use as the maxWidth
* @param item: a selector for the items whose width we will equalize
* @param appendee (optional): what to append the decimal to
*/

function zeroPad(container, item, appendee) {
  // Subtract 2 so if it's close we don't go over
  var maxWidth = $(container).width() - 6;
  $(container).find(appendee).empty();
  $(container).find(item).each(function() {
    var itemWidth = $(this).width();
    // $appendee is where the period will be appended to
    // You can pass either a child element of item or else it will be appended
    // to item itself
    var $appendee = appendee ? $(this).find(appendee) : $(this);
    var value = $appendee.text();
    while ( itemWidth < maxWidth) {
      value = '.' + value;
      $appendee.text(value);
      itemWidth = $(this).width();
    }
  });
}

function amendmentVersion(most_recent) {
  if (most_recent === true) {
    return '<i class="icon-circle--check-outline--inline--left"></i>Current version';
  }
  else if (most_recent === false) {
    return '<i class="icon-circle--clock-reverse--inline--left"></i>Past version';
  }
  else {
    return 'Version unknown';
  }
}

function amendmentVersionDescription(row) {
  // Helper function for labeling filings as either an "original" or
  // a numbered amendment (e.g. "amendment 1" or "amendment 2")
  // Different filings are coded slightly differently, which makes for some tricky logic
  var description = '';
  var amendment_num = 1;

  // because of messy data, do not show if not e-filing or null amendment indicator
  if (row.means_filed !== API.means_filed_e_file || row.amendment_indicator === null) {
    return description;
  }

  // Filings with amendment_indicator = N are the originals
  if (row.amendment_indicator === API.amendment_indicator_new) {
    description = ' Original';
  }

  // Original termination reports always start with their own filing ID
  // in the amendment chain, which caused original reports to show up as an amendment
  // This checks for terminatino reports and if the amendment number is greater
  // than 0 or the amendment chain is longer than 1, it is an amendment
  else if (row.amendment_indicator === API.amendment_indicator_terminated) {
    if (row.amendment_chain.length > 1) {
      amendment_num = row.amendment_chain.length - 1;
      description = ' Amendment ' + amendment_num;
    } else {
      description = ' Original';
    }
  }

  // All other filings: look at the length of the amendment_chain to create
  // a label like "amendment 1" or "amendment 2"
  else {
    if (row.amendment_chain) {
      amendment_num = row.amendment_chain.length - 1;
    }
    if (amendment_num === 0) {
      amendment_num = '';
    }
    description = ' Amendment ' + amendment_num;
  }

  return description;
}


function utcDate(dateString) {
  var originalDate = new Date(dateString);
  var date = originalDate.getUTCDate();
  var month = originalDate.getUTCMonth();
  var year = originalDate.getUTCFullYear();
  return new Date(year, month, date);
}

function missingDataReason(dataType) {
  // Returns a string explaining why data may not be showing
  // which is then used by the noData.hbs message
  var reasons = {
    'contributions': 'The committee has not received any contributions over $200',
    'disbursements': 'The committee has not made any disbursements',
    'independent-expenditures': 'No independent expenditures have been made in support or opposition of this candidate',
    'communication-costs': 'No communication costs have been made in support or opposition of this candidate',
    'electioneering': 'No electioneering communications have been made that mention this candidate',
    'ie-made': 'The committee has not made any independent expenditures'
  };

  return reasons[dataType] || false;
}

/**
 * Takes a jQuery element and returns whether or not it's in the viewport
 * @param {jQuery} $elm - the element to check
 * @return {bool} - If the element is in the viewport
 */
function isInViewport($elm) {
  var top = $elm.offset().top;
  if (window.innerHeight + window.scrollY >= top) {
    return true;
  } else {
    return false;
  }
}

// Sanitizes a single value by removing HTML tags and whitelisting valid
// characters.
function sanitizeValue(value) {
  var validCharactersRegEx = /[^a-z0-9-',.()\s]/ig;

  if (value !== null && value !== undefined) {
    if (_.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        if (value[i] !== null && value[i] !== undefined) {
          value[i] = bleach.sanitize(value[i]).replace(
            validCharactersRegEx,
            ''
          );
        }
      }
    } else {
      value = bleach.sanitize(value).replace(validCharactersRegEx, '');
    }
  }

  return value;
}

// Sanitizes all parameters retrieved from the query string in the URL.
function sanitizeQueryParams(query) {
  var param;

  for (param in query) {
    if (query.hasOwnProperty(param)) {
      query[param] = sanitizeValue(query[param]);
    }
  }

  return query;
}

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie != '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = $.trim(cookies[i]);
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

module.exports = {
  buildAppUrl: buildAppUrl,
  buildUrl: buildUrl,
  currency: currency,
  cycleDates: cycleDates,
  datetime: datetime,
  ensureArray: ensureArray,
  filterNull: filterNull,
  formatNumber: numberFormatter,
  formatCycleRange: formatCycleRange,
  getTimePeriod: getTimePeriod,
  globals: globals,
  isLargeScreen: isLargeScreen,
  isMediumScreen: isMediumScreen,
  isInViewport: isInViewport,
  LOADING_DELAY: LOADING_DELAY,
  SUCCESS_DELAY: SUCCESS_DELAY,
  zeroPad: zeroPad,
  amendmentVersion: amendmentVersion,
  amendmentVersionDescription: amendmentVersionDescription,
  utcDate: utcDate,
  missingDataReason: missingDataReason,
  BREAKPOINTS: BREAKPOINTS,
  getWindowWidth: getWindowWidth,
  sanitizeValue: sanitizeValue,
  sanitizeQueryParams: sanitizeQueryParams,
  getCookie: getCookie
};
