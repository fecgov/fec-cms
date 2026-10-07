/**
 *
 */
import FECContainerQuery from '../modules/container-queries.js';
//import { supportOppose } from '../modules/decoders.js';
import IeMoneyBars from '../modules/ind-exp-money-bars.js';
import PartyMoneyBars from '../modules/party-money-bars.js';

/**
 * Runs the Summary tab at /data/elections/house/ and /data/elections/senate/
 * @class
 * @property {HTMLInputElement} cycleSelector - the <input>
 */
export default function ElectionSummary() {
  this.tabPanel = document.querySelector('#election-summary');
  this.cycleSelector = document.querySelector('.cycle-select #summary-cycle');

  this.init();
  this.startLoadingData(this.cycleSelector.value);
}

/**
 * Gets this instance built and working
 */
ElectionSummary.prototype.init = function() {
  this.cycleSelector.addEventListener('change', this.handleCycleChange.bind(this));

  //TODO, can I combibe the two below and use "new PartyMoneyBars" for both?
  const theFigures = [...document.querySelectorAll('#election-summary figure')];
  // Get first two figures for raising and spending
  theFigures.slice(0, 2).forEach(el => {
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

  const theFiguresIe = document.querySelectorAll('#election-summary-ie figure');
  // Get the last figure for individual expenditures, loop is best approach even though there is only one
  theFiguresIe.forEach(el => {
    new IeMoneyBars(
      `#${el.id} .parties-wrapper`,
      `#${el.id} .js-value-large`,
      {
        eventId: el.dataset.eventFieldId,
        figureGroupClasses: 'grid--flex grid--3-wide',
        figureClasses: 'grid__item'
      }
    );
  });

  new FECContainerQuery('#election-summary', '#summary');

};

/**
 * Takes an election year, deactivates cycleSelect, and starts the data load
 * @param {number|string} electionYear - Which election year / cycle to load
 */

ElectionSummary.prototype.startLoadingData = function(electionYear) {
// Only do anything if electionYear is an year between 1970 and 2050
//if (parseInt(electionYear) && electionYear >= 1970 && electionYear <= 2050 && electionYear % 2 === 0) {
    //this.deactivateInput();
    const instance = this;

    const url_params = {
      aggregate_by: 'office-state-district',
      api_key: window.API_KEY_PUBLIC,
      election_full: true,
      election_year: electionYear,
      is_active_candidate: true,
      office: window.context.election.office_code.toUpperCase(),
      sort_hide_null: false,
      sort_null_only: false,
      sort_nulls_last: false,
      page: 1,
      per_page: 10
    };

    url_params.state = url_params.office == 'P' ? 'US' : window.context.election.state;
    url_params.district = url_params.office == 'P' ? '00' : window.context.election.district;

    let theQstring = '';
    for (let n in url_params) {
      theQstring += `${n}=${url_params[n]}&`;
    }

    const theURL = `${window.API_LOCATION}/${window.API_VERSION}/candidates/totals/aggregates/?${theQstring}`;
    const ieQstring = theQstring.replace('election_year', 'cycle');
    const ieUrl = `${window.API_LOCATION}/${window.API_VERSION}/schedules/schedule_e/all_candidates/support_oppose_totals/?${ieQstring}`;
    //const ieUrl = window.location.origin + '/static/az_suppose_totals.json';

    const allTotals = {};
    const partys = ['DEM', 'REP', 'OTHER'];

    // Helper track to see when the candidate data block is completely ready
    let candidatesRequestsFinished = 0;

    function checkAndRenderCandidates() {
      candidatesRequestsFinished++;
      // Once the 'total' call + all 3 party calls are done (4 requests total)
      if (candidatesRequestsFinished === 4) {
        instance.handleDataLoaded(allTotals);
      }
    }

    // 1. Fetch main totals
    fetch(theURL, { cache: 'no-cache', mode: 'cors' })
      .then(res => res.json())
      .then(data => {
        allTotals['total'] = data.results;
        checkAndRenderCandidates();
      })
      //.catch(err => console.error('Error fetching grand total:', err));
       .catch(() => {
        // console.log(`The fetch failed because: ${error}`);
      });

    // 2. Fetch party totals
    partys.forEach(party => {
      fetch(`${theURL}party=${party}`, { cache: 'no-cache', mode: 'cors' })
        .then(res => res.json())
        .then(data => {
          allTotals[party] = data.results;
          checkAndRenderCandidates();
        })
        //.catch(err => console.error(`Error fetching ${party} total:`, err));
         .catch(() => {
        // console.log(`The fetch failed because: ${error}`);
      });
    });

    // 3. Fetch the slow independent expenditures independently
    // This will NOT block the rest of the page from loading
    fetch(ieUrl, { cache: 'no-cache', mode: 'cors' })
      .then(res => res.json())
      .then(data => {
        const result = data.results.reduce((accumulator, currentItem) => {
          const amount = currentItem.ie_total;
          const indicator = currentItem.support_oppose_indicator;

          accumulator.total += amount;
          if (Object.hasOwn(accumulator, indicator)) {
            accumulator[indicator] += amount;
          }
          return accumulator;
        }, { total: 0, S: 0, O: 0, Others: 0 });

        // Save to instance directly
        instance.total_independent_expenditures = result;
        allTotals['support_oppose'] = result;

        // Proactively update the UI with just the independent expenditure data once it arrives
        if (typeof instance.handleIndependentExpendituresLoaded === 'function') {
          instance.handleIndependentExpendituresLoaded(result);
        } else {
          // Fallback: re-trigger main loader if you don't have a specific sub-render function
          instance.handleDataLoaded(allTotals);
        }
      })
      //.catch(err => console.error('Error fetching independent expenditures:', err));
       .catch(() => {
        // console.log(`The fetch failed because: ${error}`);
      });

//}; END - if (parseInt(electionYear) && ...
};

/**
 * Removes functionality from the input/select assigned to this.cycleSelector
 */
ElectionSummary.prototype.deactivateInput = function() {
  this.cycleSelector.setAttribute('aria-disabled', 'true');
  this.cycleSelector.setAttribute('disabled', 'true');
};

/**
 * Restores functionality from the input/select assigned to this.cycleSelector
 */
ElectionSummary.prototype.reactivateInput = function() {
  this.cycleSelector.removeAttribute('aria-disabled');
  this.cycleSelector.removeAttribute('disabled');
};

/**
 * Handles the change/input event from this.cycleSelector
 * @param {Event} e - Change event
 * @param {number} e.target.value - A valid 4-digit integer for an even/election year
 */
ElectionSummary.prototype.handleCycleChange = function (e) {
  this.startLoadingData(e.target.value);
};

/**
 * Takes the results, parses them from parties divisions to type combinations, then reactivates cycleSelect.
 * (Takes [{dem numbers}, {rep numbers}, {other numbers}] and converts to [{receipts: {total, dem numbers, rep numbers, other numbers}}])
 * @param {Object} results - response.results from the api
 */

ElectionSummary.prototype.handleDataLoaded = function(results) {
  const usefulResults = {
    total_cash_on_hand_end_period: { total: 0, DEM: 0, REP: 0, OTHER: 0 },
    total_debts_owed_by_committee: { total: 0, DEM: 0, REP: 0, OTHER: 0 },
    total_disbursements: { total: 0, DEM: 0, REP: 0, OTHER: 0 },
    total_individual_itemized_contributions: { total: 0, DEM: 0, REP: 0, OTHER: 0 },
    total_other_political_committee_contributions: { total: 0, DEM: 0, REP: 0, OTHER: 0 },
    total_receipts: { total: 0, DEM: 0, REP: 0, OTHER: 0 },
    total_transfers_from_other_authorized_committee: { total: 0, DEM: 0, REP: 0, OTHER: 0 },
    total_independent_expenditures: this.total_independent_expenditures//{ total: 0, S: 0, A: 0, O: 0 },
  };

  // Google's
  for (const [key, value] of Object.entries(results)) {
      for (const val of Object.values(value)) {
        for (const item in val) {
          if (item.startsWith('total_')) {
            // Updated to use the local 'value' variable instead of reaching back to 'results[key]'
            usefulResults[item][key] = value[0][item];
          }
        }
      }
  }

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
  new ElectionSummary();
});
