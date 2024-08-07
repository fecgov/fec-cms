import { default as _chain } from 'underscore/modules/chain.js';
import { default as _reduce } from 'underscore/modules/reduce.js';

import { buildUrl, currency } from '../modules/helpers.js';

const pathMap = {
  independentExpenditures: ['schedules', 'schedule_e', 'by_candidate'],
  communicationCosts: ['communication_costs', 'by_candidate'],
  electioneering: ['electioneering', 'by_candidate']
};

/**
 * @param {string} type - Values like `independentExpenditures`, `electioneering`, `communicationCosts`
 */
export default function OtherSpendingTotals(type) {
  this.$elm = $('.js-other-spending-totals[data-spending-type=' + type + ']');
  this.type = type;
  this.data = [];
  this.init();
}

OtherSpendingTotals.prototype.fetchData = function(page) {
  // Fetch the data for a given page
  // Page is required because if there's more than 100 results we need
  // to loop through all the pages
  var self = this;
  var url = buildUrl(pathMap[this.type], {
    candidate_id: window.context.candidateID,
    cycle: window.context.cycle,
    election_full: window.context.electionFull,
    page: page,
    per_page: 100
  });

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

/**

 * @param {Array} results - In the format of [{candidate_id: '', candidate_name: '', committee_id: ''…}]
 */
OtherSpendingTotals.prototype.showTotals = function(results) {
  if (this.type === 'electioneering') {
    // Electioneering comms aren't marked as support or oppose, so just add
    // them all together
    var total = _reduce(
      results,
      function(memo, datum) {
        return memo + datum.total;
      },
      0
    );
    this.$elm.find('.js-total-electioneering').html(currency(total));
  } else {
    // Get support and oppose totals by filtering results by the correct indicator
    // and then running _.reduce to add all the values
    var supportTotal = _chain(results)
      .filter(function(value) {
        return value.support_oppose_indicator === 'S';
      })
      .reduce(function(memo, datum) {
        return memo + datum.total;
      }, 0)
      .value();

    var opposeTotal = _chain(results)
      .filter(function(value) {
        return value.support_oppose_indicator === 'O';
      })
      .reduce(function(memo, datum) {
        return memo + datum.total;
      }, 0)
      .value();

    // Update the DOM with the values
    this.$elm.find('.js-support').html(currency(supportTotal));
    this.$elm.find('.js-oppose').html(currency(opposeTotal));
  }
};
