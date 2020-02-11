'use strict';

/* global CustomEvent */

/**
 * TODO - @fileoverview
 * @copyright 2020 Federal Election Commission
 * @license CC0-1.0
 * @owner  fec.gov
 * @version 1.0
 */

// Editable vars
const stylesheetPath = '/static/css/widgets/pres-finance-map.css';
// const breakpointToXS = 0; // retaining just in case
const breakpointToSmall = 430;
const breakpointToMedium = 675;
const breakpointToLarge = 700;
const breakpointToXL = 860;
const availElectionYears = [2020, 2016]; // defaults to [0]
const specialCandidateIDs = ['P00000001', 'P00000002', 'P00000003'];
// const rootPathToIndividualContributions =
//   '/data/receipts/individual-contributions/';

import { buildUrl } from '../modules/helpers';
// import { defaultElectionYear } from './widget-vars';
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';

const DataMap = require('../modules/data-map').DataMap;
const AbortController = window.AbortController;

// Custom event names
const EVENT_APP_ID = 'gov.fec.presFinMap';
const YEAR_CHANGE_EVENT = EVENT_APP_ID + '_yearChange';
const ENTER_LOADING_EVENT = EVENT_APP_ID + '_loading';
const FINISH_LOADING_EVENT = EVENT_APP_ID + '_loaded';
const CHANGE_CANDIDATES_DATA = EVENT_APP_ID + '_candidates_change';
const CHANGE_CANDIDATE = EVENT_APP_ID + '_candidate_change';
const CANDIDATE_DETAILS_LOADED = EVENT_APP_ID + '_cand_detail_loaded';

/**
 * Formats the given value and puts it into the dom element.
 * @param {Number} passedValue The number to format and plug into the element
 * @param {Boolean} roundToWhole Should we round the cents or no?
 * @returns {String} A string of the given value formatted with a dollar sign, commas, and (if roundToWhole === false) decimal
 */
function formatAsCurrency(passedValue, abbreviateMillions) {
  let toReturn = passedValue;

  if (abbreviateMillions) {
    // There's an issue when adding commas to the currency when there's a decimal
    // So we're going to break it apart, add commas, then put it back together
    toReturn = (passedValue / 1000000).toFixed(1);
    let commaPos = toReturn.indexOf('.');
    let firstHalf = toReturn.substr(0, commaPos);
    let secondHalf = toReturn.substr(commaPos); // grabs the decimal, too
    toReturn = firstHalf.replace(/\d(?=(\d{3})+$)/g, '$&,') + secondHalf;
  } else {
    toReturn = Math.round(passedValue.round).replace(/\d(?=(\d{3})+$)/g, '$&,');
  }

  return '$' + toReturn;
}

/**
 * Builds the link/url to a filtered Individual Contributions page/list
 * @param {Number} cycle The candidate's election year
 * @param {String} office 'H', 'P', or 'S'
 * @param {Array} committeeIDs An array of strings of the candidate's committees
 * @param {String} stateID Optional. A null value will not filter for any state but show entries for the entire country
 * @returns {String} URL or empty string depending on
 */
function buildIndividualContributionsUrl(
  cycle,
  office,
  committeeIDs,
  stateID,
  candidateState
) {
  // If we're missing required params, just return '' and be done
  // if (!cycle || !office || !committeeIDs) return '';
  // let transactionPeriodsString = 'two_year_transaction_period=' + cycle;
  // // TODO: Do we need maxDate and minDate?
  // // let maxDate = `12-13-${this.baseStatesQuery.cycle}`;
  // // let minDate = `01-01-${this.baseStatesQuery.cycle - 1}`;
  // let committeesString = '';
  // // The API currently wants a two_year_transaction_period value for each set of two years
  // // so we'll add the previous two-year period for presidential races
  // //
  // // Also, Puerto Rico's House elections are for four years so we'll need to
  // // add the previous two-year period to the query string for House candidates from Puerto Rico
  // if (office == 'P' || (office == 'H' && candidateState == 'PR')) {
  //   transactionPeriodsString += '&two_year_transaction_period=' + (cycle - 2);
  //   // and the two earlier two-year periods for Senate races
  // } else if (office == 'S') {
  //   transactionPeriodsString += '&two_year_transaction_period=' + (cycle - 2);
  //   transactionPeriodsString += '&two_year_transaction_period=' + (cycle - 4);
  // }
  // for (let i = 0; i < committeeIDs.length; i++) {
  //   committeesString += '&committee_id=' + committeeIDs[i];
  // }
  // let stateString = stateID ? '&contributor_state=' + stateID : '';
  // let toReturn =
  //   rootPathToIndividualContributions +
  //   '?' +
  //   transactionPeriodsString +
  //   stateString +
  //   committeesString;
  // // TODO: Do we need maxDate and minDate?
  // // `&min_date=${minDate}&max_date=${maxDate}` +
  // return toReturn;
}

/**
 * @constructor
 */
function PresidentialFundsMap() {
  // Get ready to abort a fetch if we need to
  this.fetchAbortController = new AbortController();
  this.fetchAbortSignal = this.fetchAbortController.signal;

  // Where to find the list of candidates
  this.basePath_candidatesList = [
    'presidential',
    'contributions',
    'by_candidate'
  ];

  // Where to find individual candidate details
  this.basePath_candidateDetails = ['candidate'];

  // // Where to find individual candidate details
  // this.basePath_candidateCommitteesPath = [
  //   'candidate',
  //   '000', // candidate ID
  //   'committees',
  //   'history',
  //   2020 // election year / cycle
  // ];
  // // Where to find candidate's coverage dates
  // this.basePath_candidateCoverageDatesPath = [
  //   'candidate',
  //   '000', //candidate ID
  //   'totals'
  // ];
  // // Where to find the highest-earning candidates:
  // this.basePath_highestRaising = ['candidates', 'totals'];
  // // Where to find the list of states:
  // this.basePath_states = [
  //   'schedules',
  //   'schedule_a',
  //   'by_state',
  //   'by_candidate'
  // ];
  // // Where to find the states list grand total:
  // this.basePath_statesTotal = [
  //   'schedules',
  //   'schedule_a',
  //   'by_state',
  //   'by_candidate',
  //   'totals'
  // ];
  this.data_candidates;
  // // Details about the candidate. Comes from the typeahead
  this.data_candidate;
  // // Information retruned by API candidate committees API {@see loadCandidateCommitteeDetails}
  // this.data_candidateCommittees = {};
  // // Init the list/table of states and their totals
  // this.data_states = {
  //   results: [
  //     {
  //       candidate_id: '',
  //       count: 0,
  //       cycle: 2020,
  //       state: '',
  //       state_full: '',
  //       total: 0
  //     }
  //   ]
  // };
  // Shared settings for every fetch():
  this.fetchInitObj = {
    cache: 'no-cache',
    mode: 'cors',
    signal: null
  };
  // this.fetchingStates = false; // Are we waiting for data?
  this.element = document.querySelector('#gov-fec-pres-finance'); // The visual element associated with this, this.instance
  this.candidateDetailsHolder; // Element to hold candidate name, party, office, and ID
  this.current_electionYear = availElectionYears[0];
  this.current_electionState = 'US';
  this.current_electionState_name = 'United States';
  this.current_candidate_id = '';
  this.current_candidate_name = '';
  this.current_candidate_last_name = '';
  // this.map; // Starts as the element for the map but then becomes a DataMap object
  // this.table; // The <table> for the list of states and their totals
  // this.statesTotalHolder; // Element at the bottom of the states list
  // this.typeahead; // The typeahead candidate element:
  // this.typeahead_revertValue; // Temporary var saved while user is typing
  // this.yearControl; // The <select> for election years:
  // this.buttonIndivContribs;
  // // this.buttonMethodology;
  // this.remoteTableHeader;
  // this.remoteTable;

  // // Populate the examples text because handlebars doesn't like to add the italics/emphasis
  // document.querySelector(
  //   '#gov-fec-contribs-by-state .typeahead-filter .filter__instructions'
  // ).innerHTML = 'Examples: <em>Bush, George W</em> or <em>P00003335</em>';

  // // Move the typeahead message into the typeahead object so its content lines up properly
  // document
  //   .querySelector('#contribs-by-state-cand-field')
  //   .appendChild(document.querySelector('#contribs-by-state-typeahead-error'));

  // // If we have the element on the page, fire it up
  if (this.element) this.init();
}

/**
 * Called after construction.
 * Identifies and initializes the various visual elements and controls, queries, and starts first data load
 */
PresidentialFundsMap.prototype.init = function() {
  // // Add the stylesheet to the document <head>
  // let head = document.head;
  // let linkElement = document.createElement('link');
  // linkElement.type = 'text/css';
  // linkElement.rel = 'stylesheet';
  // linkElement.href = stylesheetPath;
  // head.appendChild(linkElement);

  // // Init the election year selector (The element ID is set in data/templates/partials/widgets/contributions-by-state.jinja)
  // // TODO: Can we remove the default listener (like with the typeahead above) and not change the URL when the <select> changes?
  this.yearControl = this.element.querySelector('#filter-year');
  let theFieldset = this.yearControl.querySelector('fieldset');
  for (let i = 0; i < availElectionYears.length; i++) {
    let thisYear = availElectionYears[i];
    let newElem = document.createElement('label');
    let switched = i == 0 ? ' checked' : '';
    newElem.setAttribute('class', `toggle`);
    newElem.setAttribute('for', `switcher-${thisYear}`);
    newElem.innerHTML = `<input type="radio" class="toggle" value="${thisYear}" id="switcher-${thisYear}" name="year_selector-TODO" data-prefix="TODO:" data-tag-value="${thisYear}" aria-controls="${thisYear}-message" tabindex="0"${switched}><span class="button--alt">${thisYear}</span>`;
    theFieldset.appendChild(newElem);
  }
  this.yearControl.addEventListener(
    'change',
    this.handleElectionYearChange.bind(this)
  );

  this.element.addEventListener(
    YEAR_CHANGE_EVENT,
    this.handleYearChange.bind(this)
  );

  this.element.addEventListener(
    CANDIDATE_DETAILS_LOADED,
    this.handleCandidateDetailsLoaded.bind(this)
  );
  // // Initialize the various queries
  this.baseCandidateQuery = { office: 'P' }; // Calls for candidate details
  this.baseCandidatesQuery = {
    // cycle: defaultElectionYear(),
    // election_full: true,
    // office: 'P',
    // page: 1,
    // per_page: 200,
    // sort_hide_null: false,
    // sort_null_only: false,
    // sort_nulls_last: false
    // candidate_id: '', // 'P60007168',
    // is_active_candidate: true,
    // sort: 'total'
  };

  // // Find the visual elements
  // this.map = document.querySelector('.map-wrapper .election-map');
  this.candidateDetailsHolder = document.querySelector('.candidate-details');
  this.table = document.querySelector('#pres-fin-map-candidates-table');
  // this.statesTotalHolder = document.querySelector('.js-states-total');

  // // Fire up the map
  // this.map = new DataMap(this.map, {
  //   color: '#36BDBB',
  //   data: '',
  //   addLegend: true,
  //   addTooltips: true
  // });

  // // Listen for the Browse Individual Contributions button to be clicked
  // this.buttonIndivContribs = this.element.querySelector(
  //   '.js-browse-indiv-contribs-by-state'
  // );
  // this.buttonIndivContribs.addEventListener(
  //   'click',
  //   this.updateBrowseIndivContribsButton.bind(this)
  // );

  // Internet Explorer doesn't like flex display
  // so we're going to keep the states table from switching to flex.
  let userAgent = window.navigator.userAgent;
  // Test for IE and IE 11
  let is_ie =
    userAgent.indexOf('MSIE ') > 0 || userAgent.indexOf('Trident/7.0') > 0;

  // // Initialize the remote table header
  // // Find the remote header and save it
  // this.remoteTableHeader = this.element.querySelector(
  //   '.js-remote-table-header'
  // );
  // // Save its <thead> for a few lines
  // let theRemoteTableHead = this.remoteTableHeader.querySelector('thead');
  // // Look at the data-for attribute of remoteTableHeader and save that element
  // this.remoteTable = this.element.querySelector(
  //   '#' + this.remoteTableHeader.getAttribute('data-for')
  // );
  // // Remember the <thead> in remoteTable for few lines
  // let theRemotedTableHead = this.remoteTable.querySelector('thead');
  // // If we have both <thead> elements, we're ready to manipulate them
  // if (theRemoteTableHead && theRemotedTableHead) {
  //   this.remoteTableHeader.style.display = 'table';
  //   theRemotedTableHead.style.display = 'none';
  // }

  if (is_ie) {
    this.remoteTable.classList.add('table-display');
    this.remoteTableHeader.classList.add('table-display');
  }

  this.element.addEventListener(
    CHANGE_CANDIDATES_DATA,
    this.handleCandidatesDataLoad.bind(this)
  );
  this.element.addEventListener(
    CHANGE_CANDIDATE,
    this.handleCandidateChange.bind(this)
  );

  // Listen for resize events
  window.addEventListener('resize', this.handleResize.bind(this));
  // Call for a resize on init
  this.handleResize();

  // And start the first load
  this.loadCandidatesList();
};

/**
 * Called by {@see init() }
 * Finds the highest-earning presidential candidate of the default year
 * Similar to {@see loadCandidateDetails() }
 */
PresidentialFundsMap.prototype.loadCandidatesList = function() {
  document.dispatchEvent(new CustomEvent(ENTER_LOADING_EVENT));

  let instance = this;
  let candidatesListQuery = Object.assign({}, this.baseCandidatesQuery, {
    sort: '-net_receipts',
    per_page: 100,
    election_year: this.current_electionYear,
    contributor_state: this.current_electionState
  });
  window
    .fetch(
      buildUrl(this.basePath_candidatesList, candidatesListQuery),
      this.fetchInitObj
    )
    .then(function(response) {
      if (response.status !== 200)
        throw new Error('The network rejected the candidate raising request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        instance.element.dispatchEvent(
          new CustomEvent(CHANGE_CANDIDATES_DATA, { detail: data })
        );
      });
    })
    .catch(function() {});
};

/**
 * TODO -
 */
PresidentialFundsMap.prototype.handleCandidatesDataLoad = function(e) {
  this.data_candidates = e.detail;

  this.element.dispatchEvent(new CustomEvent(FINISH_LOADING_EVENT));

  this.displayUpdatedData_candidates(this.data_candidates.results);
};

/**
 *
 */
PresidentialFundsMap.prototype.handleCandidateDetailsLoaded = function(e) {
  console.log('handleCandidateDetailsLoaded(): ', e);

  let dataObj = {
    candidate_id: e.detail.candidate_id,
    name: e.detail.name,
    party: e.detail.party,
    year: this.current_electionYear,
    currentState: this.current_electionState, // for breadcrumbs
    currentStateName: this.current_electionState_name, // for breadcrumbs
    candidateLastName: this.current_candidate_last_name // for breadcrumbs
  };

  this.displayUpdatedData_candidate(dataObj);
  this.updateBreadcrumbs(dataObj);
};

/**
 * Retrieves full candidate details when the typeahead is used
 * Called from
 * Similar to {@see loadCandidatesList() }
 * @param {String} cand_id Comes from the typeahead
 */
PresidentialFundsMap.prototype.loadCandidateDetails = function(cand_id) {
  console.log('loadCandidateDetails(): ', cand_id);
  let instance = this;
  this.basePath_candidateDetails[1] = cand_id;
  window
    .fetch(
      buildUrl(this.basePath_candidateDetails, this.baseCandidateQuery),
      this.fetchInitObj
    )
    .then(function(response) {
      if (response.status !== 200)
        throw new Error('The network rejected the candidate details request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        // Save the candidate query response
        instance.data_candidate = data;
        console.log('candidate details loaded: ', data);
        // Save the candidate details
        // instance.candidateDetails = data.results[0];
        // Update the base query with the new candidate ID
        // instance.baseStatesQuery.candidate_id =
        // instance.candidateDetails.candidate_id;
        // Save the office to the base query, too
        // instance.baseStatesQuery.office = instance.candidateDetails.office;
        // Then put the new candidate details into the page
        // instance.displayUpdatedData_candidate();
        instance.element.dispatchEvent(
          new CustomEvent(CANDIDATE_DETAILS_LOADED, { detail: data.results[0] })
        );
      });
    })
    .catch(function() {});
};

/**
 * Queries the API for the candidate's coverage dates for the currently-selected election
 * Called by {@see displayUpdatedData_candidate() } and {@see displayUpdatedData_candidates() }
 */
PresidentialFundsMap.prototype.loadCandidateCoverageDates = function() {
  // let instance = this;
  // this.basePath_candidateCoverageDatesPath[1] = this.candidateDetails.candidate_id;
  // let coverageDatesQuery = Object.assign(
  //   {},
  //   {
  //     per_page: 100,
  //     cycle: this.baseStatesQuery.cycle,
  //     election_full: true
  //   }
  // );
  // /**
  //  * Format the dates into MM/DD/YYYY format.
  //  * Pads single digits with leading 0.
  //  */
  // var formatDate = function(date) {
  //   // Adds one since js month uses zero based index
  //   let month = date.getMonth() + 1;
  //   if (month < 10) {
  //     month = '0' + month;
  //   }
  //   let day = date.getDate();
  //   if (day < 10) {
  //     day = '0' + day;
  //   }
  //   return month + '/' + day + '/' + date.getFullYear();
  // };
  // let theFetchUrl = buildUrl(
  //   instance.basePath_candidateCoverageDatesPath,
  //   coverageDatesQuery
  // );
  // window
  //   .fetch(theFetchUrl, instance.fetchInitObj)
  //   .then(function(response) {
  //     if (response.status !== 200)
  //       throw new Error('The network rejected the coverage dates request.');
  //     // else if (response.type == 'cors') throw new Error('CORS error');
  //     response.json().then(data => {
  //       if (data.results.length === 1) {
  //         document
  //           .querySelector('.states-table-timestamp')
  //           .removeAttribute('style');
  //         // Parse coverage date from API that is formatted like this: 2019-06-30T00:00:00+00:00
  //         // into a string without timezone
  //         let coverage_start_date = new Date(
  //           data.results[0].coverage_start_date.substring(0, 19)
  //         );
  //         let coverage_end_date = new Date(
  //           data.results[0].transaction_coverage_date.substring(0, 19)
  //         );
  //         // Remember the in-page elements
  //         let theStartTimeElement = document.querySelector(
  //           '.js-cycle-start-time'
  //         );
  //         let theEndTimeElement = document.querySelector('.js-cycle-end-time');
  //         // Format the date and put it into the start time
  //         theStartTimeElement.innerText = formatDate(coverage_start_date);
  //         // Format the date and put it into the end time
  //         theEndTimeElement.innerText = formatDate(coverage_end_date);
  //       } else {
  //         // Hide coverage dates display when there are zero results
  //         document
  //           .querySelector('.states-table-timestamp')
  //           .setAttribute('style', 'opacity: 0;');
  //       }
  //     });
  //   })
  //   .catch(function() {});
};

/**
 * Asks the API for the details of the candidate's committees for the currently-selected election
 * Called by {@see displayUpdatedData_candidate() }
 */
PresidentialFundsMap.prototype.loadCandidateCommitteeDetails = function() {
  // let instance = this;
  // // Before we fetch, make sure the query path has the current candidate id
  // this.basePath_candidateCommitteesPath[1] = this.candidateDetails.candidate_id;
  // // and the current election year/cycle
  // this.basePath_candidateCommitteesPath[4] = this.baseStatesQuery.cycle;
  // let committeesQuery = Object.assign(
  //   {},
  //   {
  //     per_page: 100,
  //     election_full: true
  //   }
  // );
  // let theFetchUrl = buildUrl(
  //   instance.basePath_candidateCommitteesPath,
  //   committeesQuery
  // );
  // // because the API wants two `designation` values, and that's a violation of key:value law,
  // // we'll add them ourselves:
  // theFetchUrl += '&designation=P&designation=A';
  // window
  //   .fetch(theFetchUrl, instance.fetchInitObj)
  //   .then(function(response) {
  //     if (response.status !== 200)
  //       throw new Error(
  //         'The network rejected the candidate committee details request.'
  //       );
  //     // else if (response.type == 'cors') throw new Error('CORS error');
  //     response.json().then(data => {
  //       // Save the candidate committees query response for when we build links later
  //       instance.data_candidateCommittees = data;
  //       // Now that we have the committee info, load the new states data
  //       instance.loadStatesData();
  //     });
  //   })
  //   .catch(function() {
  //     // TODO: handle catch. Maybe we remove the links if the committee data didn't load?
  //   });
};

/**
 * Starts the fetch to go get the big batch of states data, called by {@see init() }
 */
PresidentialFundsMap.prototype.loadStatesData = function() {
  // let instance = this;
  // let baseStatesQueryWithCandidate = Object.assign({}, this.baseStatesQuery, {
  //   candidate_id: this.candidateDetails.candidate_id
  // });
  // // Let's stop any currently-running states fetches
  // if (this.fetchingStates) this.fetchAbortController.abort();
  // // Start loading the states data
  // this.fetchingStates = true;
  // this.setLoadingState(true);
  // window
  //   .fetch(
  //     buildUrl(this.basePath_states, baseStatesQueryWithCandidate),
  //     this.fetchInitObj
  //   )
  //   .then(function(response) {
  //     instance.fetchingStates = false;
  //     if (response.status !== 200)
  //       throw new Error('The network rejected the states request.');
  //     // else if (response.type == 'cors') throw new Error('CORS error');
  //     response.json().then(data => {
  //       // Now that we have all of the values, let's sort them by total, descending
  //       data.results.sort((a, b) => {
  //         return b.total - a.total;
  //       });
  //       // After they're sorted, let's hang on to them
  //       instance.data_states = data;
  //       instance.displayUpdatedData_candidates();
  //     });
  //   })
  //   .catch(function() {
  //     instance.fetchingStates = false;
  //   });
  // // Start loading the states total
  // window
  //   .fetch(
  //     buildUrl(this.basePath_statesTotal, baseStatesQueryWithCandidate),
  //     this.fetchInitObj
  //   )
  //   .then(function(response) {
  //     if (response.status !== 200)
  //       throw new Error('The network rejected the states total request.');
  //     // else if (response.type == 'cors') throw new Error('CORS error');
  //     response.json().then(data => {
  //       instance.displayUpdatedData_total(data);
  //     });
  //   })
  //   .catch(function() {});
  // logUsage(this.baseStatesQuery.candidate_id, this.baseStatesQuery.cycle);
};

/**
 * Puts the candidate details in the page,
 */
PresidentialFundsMap.prototype.displayUpdatedData_candidate = function(detail) {
  console.log('displayUpdatedData_candidate(): ', detail);

  let theNameField = this.candidateDetailsHolder.querySelector('h1');
  let theOfficeField = this.candidateDetailsHolder.querySelector('h2');
  let theIDField = this.candidateDetailsHolder.querySelector('h3');

  let theNameString = '';
  let theOfficeString = '';
  let theIDString = '';

  if (specialCandidateIDs.includes(detail.candidate_id)) {
    theNameString = detail.name;
    theOfficeString = 'for president';
  } else {
    theNameString = `<a href="/data/candidate/${detail.candidate_id}/?cycle=${this.current_electionYear}&election_full=true">${detail.name}</a> [${detail.party}]`;
    theOfficeString = 'Candidate for president';
    theIDString = `ID: ${detail.candidate_id}`;
  }
  theNameField.innerHTML = theNameString;
  theOfficeField.innerHTML = theOfficeString;
  theIDField.innerHTML = theIDString;
};

/**
 * Put the list of states and totals into the table
 * Called by {@see loadStatesData() }
 * TODO: This will eventually be replaced by the datatables functionality
 */
PresidentialFundsMap.prototype.displayUpdatedData_candidates = function(
  results
) {
  console.log('displayUpdatedData_candidates(): ', results);
  let theTableBody = this.table.querySelector('tbody');
  theTableBody.innerHTML = '';
  // let theTbodyString = '';
  if (results.length === 0) {
    // If there are no results to show
    this.handleErrorState('NO_RESULTS_TO_DISPLAY');
  } else {
    // If there ARE results to show
    // We're going to need the committee IDs for the totals link
    // let theCommitteeIDs = [];
    // for (let i = 0; i < this.data_candidateCommittees.results.length; i++) {
    //   theCommitteeIDs.push(
    //     this.data_candidateCommittees.results[i].committee_id
    //   );
    // }
    for (let i = 0; i < results.length; i++) {
      // let theStateTotalUrl = buildIndividualContributionsUrl(
      //   this.baseStatesQuery.cycle,
      //   this.baseStatesQuery.office,
      //   theCommitteeIDs,
      //   results[i].state,
      //   this.candidateDetails.state
      // );
      // Candidate name cell
      let rowClasses = 'TODO-myRowClass';
      if (results[i].candidate_id == this.current_candidate_id)
        rowClasses += ' selected';

      let theNewRow = document.createElement('tr');
      theNewRow.setAttribute('data-candidate_id', results[i].candidate_id);
      theNewRow.setAttribute('class', rowClasses);
      let newRowContent = '';
      newRowContent += `<td>${results[i].candidate_last_name}`;
      if (!specialCandidateIDs.includes(results[i].candidate_id)) {
        newRowContent += ` [${results[i].candidate_party_affiliation}]`;
      }
      newRowContent += `</td>`;
      // Total raised cell
      newRowContent += '<td class="t-right-aligned t-mono">';
      newRowContent += formatAsCurrency(
        results[i].net_receipts,
        this.current_electionState == 'US'
      );
      newRowContent += '</td>';
      theNewRow.innerHTML = newRowContent;
      theTableBody.appendChild(theNewRow);
      theNewRow.addEventListener(
        'click',
        this.handleCandidateListClick.bind(this)
      );
    }
    // theTableBody.innerHTML = theTbodyString;
  }
  // Update candidate's coverage dates above the states list
  // this.loadCandidateCoverageDates();
  // Update the Individual Contributions button/link at the bottom
  // this.updateBrowseIndivContribsButton();
  // Let the map know that the data has been updated
  // this.map.handleDataRefresh(theData);
  // Clear the classes and reset functionality so the tool is usable again
  // this.setLoadingState(false);
};

/**
 * Puts the states grand total into the total field at the bottom of the table
 * Called by its fetch inside {@see loadStatesData() }
 * @param {Object} data The results from the fetch
 */
PresidentialFundsMap.prototype.displayUpdatedData_total = function(data) {
  // Set the states total dollars to the number we received, or empty it if there are no results
  // this.statesTotalHolder.innerText =
  //   data.results.length > 0
  //     ? (this.statesTotalHolder.innerText = formatAsCurrency(
  //         data.results[0].total
  //       ))
  //     : '';
  // let statesHolder = this.element.querySelector('.states-total');
  // if (data.results.length > 0) statesHolder.setAttribute('style', '');
  // else statesHolder.setAttribute('style', 'opacity: 0;');
};

/**
 *
 */
PresidentialFundsMap.prototype.updateBreadcrumbs = function(dataObj) {
  console.log('updateBreadcrumbs()');
  let theHolder = this.element.querySelector('.breadcrumb-nav');
  let theSeparator = theHolder.querySelector('span');
  let theSecondItem = theHolder.querySelectorAll('a')[1];
  let theSecondLabel = '';

  if (
    dataObj.candidate_id == specialCandidateIDs[0] &&
    dataObj.currentState == 'US'
  ) {
    // If we're showing the US map and 'All' candidates,
    // TODO - done, let's hide the span and the second element
  } else if (dataObj.currentState == 'US') {
    // Or if we're showing the US map and not-'All' candidates
    theSecondLabel = 'Nationwide: ';
  } else {
    // Otherwise, we're showing a state so we need a state lookup
    // TODO: theSecondLabel = (lookup the state name for this.current_electionState)
    theSecondLabel = `${dataObj.current_candidate_name}: `;
  }

  if (theSecondLabel != '') {
    if (specialCandidateIDs.includes(dataObj.candidate_id)) {
      // If we're looking at a special candidate (Dems, Reps ('all' is hidden from above))
      // TODO: theSecondLabel += this.candidate_last_name?
      theSecondLabel += dataObj.name;
    } else {
      // We're dealing with a real candidate so we need to get the name from somewhere else
      // TODO: theSecondLabel += this.find the last name
      theSecondLabel += dataObj.candidateLastName;
    }
  }
  theSecondItem.style.display = theSecondLabel != '' ? 'block' : 'none';
  theSeparator.style.display = theSecondLabel != '' ? 'block' : 'none';
  theSecondItem.innerHTML = theSecondLabel;
};

/**
 *
 */
PresidentialFundsMap.prototype.handleYearChange = function(e) {
  console.log('handleYearChange(): ', e);
  this.current_electionYear = e.detail;
  this.loadCandidatesList();
};

/**
 *
 */
PresidentialFundsMap.prototype.handleCandidateListClick = function(e) {
  console.log('handleCandidateListClick(): ', e);
  let newCandidateID = e.target.dataset.candidate_id;
  let name = e.target.cells[0].innerText;
  if (newCandidateID != this.current_candidate_id) {
    this.current_candidate_id = newCandidateID;
    this.current_candidate_last_name = name.substr(0, name.indexOf(' ['));
    this.element.dispatchEvent(
      new CustomEvent(CHANGE_CANDIDATE, {
        detail: { candidate_id: newCandidateID, name: name }
      })
    );
  }
};

PresidentialFundsMap.prototype.handleCandidateChange = function(e) {
  console.log('handleCandidateChange(): ', e);

  // We only need to load candidate details if our new candidate_id is an individual
  if (specialCandidateIDs.includes(e.detail.candidate_id)) {
    // Otherwise, dispatch the event now

    this.element.dispatchEvent(
      new CustomEvent(CANDIDATE_DETAILS_LOADED, {
        detail: {
          candidate_id: e.detail.candidate_id,
          name: e.detail.name // Sending this as name because that's how the candidate details query returns it
        }
      })
    );
  } else {
    this.loadCandidateDetails(e.detail.candidate_id);
  }

  // TODO: this should trigger the map to change to the candidate's data (or, 'US')
};

// // Set the candidate's name and link change
// PresidentialFundsMap.prototype.setCandidateName = function(
//   id,
//   candidateName,
//   party,
//   cycle
// ) {
//   let candidateNameElement = this.candidateDetailsHolder.querySelector('h1');
//   // candidateNameElement.innerHTML = `<a href="/data/candidate/${id}/?cycle=${cycle}&election_full=true">${candidateName}</a> [${party}]`;
// };

/**
 * Called on the election year control's change event
 * Starts loading the new data
 * @param {MouseEvent} e
 */
PresidentialFundsMap.prototype.handleElectionYearChange = function(e) {
  console.log('handleElectionYearChange() e: ', e);
  this.element.dispatchEvent(
    new CustomEvent(YEAR_CHANGE_EVENT, {
      detail: e.target.value
    })
  );

  // // We don't need to load the candidate details for a year change,
  // // so we'll just jump right to loading the committees data for the newly-chosen year.
  // this.loadCandidateCommitteeDetails();
};

/**
 * Called from throughout the widget
 * @param {String} errorCode
 */
PresidentialFundsMap.prototype.handleErrorState = function(errorCode) {
  // if (errorCode == 'NO_RESULTS_TO_DISPLAY') {
  //   // Empty the states list and update the date range
  //   let theStatesTableBody = this.table.querySelector('tbody');
  //   let theDateRange = this.baseStatesQuery.cycle;
  //   if (this.baseStatesQuery.office == 'P')
  //     theDateRange = theDateRange - 3 + '-' + theDateRange;
  //   else if (this.baseStatesQuery.office == 'S')
  //     theDateRange = theDateRange - 5 + '-' + theDateRange;
  //   else theDateRange = theDateRange - 1 + '-' + theDateRange;
  //   let theErrorMessageHTML = `<tr><td colspan="3" class="error-msg">We don&apos;t have itemized individual contributions for this candidate for ${theDateRange}.</td></tr>`;
  //   theStatesTableBody.innerHTML = theErrorMessageHTML;
  // }
};

/**
 * Updates the href of the Individual Contributions link/button at the bottom of the widget
 */
PresidentialFundsMap.prototype.updateBrowseIndivContribsButton = function() {
  // We need to go through the committee results and build an array of the committee IDs
  // to send to {@see buildIndividualContributionsUrl() }
  // let theCommittees = this.data_candidateCommittees.results;
  // let theCommitteeIDs = [];
  // for (let i = 0; i < theCommittees.length; i++) {
  //   theCommitteeIDs.push(theCommittees[i].committee_id);
  // }
  // let theButton = this.element.querySelector(
  //   '.js-browse-indiv-contribs-by-state'
  // );
  // theButton.setAttribute(
  //   'href',
  //   buildIndividualContributionsUrl(
  //     this.baseStatesQuery.cycle,
  //     this.baseStatesQuery.office,
  //     theCommitteeIDs
  //   )
  // );
};

/**
 * Listens to window resize events and adjusts the classes for the <aside> based on its width
 * (rather than the page's width, which is problematic when trying to determine whether there's a side nav)
 */
PresidentialFundsMap.prototype.handleResize = function(e = null) {
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

  setTimeout(this.refreshOverlay.bind(this), 250);
};

/**
 * Called by {@see handleResize() }, to re-position the "loading" overlay
 */
PresidentialFundsMap.prototype.refreshOverlay = function() {
  // let timeStampHeight = 25;
  // let theMap = this.element.querySelector('.map-wrapper');
  // let theOverlay = this.element.querySelector('.overlay__container');
  // let theTopPos =
  //   this.element.querySelector('.state-list-wrapper').offsetTop +
  //   timeStampHeight;
  // let theBottomPos = theMap.offsetTop + theMap.offsetHeight;
  // let theHeight = theBottomPos - theTopPos;
  // theOverlay.style.top = `${theTopPos}px`;
  // theOverlay.style.height = `${theHeight}px`;
};

/**
 * Controls class names and functionality of the widget.
 * Called when we both start and complete (@see loadStatesData() )
 * @param {Boolean} newState
 */
PresidentialFundsMap.prototype.setLoadingState = function(newState) {
  // if (newState === false) {
  //   this.element
  //     .querySelector('.overlay__container')
  //     .classList.remove('is-loading');
  //   this.element.querySelector('.overlay').classList.remove('is-loading');
  //   this.element
  //     .querySelector('#state-contribs-years')
  //     .removeAttribute('disabled');
  // } else if (newState === true) {
  //   this.element
  //     .querySelector('.overlay__container')
  //     .classList.add('is-loading');
  //   this.element.querySelector('.overlay').classList.add('is-loading');
  //   this.element
  //     .querySelector('#state-contribs-years')
  //     .setAttribute('disabled', true);
  //   // trigger resize:
  //   this.handleResize();
  // }
};

/**
 * Handles the usage analytics for this module
 * @TODO: Decide how to gather usage insights while embedded
 * @param {String} candID - The candidate ID
 * @param {*} electionYear - String or Number, the user-selected election year
 */
function logUsage(candID, electionYear) {
  // if (window.ga) {
  //   window.ga('send', 'event', {
  //     eventCategory: 'Widget-PresFinMap',
  //     eventAction: 'interaction',
  //     eventLabel: candID + ',' + electionYear
  //   });
  // }
}

new PresidentialFundsMap();
