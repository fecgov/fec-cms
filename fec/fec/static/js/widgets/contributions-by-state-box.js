'use strict';

/**
 * @fileoverview  
 * @author        Robert, fec.gov
 * @version       0.1
 * TODO - Add an initial "loading" state?
 * TODO - Figure out why Aggregate Totals Box isn't defaulting to data-year and window.ELECTION_YEAR
 * TODO - For v2 or whatever, convert to datatable.net (start with the simpliest implementation; no columns.js, etc.)
 * TODO - Stop the year pull-down from changing the URL?
 * TODO - related to ^^, when the year is changed, the candidate name disappears from the typeahead (and shouldn't)
 * TODO - Make Typeahead save current value and restore if user clicks outside?
 * TODO - Methodology functionality
 * TODO - reviews
 * TODO - Why are we getting jQuery errors for the toc?
 * TODO - Test on Firefox, Safari, Internet Explorer, Edge pre-Chromium, Edge post-Chromium
 */
/* global document, context */

/**
 
 * 
 * 
 */
// Editable vars
const stylesheetPath = '/static/css/widgets/contributions-by-state.css';
// const breakpointToXS = 0; // retaining just in case
const breakpointToSmall = 430;
const breakpointToMedium = 675;
const breakpointToLarge = 700;
const breakpointToXL = 860;

import { buildUrl } from '../modules/helpers';
import typeahead from '../modules/typeahead';
import { defaultElectionYear } from './widget-vars';
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';

const DataMap = require('../modules/data-map').DataMap;
const AbortController = window.AbortController;

/**
 * Formats the given value and puts it into the dom element.
 * @param {Number} passedValue - The number to format and plug into the element
 * @param {Boolean} roundToWhole - Should we round the cents or no?
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
 * @constructor
 */
function ContributionsByState() {
  // Get ready to abort a fetch if we need to
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
  // Init the list/table of states and their totals // TODO - empty this?
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
  this.element = document.querySelector('#gov-fec-contribs-by-state'); // The visual element associated with this, this.instance
  this.fetchingStates = false; // Are we waiting for data?
  this.map; // Starts as the element for the map but then becomes a DataMap object
  this.candidateDetailsHolder; // Element to hold candidate name, party, office, and ID
  this.table; // The <table> for the list of states and their totals
  this.statesTotalHolder; // Element at the bottom of the states list
  this.typeahead; // The typeahead candidate element:
  this.yearControl; // The <select> for election years:

  // Populate the examples text because handlebars doesn't like to add the italics/emphasis
  document.querySelector(
    '#gov-fec-contribs-by-state .typeahead-filter .filter__instructions'
  ).innerHTML = 'Examples: <em>Bush, George W</em> or <em>P00003335</em>';

  // If we have the element on the page, fire it up
  if (this.element) this.init();
}

/**
 * Called after construction.
 * Identifies and initializes the various visual elements and controls, queries, and starts first data load
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

  // Override the default Typeahead behavior and add our own handler
  this.typeahead.$input.off('typeahead:select');
  this.typeahead.$input.on(
    'typeahead:select',
    this.handleTypeaheadSelect.bind(this)
  );

  // Init the election year selector (The element ID is set in data/templates/partials/widgets/contributions-by-state.jinja)
  // TODO - Can we remove the default listener (like with the typeahead above) and not change the URL when the <select> changes?
  this.yearControl = document.querySelector('#state-contribs-years');
  this.yearControl.addEventListener(
    'change',
    this.handleElectionYearChange.bind(this)
  );
  
  // Initialize the various queries
  this.baseCandidateQuery = {}; // Calls for candidate details
  this.baseStatesQuery = {
    cycle: defaultElectionYear(),
    election_full: true,
    office: 'P',
    page: 1,
    per_page: 200,
    sort_hide_null: false,
    sort_null_only: false,
    sort_nulls_last: false
    // candidate_id: '', // 'P60007168',
    // is_active_candidate: true,
    // sort: 'total'
  };

  // Find the visual elements
  this.map = document.querySelector('.map-wrapper .election-map');
  this.candidateDetailsHolder = document.querySelector('.candidate-details');
  this.table = document.querySelector('.state-list-wrapper table');
  this.statesTotalHolder = document.querySelector('.js-states-total');

  // Fire up the map
  this.map = new DataMap(this.map, {
    colorScale: ['#f0f9e8', '#a6deb4', '#7bccc4', '#2a9291', '#216a7a'],
    colorZero: '#ffffff',
    data: '',
    addLegend: true,
    addTooltips: true
  });

  // Listen for resize events
  window.addEventListener('resize', this.handleResize.bind(this));
  // Call for a resize on init
  this.handleResize();

  // And start the first load
  this.loadInitialData();
};

/**
 * Called by {@see init() , @see handleTypeaheadSelect() }
 * Finds the highest-earning presidential candidate of the default year
 * Similar to {@see loadCandidateDetails() }
 */
ContributionsByState.prototype.loadInitialData = function() {
  let instance = this;

  let highestRaisingQuery = Object.assign({}, this.baseStatesQuery, {
    sort: '-receipts',
    per_page: 1,
    sort_hide_null: true
  });

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
        // Save the candidate query reply
        instance.data_candidate = data;
        // and the candidate details specifically
        instance.candidateDetails = data.results[0];
        // Update the candidate_id for the main query
        instance.baseStatesQuery.candidate_id =
          instance.candidateDetails.candidate_id;
        // Update the office to the main query, too.
        instance.baseStatesQuery.office = instance.candidateDetails.office;
        // Put the new candidate information on the page
        instance.displayUpdatedData_candidate();
      });
    })
    .catch(function() {
      // TODO - handle catch
    });
};

/**
 * Retrieves full candidate details when the typeahead is used
 * Called from {@see handleTypeaheadSelect() }
 * Similar to {@see loadInitialData() }
 * @param {String} cand_id Comes from the typeahead
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
        // Save the candidate query response
        instance.data_candidate = data;
        // Save the candidate details
        instance.candidateDetails = data.results[0];
        // Update the base query with the new candidate ID
        instance.baseStatesQuery.candidate_id =
          instance.candidateDetails.candidate_id;
        // Save the office to the base query, too
        instance.baseStatesQuery.office = instance.candidateDetails.office;
        // Then put the new candidate details into the page
        instance.displayUpdatedData_candidate();
      });
    })
    .catch(function() {
      // TODO - handle catch
    });
};

/**
 * Starts the fetch to go get the big batch of states data, called by {@see init() }
 */
ContributionsByState.prototype.loadStatesData = function() {
  console.log('loadStatesData()');
  let instance = this;

  let baseStatesQueryWithCandidate = Object.assign({}, this.baseStatesQuery, {
    candidate_id: this.candidateDetails.candidate_id
  });

  // Let's stop any currently-running states fetches
  if (this.fetchingStates) this.fetchAbortController.abort();
  // Start loading the states data
  this.fetchingStates = true;
  this.setLoadingState(true);

  window
    .fetch(buildUrl(this.basePath_states, baseStatesQueryWithCandidate), {
      cache: 'no-cache',
      mode: 'cors',
      signal: this.fetchAbortSignal
    })
    .then(function(response) {
      instance.fetchingStates = false;
      if (response.status !== 200)
        throw new Error('The network rejected the states request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        console.log('Received the states data: ', data);

        // Now that we have all of the values, let's sort them by total, descending
        data.results.sort((a, b) => {
          return b.total - a.total;
        });

        // After they're sorted, let's hang on to them
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

  logUsage(this.baseStatesQuery.candidate_id, this.baseStatesQuery.cycle);
};

/**
 * Puts the candidate details in the page,
 * then loads the states data with {@see loadStatesData() }
 */
ContributionsByState.prototype.displayUpdatedData_candidate = function() {
  // console.log('displayUpdatedData_candidate()');
  // console.log('candidateDetails: ', this.candidateDetails);

  // If this is the first load, the typeahead won't have a value; let's set it
  let theTypeahead = document.querySelector('#contribs-by-state-cand');
  if (!theTypeahead.value) theTypeahead.value = this.candidateDetails.name;

  // Handle the candidate's name…
  let candidateNameElement = this.candidateDetailsHolder.querySelector('h1');
  candidateNameElement.innerHTML = `<a href="/data/candidate/${
    this.candidateDetails.candidate_id
  }/?cycle=${this.baseStatesQuery.cycle}&election_full=true">${
    this.candidateDetails.name
  }</a> [${this.candidateDetails.party}]`;

  // …their desired office during this election…
  let candidateOfficeHolder = this.candidateDetailsHolder.querySelector('h2');
  let theOfficeName = this.candidateDetails.office_full;
  candidateOfficeHolder.innerText = `Candidate for ${
    theOfficeName == 'President' ? theOfficeName.toLowerCase() : theOfficeName
  }`;

  // …and their candidate ID for this office
  let candidateIdHolder = this.candidateDetailsHolder.querySelector('h3');
  candidateIdHolder.innerText = 'ID: ' + this.candidateDetails.candidate_id;

  // Update the <select>
  // TODO - handle if there are no years
  // TODO - handle if there is only one year
  // console.log('this.candidateDetails: ', this.candidateDetails);
  // Grab election_years from the candidate details
  let validElectionYears = this.candidateDetails.election_years;
  // Sort them so the most recent is first so it'll be on top of the <select>
  validElectionYears.sort((a, b) => b - a);
  // Remember what year's election we're currently showing (will help if we were switching between candidates of the same year)
  let previousElectionYear = this.yearControl.value;
  // We'll show the most recent election of these options
  let nextElectionYear = validElectionYears[0];
  // Build the <option><option> list
  let newSelectOptions = '';
  for (let i = 0; i < validElectionYears.length; i++) {
    newSelectOptions += `<option value="${validElectionYears[i]}"${
      nextElectionYear == validElectionYears[i] ? ' selected' : ''
    }>${validElectionYears[i]}</option>`;
  }
  // Put the new options into the <select>
  this.yearControl.innerHTML = newSelectOptions;

  // If the previous election and this one are different
  if (previousElectionYear != nextElectionYear) {
    // Save the new election year to the base query
    this.baseStatesQuery.cycle = nextElectionYear;
    // TODO - Do we want to dispatch an event and only reload if we need to?
    // TODO - I think this was going on direction but we changed functionality and now it's irrelevant
    // let newEvent = new Event('change');
    // this.yearControl.dispatchEvent(newEvent);

    // this.loadStatesData();
  }
  // Load the new states data
  this.loadStatesData();
};

/**
 * Put the list of states and totals into the table
 * Called by {@see loadStatesData() }
 * TODO - This will eventually be replaced by the datatables functionality
 */
ContributionsByState.prototype.displayUpdatedData_states = function() {
  let theData = this.data_states;
  let theResults = theData.results;
  let theTableBody = this.table.querySelector('tbody');
  let theTbodyString = '';

  let TODO_remove_temp_total_var = 0;

  for (var i = 0; i < theResults.length; i++) {
    // TODO - If we need to make the totals clickable, we'll do that here.
    // TODO - Note: Couldn't find the way to query an entire election for a state-candidate combo
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

  // TODO This will go away. It's only here to compare the calculated total with the total from the API
  console.log(
    'TESTING—this is the sum we get when JavaScript sums the non-rounded values of the states list: ',
    TODO_remove_temp_total_var
  );

  // Let the map know that the data has been updated // TODO - handle this with a listener?
  this.map.handleDataRefresh(theData);

  // Update the time stamp above the states list
  this.updateCycleTimeStamp();

  // Clear the classes and reset functionality so the tool is usable again
  this.setLoadingState(false); // TODO - May want to move this elsewhere
};

/**
 * Puts the states grand total into the total field at the bottom of the table
 * Called by its fetch inside {@see loadStatesData() }
 * @param {Object} data The results from the fetch
 */
ContributionsByState.prototype.displayUpdatedData_total = function(data) {
  this.statesTotalHolder.innerText = formatAsCurrency(data.results[0].total);
};

/**
 * Reads the date and office type and puts the correct date into the paqe, above the list of states
 * Called from inside {@see displayUpdatedData_states() }
 */
ContributionsByState.prototype.updateCycleTimeStamp = function() {
  let electionYear = this.baseStatesQuery.cycle;

  // Remember the in-page elements
  let theStartTimeElement = document.querySelector('.js-cycle-start-time');
  let theEndTimeElement = document.querySelector('.js-cycle-end-time');

  // If the election type is P, the start date is 1 January, three years previous
  // Likewise, five years previous if S, or just one year previous for H
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
  // Put it into the start time
  theStartTimeElement.innerText = `01/01/${theStartDate.getFullYear()}`;

  // And the end date is just 31 December of the election_year
  let theEndDate = new Date(electionYear, 1, 1);
  theEndTimeElement.setAttribute(
    'datetime',
    theEndDate.getFullYear() + '-12-31'
  );
  // Finally put the ending year into the end time element
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
  // Remember the chosen candidate_id
  this.baseStatesQuery.candidate_id = abbreviatedCandidateDetails.id;
  // But we need more details (like election_years) so we need to go get those
  this.loadCandidateDetails(abbreviatedCandidateDetails.id);
};

/**
 * Called on the election year control's change event
 * Starts loading the new data
 * @param {Event} e
 */
ContributionsByState.prototype.handleElectionYearChange = function(e) {
  console.log('handleElectionYearChange()');
  e.preventDefault();
  this.baseStatesQuery.cycle = this.yearControl.value;
  // We don't need to load the candidate details for a year change, so we'll just jump right to loading the states data.
  this.loadStatesData();
};

/**
 * Listens to window resize events and adjusts the classes for the <aside> based on its width
 * (rather than the page's width, which is problematic when trying to determine whethr there's a side nav)
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
 * Controls class names and functionality of the widget
 * Called when we start and complete (@see loadStatesData() )
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
