'use strict';

/* global require, context */

var $ = require('jquery');
var _ = require('underscore');

var helpers = require('../modules/helpers');

var pathMap = {
  'independentExpenditures': '/schedules/schedule_e/by_candidate/',
  'communicationCosts': '/communication_costs/by_candidate/',
  'electioneering': '/electioneering/by_candidate/'
};

function OtherSpendingTotals(type) {
  this.$elm = $('.js-other-spending-totals[data-spending-type='+ type + ']');
  this.type = type;
  this.data = [];
  this.init();
}

OtherSpendingTotals.prototype.fetchData = function(page) {
  // Fetch the data for a given page
  // Page is required because if there's more than 100 results we need
  // to loop through all the pages
  var self = this;
  var url = helpers.buildUrl(
    pathMap[this.type],
    {
      candidate_id: context.candidateID,
      cycle: context.cycle,
      election_full: context.electionFull,
      page: page,
      per_page: 100
    }
  );

  $.getJSON(url).done(function(data) {
    var currentPage = data.pagination.page;
    if (data.results.length === 0) {
      // If no results, remove the component
      self.$elm.remove();
    } else {
      // Add the results to the existing data array
      self.data = self.data.concat(data.results);
      if (currentPage === data.pagination.pages) {
        // If we're on the last page, show the totals
        self.showTotals(self.data);
      } else {
        // Otherwise fetch data for the next page
        var nextPage = currentPage + 1;
        self.fetchData(nextPage);
      }
    }
  });
};

OtherSpendingTotals.prototype.init = function() {
  this.fetchData();
};

OtherSpendingTotals.prototype.showTotals = function(results) {
  if (this.type === 'electioneering') {
    // Electioneering comms aren't marked as support or oppose, so just add
    // them all together
    var total = _.reduce(results, function(memo, datum) {
        return  memo + datum.total;
      }, 0);
      this.$elm.find('.js-total-electioneering').html(helpers.currency(total));
  } else {
    // Get support and oppose totals by filtering results by the correct indicator
    // and then running _.reduce to add all the values
    var supportTotal = _.chain(results)
      .filter(function(value) {
        return value.support_oppose_indicator === 'S';
      })
      .reduce(function(memo, datum) {
        return  memo + datum.total;
      }, 0)
      .value();

    var opposeTotal = _.chain(results)
      .filter(function(value) {
        return value.support_oppose_indicator === 'O';
      })
      .reduce(function(memo, datum) {
        return  memo + datum.total;
      }, 0)
      .value();

    // Update the DOM with the values
    this.$elm.find('.js-support').html(helpers.currency(supportTotal));
    this.$elm.find('.js-oppose').html(helpers.currency(opposeTotal));

  }
};

module.exports = OtherSpendingTotals;
