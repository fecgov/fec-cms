
import { chain as _chain } from 'underscore';

import ElectionForm from '../modules/election-form.js';
import { getStateElectionOffices } from '../modules/election-utils.js';
import { buildTableQuery, buildUrl, scrollAnchor } from '../modules/helpers.js';
import { DistrictMap, initStateMaps } from '../modules/maps.js';
import {
  candidateInformationColumns,
  communicationCostColumns,
  createElectionColumns,
  electioneeringColumns,
  independentExpenditureColumns
} from '../modules/table-columns.js';
import { drawComparison, initSpendingTables } from '../modules/tables.js';

$(function() {
  const spendingTableOpts = {
    'independent-expenditures': {
      path: ['schedules', 'schedule_e', 'by_candidate'],
      columns: independentExpenditureColumns,
      title: 'independent expenditures',
      order: [[3, 'desc']]
    },
    'communication-costs': {
      path: ['communication_costs', 'by_candidate'],
      columns: communicationCostColumns,
      title: 'communication costs',
      order: [[3, 'desc']]
    },
    electioneering: {
      path: ['electioneering', 'by_candidate'],
      columns: electioneeringColumns,
      title: 'electioneering communications',
      order: [[2, 'desc']]
    },
    'candidate-financial-totals': {
      path: ['elections'],
      columns: createElectionColumns(global.context),
      title: 'candidate financial total',
      order: [[2, 'desc']]
    },
    'candidate-information': {
      path: ['elections'],
      columns: candidateInformationColumns,
      title: 'candidate information',
      order: [[3, 'desc']]
    }
  };
  const query = buildTableQuery(global.context.election);
  const url = buildUrl(['elections'], query);

  $.getJSON(url).done(function(response) {
    global.context.candidates = _chain(response.results)
      .map(function(candidate) {
        return [candidate.candidate_id, candidate];
      })
      .object()
      .value();

    drawComparison(response.results, global.context);
    initStateMaps(response.results);
    scrollAnchor();
  });

  if (global.context && global.context.election && global.context.election.state)
    getStateElectionOffices(global.context.election.state);
  initSpendingTables('.data-table', global.context, spendingTableOpts);

  new ElectionForm('#election-nav');

  if ($('#election-map').length) {
    const districtMap = new DistrictMap($('#election-map').get(0), {
      color: '#36BDBB'
    });
    districtMap.load(global.context.election);
  }
});
