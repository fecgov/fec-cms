import { default as _each } from 'underscore/modules/each.js';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as _find } from 'underscore/modules/find.js';
import { default as _isEqual } from 'underscore/modules/isEqual.js';
import { default as _keys } from 'underscore/modules/keys.js';
import { default as _union } from 'underscore/modules/union.js';
import { default as URI } from 'urijs';

import { pageView } from './analytics.js';
import { sanitizeQueryParams } from './helpers.js';

/**
 * Takes a list of key/value, runs them through {@linkcode nextUrl()} and sets them to the window.history
 * then logs an analytics pageView
 * @param {Object} params - Object of key/value for query params and their values.
 * ex: {data_type: ['processed'], max_date: ['12/31/2000'], min_date: ['01/01/2000']}
 * @param {Array} fields - Array of allowed filter fields. ex: ['data_type', 'committee_id', 'max_date', 'min_date']
 */
export function updateQuery(params, fields) {
  const queryString = nextUrl(params, fields);
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
  const queryString = nextUrl(params, fields);
  if (queryString !== null) {
    window.history.pushState(
      params,
      queryString,
      queryString || window.location.pathname
    );
    pageView();
  }
}

/**
 * Builds a URL from provided values (params) and allowed fields (fields)
 * @param {Object} params - The values to included in the URL
 * @param {Array} fields - List of allowed field names. Any keys in params will be ignore if they aren't in this list
 * @returns {string}
 */
export function nextUrl(params, fields) {
  const query = sanitizeQueryParams(
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
  const different = _find(keys, function(key) {
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
