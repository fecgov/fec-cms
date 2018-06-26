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

    tables.drawComparison(response.results, context);
    maps.initStateMaps(response.results);
  });

  electionUtils.getStateElectionOffices(context.election.state);
  electionUtils.getElections(context.election.state, context.election.office, context.election.cycle);
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
