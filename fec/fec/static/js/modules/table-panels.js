import { default as _extend } from 'underscore/modules/extend.js';
import { default as URI } from 'urijs';

import { buildUrl, getTimePeriod } from './helpers.js';
import { modalRenderFactory } from './tables.js';
import candidatesTemplate from '../templates/candidates.hbs';

function getCandidateCommittees(row, cycle, electionFull) {
  // Build the URL and make a call to the history endpoint
  const url = buildUrl(
    ['candidate', row.candidate_id, 'committees', 'history', cycle],
    { election_full: electionFull }
  );

  return $.getJSON(url).then(function(response) {
    const results = response.results.length ? response.results : {};
    const principalCommittees = [];
    const authorizedCommittees = [];

    results.forEach(function(result) {
      if (result.designation === 'P') {
        principalCommittees.push(result);
      } else if (result.designation === 'A') {
        authorizedCommittees.push(result);
      }
    });

    return {
      principal: principalCommittees,
      authorized: authorizedCommittees
    };
  });
}

function getCandidateFilings(row) {
  const url = buildUrl(['candidate', row.candidate_id, 'filings'], {
    form_type: 'F2'
  });

  return $.getJSON(url).then(function(response) {
    const results = response.results.length ? response.results : {};

    return { last: results[0], first: results[results.length - 1] };
  });
}

export function renderCandidatePanel(showFinancialTotals) {
  return modalRenderFactory(candidatesTemplate, function(row) {
    const query = URI.parseQuery(window.location.search);
    // Parse all of the time-related variables
    const electionYear = query.election_year;
    const cycle = query.cycle || query.election_year || $('#cycle').val();
    const electionFull = query.election_full === 'true' ? true : false;

    // Build a string showing the range covered by the financial totals
    // Only relevant on office pages
    const timePeriod = showFinancialTotals
      ? getTimePeriod(electionYear, cycle, electionFull, row.office)
      : null;

    if (showFinancialTotals) {
      return $.when(
        getCandidateCommittees(row, cycle, electionFull),
        getCandidateFilings(row)
      ).then(function(data1, data2) {
        const newData = {
          committees: data1,
          first_form_2: data2.first,
          last_form_2: data2.last,
          query: query,
          time_period: timePeriod,
          showFinancialTotals: showFinancialTotals
        };
        return _extend({}, row, newData);
      });
    } else {
      return $.when(getCandidateFilings(row)).then(function(data) {
        const newData = {
          first_form_2: data.first,
          last_form_2: data.last,
          showFinancialTotals: showFinancialTotals
        };
        return _extend({}, row, newData);
      });
    }
  });
}
