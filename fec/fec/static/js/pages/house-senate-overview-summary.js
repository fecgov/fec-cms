//

import { PartyMoneyBars } from '../modules/party-money-bars';

/**
 * Runs the Summary tab at /data/elections/house/ and /data/elections/senate/
 * @class
 * @property {HTMLInputElement} cycleSelector - the <input>
 */
function HSOverviewSummaryTab() {
  this.tabPanel = document.querySelector('#election-summary');
  this.cycleSelector = document.querySelector('#election-summary .js-period-select');

  this.init();
  this.startLoadingData(this.cycleSelector.value);
}

/**
 * 
 */
HSOverviewSummaryTab.prototype.init = function() {
  this.cycleSelector.addEventListener('change', this.handleCycleChange.bind(this));

  const theFigures = document.querySelectorAll('#section-election-summary figure');
  theFigures.forEach(el => {
    // const elId = el.id;
    new PartyMoneyBars(
      `#${el.id} .parties-wrapper`,
      `#${el.id} .js-value-large`,
      {
        eventId: el.dataset.eventFieldId,
        figureGroupClasses: 'grid--flex grid--3-wide',
        figureClasses: 'grid__item'
      }
    );
  });
};

/**
 * 
 * @param {number|string} electionYear - Which election year / cycle to load
 */
 HSOverviewSummaryTab.prototype.startLoadingData = function(electionYear) {
  this.deactivateInput();

  const instance = this;

  let theURL = 'http://fec-dev-api.app.cloud.gov/v1/candidates/totals/aggregates/';
  theURL += '?election_full=true&is_active_candidate=true&per_page=10&aggregate_by=office-party';
  theURL += `&election_year=${electionYear}&office=${window.context.office_code}&api_key=`;

  fetch(
      `${theURL}&aggregate_by=office`,
      { cache: 'no-cache', mode: 'cors' }
    )
    .then(response => response.json())
    .then(data => {
      instance.handleDataLoaded(data.results);
    })
    .catch(error => {
      // console.log(`The fetch failed because: ${error}`);
    });

};

/**
 * 
 */
HSOverviewSummaryTab.prototype.deactivateInput = function () {
  this.cycleSelector.setAttribute('aria-disabled', 'true');
  this.cycleSelector.setAttribute('disabled', 'true');
};

/**
 * 
 */
HSOverviewSummaryTab.prototype.reactivateInput = function () {
  this.cycleSelector.removeAttribute('aria-disabled');
  this.cycleSelector.removeAttribute('disabled');
};


/**
 * 
 * @param {Event} e - 
 */
HSOverviewSummaryTab.prototype.handleCycleChange = function (e) {
  this.startLoadingData(e.target.value);
};

/**
 * 
 * @param {results} cycleYear 
 */
HSOverviewSummaryTab.prototype.handleDataLoaded = function(results) {
  const usefulResults = {
    total_cash_on_hand_end_period: { total: 0, DEM: 0, REP: 0, Other: 0 },
    total_debts_owed_by_committee: { total: 0, DEM: 0, REP: 0, Other: 0 },
    total_disbursements: { total: 0, DEM: 0, REP: 0, Other: 0 },
    total_individual_itemized_contributions: { total: 0, DEM: 0, REP: 0, Other: 0 },
    total_other_political_committee_contributions: { total: 0, DEM: 0, REP: 0, Other: 0 },
    total_receipts: { total: 0, DEM: 0, REP: 0, Other: 0 },
    total_transfers_from_other_authorized_committee: { total: 0, DEM: 0, REP: 0, Other: 0 }
  };

  // Data comes in divided by parties but we need them divided by field/key.
  // For each result (each political party's numbers)
  results.forEach(el => {
    // For each field/key,
    for (let prop in el) {
      // Only if its name starts with 'total_'
      if (prop.indexOf('total_') === 0) {
        usefulResults[prop][el.party] = el[prop]; // Set this party's value onto usefulResults
        usefulResults[prop].total += el[prop]; // Increment field's total with this party's value
      }
    }
  });

  // Let's do some math to get real total_contributions
  usefulResults.total_contributions = {
    total:
      usefulResults.total_individual_itemized_contributions.total
      + usefulResults.total_other_political_committee_contributions.total
      + usefulResults.total_transfers_from_other_authorized_committee.total,
    DEM:
      usefulResults.total_individual_itemized_contributions.DEM
      + usefulResults.total_other_political_committee_contributions.DEM
      + usefulResults.total_transfers_from_other_authorized_committee.DEM,
    REP:
      usefulResults.total_individual_itemized_contributions.REP
      + usefulResults.total_other_political_committee_contributions.REP
      + usefulResults.total_transfers_from_other_authorized_committee.REP,
    Other:
      usefulResults.total_individual_itemized_contributions.Other
      + usefulResults.total_other_political_committee_contributions.Other
      + usefulResults.total_transfers_from_other_authorized_committee.Other
  };
  // And remove the combined values from usefulResults (since they're no longer useful).
  delete usefulResults.total_individual_itemized_contributions;
  delete usefulResults.total_other_political_committee_contributions;
  delete usefulResults.total_transfers_from_other_authorized_committee;

  for (let key in usefulResults) {
    const newEvent = new CustomEvent('fec_data_refresh', {
      bubbles: true,
      detail: {
        id: key,
        value: usefulResults[key]
      }
    });
    this.tabPanel.dispatchEvent(newEvent);
  }

  this.reactivateInput();
};

/**
 * Now let's wait for the page to load and start making elements work
 */
window.addEventListener('load', () => {
  new HSOverviewSummaryTab();
});

module.exports = { HSOverviewSummaryTab };
