'use strict';

/**
 * TODO - Loading state?
 * TODO - Error message and state: Selected candidate wasn't a candidate for selected year — DONE?
 * TODO - Error message and state: Selected year isn't an option for selected candidate — DONE?
 * TODO - When the year is changed, double-check against current candidate before requesting data — DONE?
 * TODO - Default election_year from url on initial load (widgets macro?) — DONE?
 * TODO - If user chooses non-President, allow two-year election years (basequery's office, datestamp's math) - DONE?
 * TODO - From ^^, if a senate candidate is chosen, the candidate's details will have those election cycle years included - DONE?
 * TODO - Apply data to map - DONE?
 * TODO - Map legend - DONE?
 * TODO - Make the datestamp above the state list work — DONE?
 * TODO - Add analytics
 * TODO - Figure out why Aggregate Totals Box isn't defaulting to data-year and window.ELECTION_YEAR
 * TODO - For v2 or whatever, convert to datatable (start with the simpliest implementation; no columns.js, etc.)
 * TODO - Stop the pull-downs from changing the URL?
 * TODO - related to ^^, when the year is changed, the candidate name disappears from the typeahead
 * TODO - Make Typeahead save current value and restore if user clicks outside?
 * TODO - Make candidate selection pre-load the most recent data for that candidate - DONE?
 * TODO - Clear default text in places like candidate details - DONE
 * TODO - Comments/documentation throughout
 * TODO - reviews
 * TODO - Style: state list state names line-height is too big (see "District of Columbia") - DONE?
 * TODO - Style: controls should be on one line for medium+ widths - DONE?
 * TODO - change line-height for candidate details holder - DONE?
 * TODO - change line-height for legend text - DONE?
 * TODO - Why are we getting jQuery errors for the toc?
 */
/* global document, context */

/**
 * Based on /fec/static/js/pages/elections.js
 */

// Editable vars
const stylesheetPath = '/static/css/widgets/contributions-by-state.css';
// const breakpointToXS = 0; // retaining just in case
const breakpointToSmall = 430;
const breakpointToMedium = 675;
const breakpointToLarge = 700;
const breakpointToXL = 860;

const $ = require('jquery');
// const _ = require('underscore');

import { buildUrl } from '../modules/helpers';
// const maps = require('../modules/maps');

// const electionUtils = require('../modules/election-utils');
// const helpers = require('../modules/helpers');
// const ElectionForm = require('../modules/election-form').ElectionForm;
// import ElectionForm from '../modules/election-form';

import typeahead from '../modules/typeahead';

const DataMap = require('../modules/data-map').DataMap;

import {
  defaultElectionYear
  // electionYearsOptions,
  // officeDefs
} from './widget-vars';

/**
 * Formats the given value and puts it into the dom element.
 * @param {Number} passedValue - The number to format and plug into the element
 * @param {Boolean} roundToWhole - Should we drop the cents or no?
 * @returns {String} A string of the given value formatted with a dollar sign, commas, and (if roundToWhole === false) decimal
 */
function formatAsCurrency(passedValue, roundToWhole = true) {
  return (
    '$' +
    (roundToWhole
      ? Math.round(passedValue).toLocaleString()
      : passedValue.toLocaleString())
  );
}

/**
 * @param {HTMLSelectElement} yearControl - Set with data-year-control on <script> but not required if data-election-year is set.
 */
function ContributionsByState() {
  this.fetchAbortController = new AbortController();
  this.fetchAbortSignal = this.fetchAbortController.signal;

  // Where to find individual candidate details
  this.basePath_candidatePath = ['candidate'];
  // Where to find the highest-earning candidates:
  this.basePath_highestRaising = ['candidates', 'totals'];
  // Where to find the list of states:
  this.basePath_states = [
    'schedules',
    'schedule_a',
    'by_state',
    'by_candidate'
  ];
  // Where to find the states list grand total:
  this.basePath_statesTotal = [
    'schedules',
    'schedule_a',
    'by_state',
    'by_candidate',
    'totals'
  ];
  // Details about the candidate. Comes from the typeahead
  this.candidateDetails = {};
  // Init the list/table of states and their totals
  this.data_states = {
    results: [
      {
        candidate_id: 'P00000489',
        count: 4075,
        cycle: 1996,
        state: 'NY',
        state_full: 'New York',
        total: 3056478
      }
    ]
  };
  this.element = document.querySelector('#gov-fec-contribs-by-state');
  // Are we waiting for data?
  this.fetchingStates = false;
  this.map;
  this.candidateDetailsHolder;
  this.table;
  this.statesTotalHolder;
  // The typeahead candidate element:
  this.typeahead;
  // The <select> for election years:
  this.yearControl;

  // Populate the examples text because handlebars doesn't like to add the italics/emphasis
  document.querySelector(
    '#gov-fec-contribs-by-state .typeahead-filter .filter__instructions'
  ).innerHTML = 'Examples: <em>Bush, George W</em> or <em>P00003335</em>';

  // If we have the element on the page, fire it up
  if (this.element) this.init();
}

/**
 *
 */
ContributionsByState.prototype.init = function() {
  // Add the stylesheet to the document <head>
  let head = document.head;
  let linkElement = document.createElement('link');
  linkElement.type = 'text/css';
  linkElement.rel = 'stylesheet';
  linkElement.href = stylesheetPath;
  head.appendChild(linkElement);

  // Init the typeahead
  this.typeahead = new typeahead.Typeahead(
    '#contribs-by-state-cand',
    'candidates'
  );
  // this.typeahead.$element.css({ height: 'auto' });
  // Override the default Typeahead behavior and add our own handler
  this.typeahead.$input.off('typeahead:select');
  this.typeahead.$input.on(
    'typeahead:select',
    this.handleTypeaheadSelect.bind(this)
  );

  // Init the election year selector (The element ID is set in data/templates/partials/widgets/contributions-by-state.jinja)
  this.yearControl = document.querySelector('#state-contribs-years');
  this.yearControl.addEventListener(
    'change',
    this.handleElectionYearChange.bind(this)
  );
  this.baseCandidateQuery = {};
  this.baseStatesQuery = {
    // candidate_id: '', // 'P60007168',
    cycle: defaultElectionYear(),
    election_full: true,
    // is_active_candidate: true,
    office: 'P',
    page: 1,
    per_page: 200,
    sort_hide_null: false,
    sort_null_only: false,
    sort_nulls_last: false
    // sort: 'total'
  };

  this.map = $('.map-wrapper .election-map');
  this.candidateDetailsHolder = document.querySelector('.candidate-details');
  this.table = document.querySelector('.state-list-wrapper table');
  this.statesTotalHolder = document.querySelector('.js-states-total');

  this.map = new DataMap(this.map.get(0), {
    colorScale: ['#f0f9e8', '#a6deb4', '#7bccc4', '#2a9291', '#216a7a'],
    colorZero: '#ffffff',
    data: '',
    width: '300',
    height: '300',
    addLegend: true,
    addTooltips: true
    // drawStates: true,
    // handleSelect: this.handleMapSelect.bind(this),
    // src: this.data_states.results,
    // srcUpdateDispatcher: this // TODO - make the map listen to this for data update events
  });

  // Listen for resize events
  window.addEventListener('resize', this.handleResize.bind(this));
  // Call for a resize on init
  this.handleResize();

  this.loadInitialData();
};

/**
 *
 */
ContributionsByState.prototype.loadInitialData = function() {
  // console.log('loadInitialData');
  let instance = this;

  let highestRaisingQuery = Object.assign({}, this.baseStatesQuery, {
    sort: '-receipts',
    per_page: 1,
    sort_hide_null: true
  });

  // console.log('about to query this', highestRaisingQuery);
  window
    .fetch(buildUrl(this.basePath_highestRaising, highestRaisingQuery), {
      cache: 'no-cache',
      mode: 'cors',
      signal: null
    })
    .then(function(response) {
      if (response.status !== 200)
        throw new Error('The network rejected the states request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        instance.data_candidate = data;
        instance.candidateDetails = data.results[0];
        instance.baseStatesQuery.candidate_id =
          instance.candidateDetails.candidate_id;
        instance.baseStatesQuery.office = instance.candidateDetails.office;
        instance.displayUpdatedData_candidate();
      });
    })
    .catch(function() {
      // TODO - handle catch
    });
};

/**
 * Load Candidate details
 */
ContributionsByState.prototype.loadCandidateDetails = function(cand_id) {
  let instance = this;

  this.basePath_candidatePath[1] = cand_id;
  window
    .fetch(buildUrl(this.basePath_candidatePath, this.baseCandidateQuery), {
      cache: 'no-cache',
      mode: 'cors',
      signal: null
    })
    .then(function(response) {
      if (response.status !== 200)
        throw new Error('The network rejected the states request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        // console.log('loadCandidateDetails then() ', data);
        instance.data_candidate = data;
        instance.candidateDetails = data.results[0];
        instance.baseStatesQuery.candidate_id =
          instance.candidateDetails.candidate_id;
        instance.baseStatesQuery.office = instance.candidateDetails.office;
        instance.displayUpdatedData_candidate();
        // let currentQueryYear = ;
        // if (instance.validateCandidateVsElectionYear())
        // instance.loadStatesData();
      });
    })
    .catch(function() {
      // TODO - handle catch
    });
};

/**
 * Starts the data load, called by {@see init}
 * @param {Object} query - The data object for the query, {@see baseStatesQuery}
 */
ContributionsByState.prototype.loadStatesData = function() {
  console.log('loadStatesData()');
  let instance = this;
  // let table = this.table.DataTable();

  let baseStatesQueryWithCandidate = Object.assign({}, this.baseStatesQuery, {
    candidate_id: this.candidateDetails.candidate_id
  });

  // Let's stop any currently-running states fetches
  if (this.fetchingStates) this.fetchAbortController.abort();
  // Start loading the states data
  this.fetchingStates = true;
  this.setLoadingState(true);
  // console.log(
  //   'about to request states data with this: ',
  //   baseStatesQueryWithCandidate
  // );
  window
    .fetch(buildUrl(this.basePath_states, baseStatesQueryWithCandidate), {
      cache: 'no-cache',
      mode: 'cors',
      signal: this.fetchAbortSignal
    })
    .then(function(response) {
      // console.log('fetch.then(response): ', response);
      instance.fetchingStates = false;
      if (response.status !== 200)
        throw new Error('The network rejected the states request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        // console.log('LOADED THE STATES DATA: ', data);

        // Now that we have all of the values combined, let's sort them by total, descending
        data.results.sort((a, b) => {
          return b.total - a.total;
        });

        instance.data_states = data;
        instance.displayUpdatedData_states();
      });
    })
    .catch(function(e) {
      instance.fetchingStates = false;
      // TODO - handle catch
    });

  // Start loading the states total
  window
    .fetch(buildUrl(this.basePath_statesTotal, baseStatesQueryWithCandidate), {
      cache: 'no-cache',
      mode: 'cors',
      signal: null
    })
    .then(function(response) {
      // console.log('states total fetch then: ', response);
      if (response.status !== 200)
        throw new Error('The network rejected the states total request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        console.log('states total data received: ', data);
        instance.displayUpdatedData_total(data);
      });
    })
    .catch(function(e) {
      // console.log('second fetch catch e:', e);
      // TODO - handle catch
    });
};

/**
 *
 */
ContributionsByState.prototype.displayUpdatedData_candidate = function() {
  // console.log('displayUpdatedData_candidate()');
  // console.log('candidateDetails: ', this.candidateDetails);

  // If this is the first load, the typeahead won't have a value; let's set it
  let theTypeahead = document.querySelector('#contribs-by-state-cand');
  if (!theTypeahead.value) theTypeahead.value = this.candidateDetails.name;

  // The block where the candidate details are
  // let candidateDetailsHolder = document.querySelector('.candidate-details');

  let candidateNameElement = this.candidateDetailsHolder.querySelector('h1');
  candidateNameElement.innerHTML = `<a href="/data/candidate/${
    this.candidateDetails.candidate_id
  }/?cycle=${this.baseStatesQuery.cycle}&election_full=true">${
    this.candidateDetails.name
  }</a> [${this.candidateDetails.party}]`;

  let candidateOfficeHolder = this.candidateDetailsHolder.querySelector('h2');
  let theOfficeName = this.candidateDetails.office_full;
  candidateOfficeHolder.innerText = `Candidate for ${
    theOfficeName == 'President' ? theOfficeName.toLowerCase() : theOfficeName
  }`;

  let candidateIdHolder = this.candidateDetailsHolder.querySelector('h3');
  candidateIdHolder.innerText = 'ID: ' + this.candidateDetails.candidate_id;

  // Update the <select>
  // TODO - handle if there are no years
  // TODO - handle if there is only one year
  // console.log('this.candidateDetails: ', this.candidateDetails);
  let validElectionYears = this.candidateDetails.election_years;
  validElectionYears.sort((a, b) => b - a);
  // console.log('validElectionYears: ', validElectionYears);
  let previousElectionYear = this.yearControl.value;
  let nextElectionYear = validElectionYears[0];
  let newSelectOptions = '';
  for (let i = 0; i < validElectionYears.length; i++) {
    newSelectOptions += `<option value="${validElectionYears[i]}"${
      nextElectionYear == validElectionYears[i] ? ' selected' : ''
    }>${validElectionYears[i]}</option>`;
  }
  // console.log('newSelectOptions:', newSelectOptions);
  this.yearControl.innerHTML = newSelectOptions;

  if (previousElectionYear != nextElectionYear) {
    this.baseStatesQuery.cycle = nextElectionYear;
    // let newEvent = new Event('change');
    // this.yearControl.dispatchEvent(newEvent);

    // this.loadStatesData();
  }
  this.loadStatesData();
};

/**
 *
 */
ContributionsByState.prototype.displayUpdatedData_states = function() {
  // console.log('displayUpdatedData_states()');

  // console.log('this.data_states: ', this.data_states);
  let theData = this.data_states;
  let theResults = theData.results;
  let theTableBody = this.table.querySelector('tbody');
  let theTbodyString = '';

  let TODO_remove_temp_total_var = 0;

  for (var i = 0; i < theResults.length; i++) {
    let theStateTotalUrl; // =
    // `/data/receipts/individual-contributions/` +
    // `?candidate_id=${this.candidateDetails.candidate_id}` +
    // `&two_year_transaction_period=${theResults[i].cycle}` +
    // `&contributor_state=${theResults[i].state}`;

    theTbodyString += `<tr><td>${i + 1}.</td><td>${
      theResults[i].state_full
    }</td><td class="t-right-aligned t-mono">`;
    theTbodyString += theStateTotalUrl
      ? `<a href="${theStateTotalUrl}">${formatAsCurrency(
          theResults[i].total,
          true
        )}</a>`
      : `${formatAsCurrency(theResults[i].total, true)}`;
    theTbodyString += `</td></tr>`;
    TODO_remove_temp_total_var += Number(theResults[i].total);
  }
  theTableBody.innerHTML = theTbodyString;

  console.log(
    'TESTING—this is the sum we get when JavaScript sums the non-rounded values of the states list: ',
    TODO_remove_temp_total_var
  );

  this.map.handleDataRefresh(theData);

  this.updateCycleTimeStamp();
  this.setLoadingState(false); // TODO - May want to move this elsewhere
};

/**
 * @param {Object} data
 */
ContributionsByState.prototype.displayUpdatedData_total = function(data) {
  // console.log('displayUpdatedData_total()', data);
  this.statesTotalHolder.innerText = formatAsCurrency(data.results[0].total);
};

/**
 *
 */
ContributionsByState.prototype.updateCycleTimeStamp = function() {
  // console.log('updateCycleTimeStamp()');
  // TODO - account for non-presidential election cycles
  let electionYear = this.baseStatesQuery.cycle;

  let theStartTimeElement = document.querySelector('.js-cycle-start-time');
  let theEndTimeElement = document.querySelector('.js-cycle-end-time');

  let theStartDate;
  if (this.candidateDetails.office == 'P')
    theStartDate = new Date(electionYear - 3, 1, 1);
  else if (this.candidateDetails.office == 'S')
    theStartDate = new Date(electionYear - 5, 1, 1);
  else theStartDate = new Date(electionYear - 1, 1, 1);
  theStartTimeElement.setAttribute(
    'datetime',
    theStartDate.getFullYear() + '-01-01'
  );
  theStartTimeElement.innerText = `01/01/${theStartDate.getFullYear()}`;

  let theEndDate = new Date(electionYear, 1, 1);
  theEndTimeElement.setAttribute(
    'datetime',
    theEndDate.getFullYear() + '-12-31'
  );
  theEndTimeElement.innerText = `12/31/${theEndDate.getFullYear()}`;
};

/**
 * Called when the typeahead element dispatches "typeahead:select"
 * @param {jQuery.Event} e - 'typeahead:select' event
 */
ContributionsByState.prototype.handleTypeaheadSelect = function(
  e,
  abbreviatedCandidateDetails
) {
  // console.log(
  //   'handleTypeaheadSelect() e, abbreviatedCandidateDetails:',
  //   e,
  //   abbreviatedCandidateDetails
  // );
  this.baseStatesQuery.candidate_id = abbreviatedCandidateDetails.id;
  this.loadCandidateDetails(abbreviatedCandidateDetails.id);
};

/**
 * Called on the election year control's change event
 * @param {Event} e
 */
ContributionsByState.prototype.handleElectionYearChange = function(e) {
  console.log('handleElectionYearChange()');
  // console.log('this.yearControl.value: ', this.yearControl.value);
  e.preventDefault();
  this.baseStatesQuery.cycle = this.yearControl.value;
  // We don't need to load the candidate details for a year change, so we'll just jump right to loading the states data.
  this.loadStatesData();
};

/**
 *
 */
ContributionsByState.prototype.handleResize = function(e = null) {
  if (e) e.preventDefault();

  let newWidth = this.element.offsetWidth;

  if (newWidth < breakpointToSmall) {
    // It's XS
    this.element.classList.remove('w-s');
    this.element.classList.remove('w-m');
    this.element.classList.remove('w-l');
    this.element.classList.remove('w-xl');
  } else if (newWidth < breakpointToMedium) {
    // It's small
    this.element.classList.add('w-s');
    this.element.classList.remove('w-m');
    this.element.classList.remove('w-l');
    this.element.classList.remove('w-xl');
  } else if (newWidth < breakpointToLarge) {
    // It's medium
    this.element.classList.remove('w-s');
    this.element.classList.add('w-m');
    this.element.classList.remove('w-l');
    this.element.classList.remove('w-xl');
  } else if (newWidth < breakpointToXL) {
    // It's large
    this.element.classList.remove('w-s');
    this.element.classList.remove('w-m');
    this.element.classList.add('w-l');
    this.element.classList.remove('w-xl');
  } else {
    // It's XL
    this.element.classList.remove('w-s');
    this.element.classList.remove('w-m');
    this.element.classList.remove('w-l');
    this.element.classList.add('w-xl');
  }
};

/**
 *
 * @returns {Boolean} Whether the selected year is in the list of cycles for the selected candidate
 */
ContributionsByState.prototype.validateCandidateVsElectionYear = function() {
  let theErrorBlock = document.querySelector(
    '#gov-fec-contribs-by-state .js-error-message'
  );
  let errorTitle = 'No results';
  let errorMessage = `There is no ${
    this.yearControl.value
  } financial data for this candidate. Try searching a different election year.`;

  if (!this.data_states) errorMessage = '';
  else if (this.candidateDetails.election_years && this.yearControl.value) {
    for (var i = 0; i < this.candidateDetails.election_years.length; i++) {
      if (this.candidateDetails.election_years[i] == this.yearControl.value) {
        errorMessage = '';
        break;
      }
    }
  }

  theErrorBlock.querySelector('h2').innerText = errorTitle;
  theErrorBlock.querySelector('p').innerText = errorMessage;

  if (errorMessage == '') {
    theErrorBlock.classList.remove('has-error');
    theErrorBlock.setAttribute('aria-hidden', 'true');
    return true;
  } else {
    theErrorBlock.classList.add('has-error');
    theErrorBlock.setAttribute('aria-hidden', 'false');
    return false;
  }
};

/**
 *
 * @param {Boolean} newState
 */
ContributionsByState.prototype.setLoadingState = function(newState) {
  if (newState === false) {
    this.element.classList.remove('is-loading');
    this.element
      .querySelector('#state-contribs-years')
      .removeAttribute('disabled');
  } else if (newState === true) {
    this.element.classList.add('is-loading');
    this.element
      .querySelector('#state-contribs-years')
      .setAttribute('disabled', true);
  }
};

/**
 * Handles the usage analytics for this module
 * @todo - Decide how to gather usage insights while embedded
 * @param {String} candID - The candidate ID
 * @param {*} electionYear - String or Number, the user-selected election year
 */
function logUsage(candID, electionYear) {
  if (window.ga) {
    window.ga('send', 'event', {
      eventCategory: 'Widget-ContribsByState',
      eventAction: 'interaction',
      eventLabel: candID + ',' + electionYear
    });
  }
}

new ContributionsByState();
