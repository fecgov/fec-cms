'use strict';

var _ = require('underscore');

var helpers = require('./helpers');

var sizeInfo = {
  0: {limits: [0, 200], label: '$200 and under'},
  200: {limits: [200.01, 499.99], label: '$200.01—$499'},
  500: {limits: [500, 999.99], label: '$500—$999'},
  1000: {limits: [1000, 1999.99], label: '$1,000—$1,999'},
  2000: {limits: [2000, null], label: '$2,000 and over'},
};

function getSizeParams(size) {
  var limits = sizeInfo[size].limits;
  var params = {};
  if (limits[0] !== null) {
    params.min_amount = helpers.currency(limits[0]);
  }
  if (limits[1] !== null) {
    params.max_amount = helpers.currency(limits[1]);
  }
  return params;
}

function getColumns(columns, keys) {
  return _.map(keys, function(key) {
    return columns[key];
  });
}

function formattedColumn(formatter, defaultOpts) {
  defaultOpts = defaultOpts || {};
  return function(opts) {
    return _.extend({}, defaultOpts, {
      render: function(data, type, row, meta) {
        return formatter(data, type, row, meta);
      }
    }, opts);
  };
}

function barColumn(formatter) {
  formatter = formatter || function(value) { return value; };
  return function(opts) {
    return _.extend({
      orderSequence: ['desc', 'asc'],
      render: function(data, type, row, meta) {
        var span = document.createElement('div');
        span.textContent = formatter(_.max([data, 0]));
        span.setAttribute('data-value', data || 0);
        span.setAttribute('data-row', meta.row);
        return span.outerHTML;
      }
    }, opts);
  };
}

function urlColumn(attr, opts) {
  return _.extend({
    render: function(data, type, row, meta) {
      if (row[attr]) {
        var anchor = document.createElement('a');
        anchor.textContent = data;
        anchor.setAttribute('href', row[attr]);
        anchor.setAttribute('target', '_blank');
        return anchor.outerHTML;
      } else {
        return data;
      }
    }
  }, opts);
}

function buildEntityLink(data, url, category, opts) {
  opts = opts || {};
  var anchor = document.createElement('a');
  anchor.textContent = data;
  anchor.setAttribute('href', url);
  anchor.setAttribute('title', data);
  anchor.setAttribute('data-category', category);

  if (opts.isIncumbent) {
    anchor.classList.add('is-incumbent');
  }

  return anchor.outerHTML;
}

function buildAggregateUrl(cycle, includeTransactionPeriod) {
  var dates = helpers.cycleDates(cycle);
  if (includeTransactionPeriod) {
    return {
      two_year_transaction_period: cycle
    };
  } else {
    return {
      min_date: dates.min,
      max_date: dates.max
    };
  }
}

function buildTotalLink(path, getParams) {
  return function(data, type, row, meta) {
    data = data || 0;
    var params = getParams(data, type, row, meta);
    var span = document.createElement('div');
    var includeTransactionPeriod = false;
    span.setAttribute('data-value', data);
    span.setAttribute('data-row', meta.row);
    if (params) {
      var link = document.createElement('a');
      link.textContent = helpers.currency(data);
      link.setAttribute('title', 'Show individual transactions');
      if (path.indexOf('receipts') > -1 || path.indexOf('disbursements') > -1) {
        includeTransactionPeriod = true;
      }
      var uri = helpers.buildAppUrl(path, _.extend(
        {committee_id: row.committee_id},
        buildAggregateUrl(_.extend({}, row, params).cycle, includeTransactionPeriod),
        params
      ));
      link.setAttribute('href', uri);
      span.appendChild(link);
    } else {
      span.textContent = helpers.currency(data);
    }
    return span.outerHTML;
  };
}

module.exports = {
  barColumn: barColumn,
  buildAggregateUrl: buildAggregateUrl,
  buildEntityLink: buildEntityLink,
  buildTotalLink: buildTotalLink,
  formattedColumn: formattedColumn,
  getColumns: getColumns,
  getSizeParams: getSizeParams,
  sizeInfo: sizeInfo,
  urlColumn: urlColumn
};
