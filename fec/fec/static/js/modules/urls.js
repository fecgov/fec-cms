import {
  each as _each,
  extend as _extend,
  find as _find,
  isEqual as _isEqual,
  keys as _keys,
  union as _union
} from 'underscore';
import { default as URI } from 'urijs';

import { pageView } from './analytics.js';
import { sanitizeQueryParams } from './helpers.js';

export function updateQuery(params, fields) {
  var queryString = nextUrl(params, fields);
  if (queryString !== null) {
    window.history.replaceState(
      params,
      queryString,
      queryString || window.location.pathname
    );
    pageView();
  }
}

export function pushQuery(params, fields) {
  var queryString = nextUrl(params, fields);
  if (queryString !== null) {
    window.history.pushState(
      params,
      queryString,
      queryString || window.location.pathname
    );
    pageView();
  }
}

export function nextUrl(params, fields) {
  var query = sanitizeQueryParams(
    URI.parseQuery(window.location.search)
  );
  if (!compareQuery(query, params, fields)) {
    // Clear and update filter fields
    _each(fields, function(field) {
      delete query[field];
    });
    params = _extend(query, params);
    return URI('')
      .query(params)
      .toString();
  } else {
    return null;
  }
}

export function compareQuery(first, second, keys) {
  keys = keys || _union(_keys(first), _keys(second));
  var different = _find(keys, function(key) {
    return !_isEqual(
      ensureArray(first[key]).sort(),
      ensureArray(second[key]).sort()
    );
  });
  return !different;
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [value];
}
