/* global API_LOCATION, API_VERSION, API_KEY_PUBLIC */

import DOMPurify from 'dompurify';
import * as Handlebars from 'handlebars/runtime';
import { default as moment } from 'moment';
import { default as numeral } from 'numeral';
import { default as _chain } from 'underscore/modules/chain.js';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as URI } from 'urijs';

import {
  amendments as decoders_amendments,
  forms as decoders_forms,
  means as decoders_means,
  office as decoders_office,
  parties as decoders_parties,
  reports as decoders_reports,
  supportOppose as decoders_supportOppose,
  states as decoders_states
} from './decoders.js';

// set parameters from the API
export const API = {
  amendment_indicator_new: 'N',
  amendment_indicator_terminated: 'T',
  means_filed_e_file: 'e-file'
};

export const BREAKPOINTS = {
  MEDIUM: 640,
  LARGE: 860
};

export const LOADING_DELAY = 1500;
export const SUCCESS_DELAY = 5000;

export const formatMap = {
  default: 'MM/DD/YYYY',
  pretty: 'MMMM D, YYYY',
  time: 'h:mma',
  dateTime: 'MMMM D, h:mma',
  dayOfWeek: 'ddd',
  fullDayOfWeek: 'dddd'
};

export function anchorify(attr) {
  // Attach anchor <a> links to any tag with a given attribute
  $('[' + attr + ']').each(function(idx, item) {
    const elt = $(item);
    const link = $('<a></a>');
    const href = '#' + elt.attr('id');
    link.attr('href', href);
    link.html(elt.html());
    elt.html('');
    link.appendTo(elt);
  });
}

export function scrollAnchor(ms) {
  ms = ms || 1000;
  if (window.location.hash) {
    setTimeout(function() {
      $('html, body').animate({
        scrollTop: $(window.location.hash).offset().top
      });
    }, ms);
  }
}

export function getWindowWidth() {
  // window.innerWidth accounts for scrollbars and should match the width used
  // for media queries.
  return window.innerWidth;
}

export function isLargeScreen() {
  if (window.innerWidth >= BREAKPOINTS.LARGE) {
    return true;
  } else {
    return false;
  }
}

export function isMediumScreen() {
  if (window.innerWidth >= BREAKPOINTS.MEDIUM) {
    return true;
  } else {
    return false;
  }
}

export function datetime(value, options) {
  const hash = options.hash || {};
  const format = formatMap[hash.format || 'default'];
  const parsed = moment(value, 'YYYY-MM-DDTHH:mm:ss');
  return parsed.isValid() ? parsed.format(format) : null;
}

Handlebars.registerHelper('datetime', datetime);

/**
 * Compares two strings with an optional
 * @param {string} string1 - First string to compare
 * @param {string} string2 - Second string to compare
 * @param {boolean} [caseSensitive=false] - Whether to compare capitalization
 * @returns true if they match, false if they don't
 */
function stringsMatch(string1, string2, caseSensitive=false) {
  if (caseSensitive) return string1.toLowerCase() == string2.toLowerCase();
  else return string1 == string2;
}

Handlebars.registerHelper('stringsMatch', stringsMatch);

/**
 * @param {number} number
 * @param {boolean} roundToWhole - Any number to be converted to US Dollars
 * @returns {string} String from the value and rounding argument
 */
export const currencyFormatter = function(value, roundToWhole) {
  return numeral(value).format(roundToWhole === true ? '$0,0' : '$0,0.00');
};

/**
 * @param {number} value - Any number to be converted to US Dollars
 * @param {boolean} roundToWhole - Any number to be converted to US Dollars. Passed to currencyFormatter()
 * @returns {string} String from the value else '--'
 */
export function currency(value, roundToWhole) {
  if (!isNaN(parseInt(value))) {
    return currencyFormatter(value, roundToWhole);
  } else {
    return '--';
  }
}
Handlebars.registerHelper('currency', currencyFormatter);

export const dollarFormatter = function(number) {
  return numeral(number).format('$0,0');
};

export function dollar(value) {
  if (!isNaN(parseInt(value))) {
    return dollarFormatter(value);
  } else {
    return '--';
  }
}

export const numberFormatter = function(number) {
  return numeral(number).format('0,0');
};

Handlebars.registerHelper('formatNumber', numberFormatter);

export function eq(v1, v2) {
  return v1 === v2;
}
export function toUpperCase(value) {
  return value.substr(0, 1).toUpperCase() + value.substr(1);
}

Handlebars.registerHelper({
  eq: eq,
  // less than
  lt: function(v1, v2) {
    return v1 < v2;
  },
  // greater than
  gt: function(v1, v2) {
    return v1 > v2;
  },
  // less than or equal to
  lte: function(v1, v2) {
    return v1 <= v2;
  },
  // greater than or equal to
  gte: function(v1, v2) {
    return v1 >= v2;
  },
  toUpperCase: toUpperCase
});

export const globals = {
  EARMARKED_CODES: ['15E', '24I', '24T']
};

Handlebars.registerHelper('isEarmarked', function(receipt_type) {
  if (globals.EARMARKED_CODES.indexOf(receipt_type) > -1) {
    return true;
  } else {
    return false;
  }
});

Handlebars.registerHelper('decodeAmendment', function(value) {
  return decoders_amendments[value];
});

Handlebars.registerHelper('decodeOffice', function(value) {
  return decoders_office[value];
});

Handlebars.registerHelper('decodeSupportOppose', function(value) {
  return decoders_supportOppose[value] || 'Unknown';
});

Handlebars.registerHelper('decodeForm', function(value) {
  return decoders_forms[value] || value;
});

Handlebars.registerHelper('decodeReport', function(value) {
  return decoders_reports[value] || value;
});

Handlebars.registerHelper('decodeState', function(value) {
  return decoders_states[value] || value;
});

Handlebars.registerHelper('decodeParty', function(value) {
  return decoders_parties[value] || value;
});

Handlebars.registerHelper('decodeMeans', function(value) {
  return decoders_means[value] || value;
});

Handlebars.registerHelper('formNumber', function(value) {
  // Strips the F from F3X etc.
  return value.split('F')[1];
});

Handlebars.registerHelper('formatSentence', function(value) {
  let str = value.fn(this);
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
});

Handlebars.registerHelper('basePath', global.BASE_PATH);

Handlebars.registerHelper('panelRow', function(label, options) {
  return new Handlebars.SafeString(
    `<tr>` +
      `<td class="panel__term">${label}</td>` +
      `<td class="panel__data">${options.fn(this)}</td>` +
    '</tr>'
  );
});

/**
 * @function entityUrl
 * @param {Object} entity - the data object, likely from the API
 * @param {string} [entity.candidate_id]
 * @param {string} [entity.committee_id]
 * @param {Object} options
 * @param {string} options.hash.type
 * @param {*} [options.hash.query]
 * @returns A sterilized URL string from buildAppUrl()
 */
Handlebars.registerHelper('entityUrl', function(entity, options) {
  let query, id, url;
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
  let url;
  const candidate = options.hash.parentContext;

  if (candidate.office === 'P') {
    url = buildAppUrl(['elections', 'president', year]);
  } else if (candidate.office === 'S') {
    url = buildAppUrl(['elections', 'senate', candidate.state, year]);
  } else if (candidate.office === 'H') {
    // Match election years with the election district
    let district = candidate.election_districts[options.hash.index];
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
  let firstYear = Number(year) - 1;
  return new Handlebars.SafeString(
    firstYear.toString() + '–' + year.toString()
  );
});

/**
 * @see {@link formatZipCode}
 */
Handlebars.registerHelper('zipCode', function(value) {
  return formatZipCode(value);
});

/**
  Formats a cycle range based on a year and a duration.
  If no year is provided, return null;
**/
export function formatCycleRange(year, duration) {
  // Year and duration is requred, if not provided return null
  if (year == null || duration == null) {
    return null;
  }
  const firstYear = Number(year) - duration + 1;
  return firstYear + '–' + year;
}

export function cycleDates(year, duration) {
  return {
    min: '01-01-' + (year - duration + 1),
    max: '12-31-' + year
  };
}

export function multiCycles(cycle, duration, label = 'two_year_transaction_period') {
  if (duration == 6) {
    return {
      [label]: [cycle, cycle - 2, cycle - 4]
    };
  } else if (duration == 4) {
    return {
      [label]: [cycle, cycle - 2]
    };
  } else {
    return {
      [label]: cycle
    };
  }
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [value];
}

export function filterNull(params) {
  return _chain(params)
    .pairs()
    .filter(function(pair) {
      return pair[1] !== '';
    })
    .object()
    .value();
}

/**
 * Returns a full URL with BASE_PATH, {path}, and {query} parameters
 * @param {string} path - A string of paths after the BASE_PATH and before query parameters. (Don't include leading and trailing slashes)
 * @param {*} query - Used by URI.addQuery() to create query parameters
 * @returns A string in the form of `/data/{path}?{query}
 */
export function buildAppUrl(path, query) {
  return URI('')
    .path(Array.prototype.concat(global.BASE_PATH, path || [], '').join('/'))
    .addQuery(query || {})
    .toString();
}

/**
 * Builds a URL from API_LOCATION, path, query, and api_key
 * @param {string} path
 * @param {string} query
 * @returns {string} The final URL
 */
export function buildUrl(path, query) {
  const uri = URI(API_LOCATION)
    .path(Array.prototype.concat(API_VERSION, path, '').join('/'))
    .addQuery({ api_key: API_KEY_PUBLIC });

  if (query.api_key) {
    // if query provides api_key, use that.
    uri.removeQuery('api_key');
  }
  return uri.addQuery(query).toString();
}

export function buildTableQuery(context, params = { per_page: 100 }) {
  let query = _chain(context)
    .pairs()
    .filter(function(pair) {
      return pair[1];
    })
    .object()
    .value();

  // remove duration from API query - only needed for JS calculations
  if (query.duration) {
    delete query.duration;
  }

  return _extend(query, {
    per_page: params.per_page,
    sort_hide_null: true
  });
}

export function getTimePeriod(electionYear, cycle, electionFull, office) {
  const durations = {
    P: 3,
    S: 5,
    H: 1
  };
  let min,
    max,
    duration = durations[office];

  if (electionFull) {
    min = parseInt(electionYear) - duration;
    max = electionYear;
  } else {
    min = parseInt(cycle) - 1;
    max = cycle;
  }

  return min + '–' + max;
}

/**
 * zeroPad: used to add decimals to numbers in order to right-align them
 * It does so by getting the width of a container element, measuring the length
 * of an item, and then appending decimals until the item is as long as the container
 *
 * @param container: a selector for the item to use as the maxWidth
 * @param item: a selector for the items whose width we will equalize
 * @param appendee (optional): what to append the decimal to
 */
export function zeroPad(container, item, appendee) {
  // Subtract 2 so if it's close we don't go over
  const maxWidth = $(container).width() - 6;
  $(container)
    .find(appendee)
    .empty();
  $(container)
    .find(item)
    .each(function() {
      let itemWidth = $(this).width();
      // $appendee is where the period will be appended to
      // You can pass either a child element of item or else it will be appended
      // to item itself
      let $appendee = appendee ? $(this).find(appendee) : $(this);
      let value = $appendee.text();
      while (itemWidth < maxWidth) {
        value = '.' + value;
        $appendee.text(value);
        itemWidth = $(this).width();
      }
    });
}

export function amendmentVersion(most_recent) {
  if (most_recent === true) {
    return '<i class="icon-circle--check-outline--inline--left"></i>Current version';
  } else if (most_recent === false) {
    return '<i class="icon-circle--clock-reverse--inline--left"></i>Past version';
  } else {
    return '<i class="icon-blank"></i>Version unknown';
  }
}

export function amendmentVersionDescription(row) {
  // Helper function for labeling filings as either an "original" or
  // a numbered amendment (e.g. "amendment 1" or "amendment 2")
  // Different filings are coded slightly differently, which makes for some tricky logic
  let description = '';
  let amendment_num = 1;

  // because of messy data, do not show if not e-filing or null amendment indicator
  if (
    row.means_filed !== API.means_filed_e_file ||
    row.amendment_indicator === null
  ) {
    return description;
  }

  // Filings with amendment_indicator = N are the originals
  // Amendment chain should be 1 - this handles filings with unknown versions
  // and F1N & F2 that are filed as N but are not originals
  if (
    row.amendment_indicator === API.amendment_indicator_new &&
    row.amendment_chain != null &&
    row.amendment_chain.length === 1
  ) {
    description = ' Original';
  }

  // Original termination reports always start with their own filing ID
  // in the amendment chain, which caused original reports to show up as an amendment
  // This checks for termination reports and if the amendment number is greater
  // than 0 or the amendment chain is longer than 1, it is an amendment
  else if (row.amendment_indicator === API.amendment_indicator_terminated) {
    if (row.amendment_chain != null && row.amendment_chain.length > 1) {
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
    // Don't show amendment number for F1 and F2 - it's unreliable data
    if (amendment_num === 0 || row.form_type == 'F2' || row.form_type == 'F1') {
      amendment_num = '';
    }
    description = ' Amendment ' + amendment_num;
  }

  return description;
}

export function utcDate(dateString) {
  let originalDate = new Date(dateString);
  let date = originalDate.getUTCDate();
  let month = originalDate.getUTCMonth();
  let year = originalDate.getUTCFullYear();
  return new Date(year, month, date);
}

export function missingDataReason(dataType) {
  // Returns a string explaining why data may not be showing
  // which is then used by the noData.hbs message
  let reasons = {
    contributions:
      'The committee has not received any contributions over $200.',
    disbursements: 'The committee has not made any disbursements.',
    'independent-expenditures':
      'No independent expenditures have been made in support or opposition of this candidate.',
    'communication-costs':
      'No communication costs have been made in support or opposition of this candidate.',
    electioneering:
      'No electioneering communications have been made that mention this candidate.',
    'ie-made': 'The committee has not made any independent expenditures.'
  };

  return reasons[dataType] || false;
}

/**
 * Takes a jQuery element and returns whether or not it's in the viewport
 * @param {JQuery} $elm - the element to check
 * @returns {boolean} - If the element is in the viewport
 */
export function isInViewport($elm) {
  let top = $elm.offset().top;
  if (window.innerHeight + window.scrollY >= top) {
    return true;
  } else {
    return false;
  }
}

/**
 * Sanitizes a single value by removing HTML tags and whitelisting valid characters.
 * Sanitizes a string or an Array of strings. (and likely numbers)
 * @param {[string|string[]]} value
 * @returns {[string|string[]]} A sanitized single (or array of) string(s), in line with what it's fed
 */
export function sanitizeValue(value) {
  let validCharactersRegEx = /[^a-z0-9-',.()\s]/gi;

  if (value !== null && value !== undefined) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== null && value[i] !== undefined) {
          value[i] = DOMPurify.sanitize(value[i], { ALLOWED_TAGS: [] })
            .replace(validCharactersRegEx, '');
        }
      }
    } else {
      value = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] })
        .replace(validCharactersRegEx, '');
    }
  }
  return value;
}

/**
 * Sanitizes all parameters retrieved from the query string in the URL.
 * @param {Object} query
 * @returns {string}
 */
export function sanitizeQueryParams(query) {
  let param;

  for (param in query) {
    // eslint-disable-next-line no-prototype-builtins
    if (query.hasOwnProperty(param)) {
      query[param] = sanitizeValue(query[param]);
    }
  }

  return query;
}

export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie != '') {
    let cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = $.trim(cookies[i]); // TODO: remove jQuery.trim as it's been deprecated
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/**
 * Passive listeners on touchstart and scroll events improve page performance
 * but could crash non-supportive browsers.
 * This function will return either an object to be used in addEventListener,
 * or will return null if the browser doesn't support `passive()`
 * @returns Object or false depending on whether the browser supports passive listeners
 */
export function passiveListenerIfSupported() {
  let supported = false;
  /**
   * Let's check whether the browser supports passive event listeners
   */
  try {
    const options = {
      get passive() {
        supported = true;
        return false;
      }
    };
    window.addEventListener('test', null, options);
    window.removeEventListener('test', null, options);
  } catch (err) {
    supported = false;
  }

  return supported ? { passive: true } : false;
}

/**
 * To convert a nine-digit number to ZIP Code format
 * @param {string|number} value - The string or number to be formatted as a ZIP Code
 * @returns {string} The provided value unless it's exactly nine numbers long, then returns a 9-letter ZIP Code format with the dash
 */
export function formatZipCode(value) {
  let value_string = String(value);
  let value_int = parseInt(value);
  if (isNaN(value_int) || value_int < 100000000 || value_int > 999999999 || value_string.substring(0,1) === '0')
    return value;
  else
    return `${value_string.substring(0,5)}-${value_string.substring(5)}`;
}
