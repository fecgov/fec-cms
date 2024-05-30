'use strict';

// var _ = require('underscore');
var helpers = require('./helpers');

var sizeInfo = {
  0: { limits: [0, 200], label: '$200 and under' }, // eslint-disable-line quote-props
  200: { limits: [200.01, 499.99], label: '$200.01—$499' }, // eslint-disable-line quote-props
  500: { limits: [500, 999.99], label: '$500—$999' }, // eslint-disable-line quote-props
  1000: { limits: [1000, 1999.99], label: '$1,000—$1,999' }, // eslint-disable-line quote-props
  2000: { limits: [2000, null], label: '$2,000 and over' } // eslint-disable-line quote-props
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
  return keys.map(function(key) {
    return columns[key];
  });
}

function formattedColumn(formatter, defaultOpts) {
  defaultOpts = defaultOpts || {};
  return function(opts) {
    return Object.assign(
      {},
      defaultOpts,
      {
        render: function(data, type, row, meta) {
          return formatter(data, type, row, meta);
        }
      },
      opts
    );
  };
}

function barColumn(formatter) {
  formatter =
    formatter ||
    function(value) {
      return value;
    };
  return function(opts) {
    return Object.assign(
      {
        orderSequence: ['desc', 'asc'],
        render: function(data, type, row, meta) {
          var span = document.createElement('div');
          span.textContent = formatter(Math.max(data, 0));
          span.setAttribute('data-value', data || 0);
          span.setAttribute('data-row', meta.row);
          return span.outerHTML;
        }
      },
      opts
    );
  };
}

function urlColumn(attr, opts) {
  return Object.assign(
    {
      render: function(data, type, row) {
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
    },
    opts
  );
}

/**
 * 
 * @param {string} data - Used for textContent and title
 * @param {string} url - Set to returned element's href
 * @param {string} category - Added as the element's dataset.category
 * @param {Object} [opts={}] - Options
 * @param {boolean} [opts.isIncumbent] - If true, the returned element string will include `class="is-incumbent"`
 * @returns String in the format of `<a href="{url}" title="{data}" data-category="{category}">{data}</a>`
 */
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

function buildAggregateUrl(cycle, includeTransactionPeriod, duration = 2) {
  var dates = helpers.cycleDates(cycle, duration);
  if (includeTransactionPeriod) {
    return helpers.multiCycles(cycle, duration);
  } else {
    return {
      min_date: dates.min,
      max_date: dates.max
    };
  }
}

// Used for election profile page "other spending" tables
// As well as candidate/committee profile "Individual contributions"
// by state and by size
function buildTotalLink(path, getParams) {
  return function(data, type, row, meta) {
    data = data || 0;
    var params = getParams(data, type, row, meta);
    var span = document.createElement('div');
    var includeTransactionPeriod = false;
    var electionDuration = 2;
    span.setAttribute('data-value', data);
    span.setAttribute('data-row', meta.row);
    if (params) {
      var link = document.createElement('a');
      link.textContent = helpers.currency(data);
      link.setAttribute('title', 'Show individual transactions');
      if (path.indexOf('receipts') > -1 || path.indexOf('disbursements') > -1) {
        includeTransactionPeriod = true;
      }
      if (context.election) {
        electionDuration = context.election.duration;
      }
      var uri = helpers.buildAppUrl(
        path,
        Object.assign(
          { committee_id: row.committee_id },
          buildAggregateUrl(
            Object.assign({}, row, params).cycle,
            includeTransactionPeriod,
            electionDuration
          ),
          params
        )
      );
      link.setAttribute('href', uri);
      span.appendChild(link);
      // Temporarily disable "other" state aggs
      if (params.contributor_state == 'OT') {
        span.textContent = helpers.currency(data);
      }
    } else {
      span.textContent = helpers.currency(data);
    }
    return span.outerHTML;
  };
}

// Used for election profile page "individual contributions to candidates" charts
function makeCommitteeColumn(opts, context, factory) {
  return Object.assign(
    {},
    {
      orderSequence: ['desc', 'asc'],
      className: 'column--number t-mono',
      render: buildTotalLink(['receipts', 'individual-contributions'], function(
        data,
        type,
        row,
        meta
      ) {
        row.cycle = context.election.cycle;
        var column = meta.settings.aoColumns[meta.col].data;
        row.duration = context.election.duration;
        return Object.assign(
          {
            committee_id: (context.candidates[row.candidate_id] || {})
              .committee_ids
          },
          helpers.multiCycles(row.cycle, row.duration),
          factory(data, type, row, meta, column)
        );
      })
    },
    opts
  );
}

function sizeColumns(context) {
  var factory = function(data, type, row, meta, column) {
    return getSizeParams(column);
  };

  return [
    {
      data: 'candidate_name',
      className: 'all',
      width: 'column--med',
      render: function(data, type, row) {
        return buildEntityLink(
          data,
          helpers.buildAppUrl(['candidate', row.candidate_id]),
          'candidate'
        );
      }
    },
    makeCommitteeColumn({ data: '0' }, context, factory),
    makeCommitteeColumn({ data: '200' }, context, factory),
    makeCommitteeColumn({ data: '500' }, context, factory),
    makeCommitteeColumn({ data: '1000' }, context, factory),
    makeCommitteeColumn({ data: '2000' }, context, factory)
  ];
}

function stateColumns(results, context) {
  var stateColumn = { data: 'state' };
  var columns = results.toArray().map(function(result) {
    return makeCommitteeColumn({ data: result.candidate_id }, context, function(
      data,
      type,
      row,
      meta,
      column
    ) {
      return {
        contributor_state: row.state,
        committee_id: (context.candidates[column] || {}).committee_ids,
        is_individual: 'true'
      };
    });
  });

  return [stateColumn].concat(columns);
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
  urlColumn: urlColumn,
  sizeColumns: sizeColumns,
  stateColumns: stateColumns
};
