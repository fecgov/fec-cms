// 'use strict';

// /* global document, context */

/**
 * Based on /fec/static/js/pages/elections.js
 */

// const $ = require('jquery');
// const _ = require('underscore');

// const maps = require('../modules/maps');
// const tables = require('../modules/tables');
// const electionUtils = require('../modules/election-utils');
// const helpers = require('../modules/helpers');
// const ElectionForm = require('../modules/election-form').ElectionForm;
// const tableColumns = require('../modules/table-columns');
const ElectionMap = require('./election-map').ElectionMap;

function ContributionsByState() {
  this.init();
}


ContributionsByState.prototype.init = function() {
  this.$map = $('.map-wrapper .election-map');
  console.log('this.$map: ' + this.$map);
//   this.map = new ElectionMap(this.$map.get(0), {
//     drawStates: true,
//     handleSelect: this.handleSelectMap.bind(this)
//   });
}


// $(document).ready(function() {
//   var query = helpers.buildTableQuery(context.election);
//   var spendingTableOpts = {
//     'independent-expenditures': {
//       path: ['schedules', 'schedule_e', 'by_candidate'],
//       columns: tableColumns.independentExpenditureColumns,
//       title: 'independent expenditures',
//       order: [[3, 'desc']]
//     },
//     'communication-costs': {
//       path: ['communication_costs', 'by_candidate'],
//       columns: tableColumns.communicationCostColumns,
//       title: 'communication costs',
//       order: [[3, 'desc']]
//     },
//     electioneering: {
//       path: ['electioneering', 'by_candidate'],
//       columns: tableColumns.electioneeringColumns,
//       title: 'electioneering communications',
//       order: [[2, 'desc']]
//     },
//     'candidate-financial-totals': {
//       path: ['elections'],
//       columns: tableColumns.createElectionColumns(context),
//       title: 'candidate financial total',
//       order: [[2, 'desc']]
//     },
//     'candidate-information': {
//       path: ['elections'],
//       columns: tableColumns.candidateInformationColumns,
//       title: 'candidate information',
//       order: [[3, 'desc']]
//     }
//   };

//   var url = helpers.buildUrl(['elections'], query);

//   $.getJSON(url).done(function(response) {
//     context.candidates = _.chain(response.results)
//       .map(function(candidate) {
//         return [candidate.candidate_id, candidate];
//       })
//       .object()
//       .value();

//     tables.drawComparison(response.results, context);
//     maps.initStateMaps(response.results);
//     helpers.scrollAnchor();
//   });

//   electionUtils.getStateElectionOffices(context.election.state);
//   tables.initSpendingTables('.data-table', context, spendingTableOpts);

//   new ElectionForm('#election-nav');

//   if ($('#election-map').length) {
//     var districtMap = new maps.DistrictMap($('#election-map').get(0), {
//       color: '#36BDBB'
//     });
//     districtMap.load(context.election);
//   }
// });

new ContributionsByState();
