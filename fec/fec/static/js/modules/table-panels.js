'use strict';

var $ = require('jquery');
var _ = require('underscore');
var helpers = require('../modules/helpers');
var URI = require('urijs');
var tables = require('./tables');

var candidatesTemplate = require('../templates/candidates.hbs');

function getCandidateCommittees(row, cycle, electionFull) {
  // Build the URL and make a call to the history endpoint
  var url = helpers.buildUrl(
    ['candidate', row.candidate_id, 'committees', 'history', cycle],
    { election_full: electionFull }
  );

  return $.getJSON(url).then(function(response) {
    var results = response.results.length ? response.results : {};
    var principalCommittees = [],
      authorizedCommittees = [];

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
  var url = helpers.buildUrl(['candidate', row.candidate_id, 'filings'], {
    form_type: 'F2'
  });

  return $.getJSON(url).then(function(response) {
    var results = response.results.length ? response.results : {};

    return { last: results[0], first: results[results.length - 1] };
  });
}

var renderCandidatePanel = function(showFinancialTotals) {
  return tables.modalRenderFactory(candidatesTemplate, function(row) {
    var query = URI.parseQuery(window.location.search);
    // Parse all of the time-related variables
    var electionYear = query.election_year;
    var cycle = query.cycle || query.election_year || $('#cycle').val();
    var electionFull = query.election_full === 'true' ? true : false;

    // Build a string showing the range covered by the financial totals
    // Only relevant on office pages
    var timePeriod = showFinancialTotals
      ? helpers.getTimePeriod(electionYear, cycle, electionFull, row.office)
      : null;

    if (showFinancialTotals) {
      return $.when(
        getCandidateCommittees(row, cycle, electionFull),
        getCandidateFilings(row)
      ).then(function(data1, data2) {
        var newData = {
          committees: data1,
          first_form_2: data2.first,
          last_form_2: data2.last,
          query: query,
          time_period: timePeriod,
          showFinancialTotals: showFinancialTotals
        };
        return _.extend({}, row, newData);
      });
    } else {
      return $.when(getCandidateFilings(row)).then(function(data) {
        var newData = {
          first_form_2: data.first,
          last_form_2: data.last,
          showFinancialTotals: showFinancialTotals
        };
        return _.extend({}, row, newData);
      });
    }
  });
};

module.exports = {
  renderCandidatePanel: renderCandidatePanel
};
