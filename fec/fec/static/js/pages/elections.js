'use strict';

/* global document, context */

var d3 = require('d3');
var $ = require('jquery');
var _ = require('underscore');
var chroma = require('chroma-js');
var Glossary = require('glossary-panel');
var moment = require('moment');

var comparisonTemplate = require('../templates/comparison.hbs');
var coverageEndDate = require('../templates/coverageEndDate.hbs');

var fips = require('../modules/fips');
var maps = require('../modules/maps');
var tables = require('../modules/tables');
var columnHelpers = require('../modules/column-helpers');
var columns = require('../modules/columns');
var dropdown = require('../modules/dropdowns');
var electionUtils = require('../modules/election-utils');
var helpers = require('../modules/helpers');
var ElectionForm = require('../modules/election-form').ElectionForm;

var MAX_MAPS = 2;

var defaultOpts = {
  autoWidth: false,
  destroy: true,
  searching: false,
  serverSide: false,
  lengthChange: true,
  useExport: true,
  singleEntityItemizedExport: true,
  dom: tables.simpleDOM,
  language: {
    lengthMenu: 'Results per page: _MENU_',
  },
  pagingType: 'simple'
};

var independentExpenditureColumns = [
  columns.committeeColumn({data: 'committee', className: 'all'}),
  columns.supportOpposeColumn,
  columns.candidateColumn({data: 'candidate', className: 'all'}),
  {
    data: 'total',
    className: 'all column--number',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['independent-expenditures'], function(data, type, row, meta) {
        return {
          data_type: 'processed',
          is_notice: 'false',
          support_oppose_indicator: row.support_oppose_indicator,
          candidate_id: row.candidate_id
        };
    })
  },
];

var candidateInformationColumns = [
  {
    data: 'candidate_name',
    className: 'all column--large',
    render: function(data, type, row, meta) {
      return columnHelpers.buildEntityLink(
        data,
        helpers.buildAppUrl(['candidate', row.candidate_id]),
        'candidate',
        {isIncumbent: row.incumbent_challenge_full === 'Incumbent'}
      );
    }
  },
  {
    data: 'party_full',
    className: 'all column--large',
  },
  {
    data: 'candidate_pcc_name',
    className: 'all column--large',
    render: function(data, type, row, meta) {
      if (!data) return 'No principal campaign committee identified';

      return columnHelpers.buildEntityLink(
        data,
        helpers.buildAppUrl(['committee', row.candidate_pcc_id]),
        'candidate_pcc_id'
      );
    }
  },
  columns.currencyColumn({
    data: 'total_receipts',
    className: 'column--number',
    orderSequence: ['desc', 'asc'],
    visible: false
  })
];

var communicationCostColumns = [
  columns.committeeColumn({data: 'committee', className: 'all'}),
  columns.supportOpposeColumn,
  columns.candidateColumn({data: 'candidate', className: 'all'}),
  {
    data: 'total',
    className: 'all column--number',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['communication-costs'], function(data, type, row, meta) {
        return {
          support_oppose_indicator: row.support_oppose_indicator,
          candidate_id: row.candidate_id,
        };
    })
  },
];

var electioneeringColumns = [
  columns.committeeColumn({data: 'committee', className: 'all'}),
  columns.candidateColumn({data: 'candidate', className: 'all'}),
  {
    data: 'total',
    className: 'all column--number',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['electioneering-communications'], function(data, type, row, meta) {
        return {
          candidate_id: row.candidate_id,
        };
    })
  },
];

var electionColumns = [
  {
    data: 'candidate_name',
    className: 'all column--large',
    render: function(data, type, row, meta) {
      return columnHelpers.buildEntityLink(
        data,
        helpers.buildAppUrl(['candidate', row.candidate_id]),
        'candidate',
        {isIncumbent: row.incumbent_challenge_full === 'Incumbent'}
      );
    }
  },
  {
    data: 'party_full',
    className: 'all'
  },
  columns.currencyColumn({
    data: 'total_receipts',
    className: 'column--number',
    orderSequence: ['desc', 'asc']
  }),
  columns.currencyColumn({
    data: 'total_disbursements',
    className: 'column--number',
    orderSequence: ['desc', 'asc']
  }),
  columns.barCurrencyColumn({
    data: 'cash_on_hand_end_period',
    className: 'column--number'
  }),
  {
    render: function(data, type, row, meta) {
      var dates = helpers.cycleDates(context.election.cycle);
      var urlBase;
      if (context.election.office === 'president') {
        urlBase = ['reports', 'presidential'];
      } else {
        urlBase = ['reports','house-senate'];
      }
      var url = helpers.buildAppUrl(
        urlBase,
        {
          committee_id: row.committee_ids,
          cycle: context.election.cycle,
          is_amended: 'false'
        }
      );
      var coverage_end_date = row.coverage_end_date ? moment(row.coverage_end_date).format('MM/DD/YYYY') : null;

      return coverageEndDate({
        coverage_end_date: coverage_end_date,
        url: url
      });
    },
    className: 'all',
    orderable: false,
  }
];

function makeCommitteeColumn(opts, factory) {
  return _.extend({}, {
    orderSequence: ['desc', 'asc'],
    className: 'column--number',
    render: columnHelpers.buildTotalLink(['receipts', 'individual-contributions'], function(data, type, row, meta) {
      row.cycle = context.election.cycle;
      var column = meta.settings.aoColumns[meta.col].data;
      return _.extend({
        committee_id: (context.candidates[row.candidate_id] || {}).committee_ids,
        two_year_transaction_period: row.cycle,
      }, factory(data, type, row, meta, column));
    })
  }, opts);
}

var makeSizeColumn = _.partial(makeCommitteeColumn, _, function(data, type, row, meta, column) {
  return columnHelpers.getSizeParams(column);
});

var sizeColumns = [
  {
    data: 'candidate_name',
    className: 'all',
    width: 'column--med',
    render: function(data, type, row, meta) {
      return columnHelpers.buildEntityLink(
        data,
        helpers.buildAppUrl(['candidate', row.candidate_id]),
        'candidate'
      );
    }
  },
  makeSizeColumn({data: '0'}),
  makeSizeColumn({data: '200'}),
  makeSizeColumn({data: '500'}),
  makeSizeColumn({data: '1000'}),
  makeSizeColumn({data: '2000'})
];

var stateColumn = {'data': 'state'};

function stateColumns(results) {
  var columns = _.map(results, function(result) {
    return makeCommitteeColumn(
      {data: result.candidate_id},
      function(data, type, row, meta, column) {
        return {
          contributor_state: row.state,
          committee_id: (context.candidates[column] || {}).committee_ids,
          is_individual: 'true'
        };
      }
    );
  });

  return [stateColumn].concat(columns);
}

function refreshTables(e) {
  var $comparison = $('#comparison');
  var selected = $comparison.find('input[type="checkbox"]:checked').map(function(_, input) {
    var $input = $(input);
    return {
      candidate_id: $input.attr('data-id'),
      candidate_name: $input.attr('data-name')
    };
  });

  if (selected.length > 0) {
    drawSizeTable(selected);
    drawStateTable(selected);
  }

  if (e) {
    $(e.target).next('label').addClass('is-loading');

    setTimeout(function() {
      $comparison.find('.is-loading').removeClass('is-loading').addClass('is-successful');
    }, helpers.LOADING_DELAY);

    setTimeout(function() {
      $comparison.find('.is-successful').removeClass('is-successful');
    }, helpers.SUCCESS_DELAY);
  }
}

function drawComparison(results) {
  var $comparison = $('#comparison');
  var context = {selected: results.slice(0, 10), options: results.slice(10)};
  $comparison.prepend(comparisonTemplate(context));
  new dropdown.Dropdown($comparison.find('.js-dropdown'));
  $comparison.on('change', 'input[type="checkbox"]', refreshTables);
  refreshTables();
}

function mapSize(response, primary) {
  var groups = {};
  _.each(response.results, function(result) {
    groups[result.candidate_id] = groups[result.candidate_id] || {};
    groups[result.candidate_id][result.size] = result.total;
  });
  return _.map(_.pairs(groups), function(pair) {
    return _.extend(
      pair[1], {
        candidate_id: pair[0],
        candidate_name: primary[pair[0]].candidate_name
      });
  });
}

function mapState(response) {
  var groups = {};
  _.each(response.results, function(result) {
    groups[result.state] = groups[result.state] || {};
    groups[result.state][result.candidate_id] = result.total;
    groups[result.state].state_full = result.state_full;
  });
  return _.map(_.pairs(groups), function(pair) {
    return _.extend(
      pair[1], {state: pair[0]});
  });
}

function destroyTable($table) {
  if ($.fn.dataTable.isDataTable($table)) {
    var api = $table.DataTable();
    api.clear();
    api.destroy();
    $table.data('max', null);
  }
}

function buildUrl(selected, path) {
  var query = {
    cycle: context.election.cycle,
    candidate_id: _.pluck(selected, 'candidate_id'),
    per_page: 0
  };
  return helpers.buildUrl(path, query);
}

function drawSizeTable(selected) {
  var $table = $('table[data-type="by-size"]');
  var primary = _.object(_.map(selected, function(result) {
    return [result.candidate_id, result];
  }));
  $.getJSON(
    buildUrl(selected, ['schedules', 'schedule_a', 'by_size', 'by_candidate'])
  ).done(function(response) {
    var data = mapSize(response, primary);
    destroyTable($table);
    $table.dataTable(_.extend({
      autoWidth: false,
      data: data,
      columns: sizeColumns,
      order: [[1, 'desc']]
    }, defaultOpts));
    tables.barsAfterRender(null, $table.DataTable());
  });
}

function drawStateTable(selected) {
  var $table = $('table[data-type="by-state"]');
  var primary = _.object(_.map(selected, function(result) {
    return [result.candidate_id, result];
  }));
  $.getJSON(
    buildUrl(selected, ['schedules', 'schedule_a', 'by_state', 'by_candidate'])
  ).done(function(response) {
    var data = mapState(response, primary);
    // Populate headers with correct text
    var headerLabels = ['State'].concat(_.pluck(selected, 'candidate_name'));
    $table.find('thead tr')
      .empty()
      .append(_.map(headerLabels, function(label) {
        return $('<th>').text(label);
      }));
    destroyTable($table);
    $table.dataTable(_.extend({
      autoWidth: false,
      data: data,
      columns: stateColumns(selected),
      order: [[1, 'desc']],
      drawCallback: function(settings, $table) {
        tables.barsAfterRender(null, this.api());
      }
    }, defaultOpts));
  });
}

var tableOpts = {
  'independent-expenditures': {
    path: ['schedules', 'schedule_e', 'by_candidate'],
    columns: independentExpenditureColumns,
    title: 'independent expenditures',
    order: [[3, 'desc']],
  },
  'communication-costs': {
    path: ['communication_costs', 'by_candidate'],
    columns: communicationCostColumns,
    title: 'communication costs',
    order: [[3, 'desc']]
  },
  'electioneering': {
    path: ['electioneering', 'by_candidate'],
    columns: electioneeringColumns,
    title: 'electioneering communications',
    order: [[2, 'desc']]
  },
};

$(document).ready(function() {
  var $table = $('#results');
  var $candidateInfo = $('#candidate-information-results');
  var query = helpers.buildTableQuery(context.election);

  var url = helpers.buildUrl(
    ['elections'],
    query
  );

  $.getJSON(url).done(function(response) {
    $table.DataTable(_.extend({}, defaultOpts, {
      columns: electionColumns,
      data: response.results,
      order: [[2, 'desc']]
    }));

    $candidateInfo.DataTable(_.extend({}, defaultOpts, {
      columns: candidateInformationColumns,
      data: response.results,
      order: [[3, 'desc']]
    }));

    context.candidates = _.chain(response.results)
      .map(function(candidate) {
        return [candidate.candidate_id, candidate];
      })
      .object()
      .value();

    var incumbents = response.results.filter(function(result) {
      return result.incumbent_challenge_full=='Incumbent';
    });

    drawComparison(response.results, context);
    maps.initStateMaps(response.results);
  });

  electionUtils.getStateElectionOffices(context.election.state);
  electionUtils.getElections(context.election.state, context.election.office);
  tables.initSpendingTables('.data-table', context, tableOpts);

  new ElectionForm('#election-nav');

  if ($('#election-map').length) {
    var districtMap = new maps.DistrictMap(
      $('#election-map').get(0),
      {color: '#36BDBB'}
    );
    districtMap.load(context.election);
  }
});
