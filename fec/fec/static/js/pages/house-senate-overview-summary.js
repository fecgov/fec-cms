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
 * Gets this instance built and working
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
 * Takes an election year, deactivates cycleSelect, and starts the data load
 * @param {number|string} electionYear - Which election year / cycle to load
 */
 HSOverviewSummaryTab.prototype.startLoadingData = function(electionYear) {
  // Only do anything if electionYear is an year between 1970 and 2050
  if (parseInt(electionYear) && electionYear >= 1970 && electionYear <= 2050 && electionYear % 2 === 0) {
    this.deactivateInput();

    const instance = this;

    const url_params = {
      aggregate_by: 'office-party',
      api_key: '',
      election_full: true,
      election_year: 2020,
      is_active_candidate: true,
      office: '',
      page: 1,
      per_page: 10,
      sort_hide_null: false,
      sort_null_only: false,
      sort_nulls_last: false
    };
    let theURL = `${window.API_LOCATION}/${window.API_VERSION}/candidates/totals/aggregates/?`;
    url_params.election_year = electionYear;
    url_params.office = window.context.office_code;
    for (let n in url_params) {
      theURL += `${n}=${url_params[n]}&`;
    }

    fetch(
        theURL,
        { cache: 'no-cache', mode: 'cors' }
      )
      .then(response => response.json())
      .then(data => {
        instance.handleDataLoaded(data.results);
      })
      .catch(() => {
        // console.log(`The fetch failed because: ${error}`);
      });
  }
};

/**
 * Removes functionality from the input/select assigned to this.cycleSelector
 */
HSOverviewSummaryTab.prototype.deactivateInput = function () {
  this.cycleSelector.setAttribute('aria-disabled', 'true');
  this.cycleSelector.setAttribute('disabled', 'true');
};

/**
 * Restores functionality from the input/select assigned to this.cycleSelector
 */
HSOverviewSummaryTab.prototype.reactivateInput = function () {
  this.cycleSelector.removeAttribute('aria-disabled');
  this.cycleSelector.removeAttribute('disabled');
};

/**
 * Handles the change/input event from this.cycleSelector
 * @param {Event} e - Change event
 * @param {number} e.target.value - A valid 4-digit integer for an even/election year
 */
HSOverviewSummaryTab.prototype.handleCycleChange = function (e) {
  this.startLoadingData(e.target.value);
};

/**
 * Takes the results, parses them from parties divisions to type combinations, then reactivates cycleSelect.
 * (Takes [{dem numbers}, {rep numbers}, {other numbers}] and converts to [{receipts: {total, dem numbers, rep numbers, other numbers}}])
 * @param {object} results - response.results from the api
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
