'use strict';

/* global document, context */

var $ = require('jquery');
var _ = require('underscore');

var maps = require('../modules/maps');
var tables = require('../modules/tables');
var electionUtils = require('../modules/election-utils');
var helpers = require('../modules/helpers');
var ElectionForm = require('../modules/election-form').ElectionForm;
var tableColumns = require('../modules/table-columns');

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

var spendingTableOpts = {
  'independent-expenditures': {
    path: ['schedules', 'schedule_e', 'by_candidate'],
    columns: tableColumns.independentExpenditureColumns,
    title: 'independent expenditures',
    order: [[3, 'desc']],
  },
  'communication-costs': {
    path: ['communication_costs', 'by_candidate'],
    columns: tableColumns.communicationCostColumns,
    title: 'communication costs',
    order: [[3, 'desc']]
  },
  'electioneering': {
    path: ['electioneering', 'by_candidate'],
    columns: tableColumns.electioneeringColumns,
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
      columns: tableColumns.createElectionColumns(context),
      data: response.results,
      order: [[2, 'desc']]
    }));

    $candidateInfo.DataTable(_.extend({}, defaultOpts, {
      columns: tableColumns.candidateInformationColumns,
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
  tables.initSpendingTables('.data-table', context, spendingTableOpts);

  new ElectionForm('#election-nav');

  if ($('#election-map').length) {
    var districtMap = new maps.DistrictMap(
      $('#election-map').get(0),
      {color: '#36BDBB'}
    );
    districtMap.load(context.election);
  }
});
