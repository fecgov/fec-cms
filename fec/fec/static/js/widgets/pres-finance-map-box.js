'use strict';

/* global CustomEvent */

ROBERT, NEXT UP IS THE VARIOUS EXPORT BUTTONS

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
const CHANGE_CANDIDATE = EVENT_APP_ID + '_cand_change';
const CANDIDATE_DETAILS_LOADED = EVENT_APP_ID + '_cand_detail_loaded';
const MAP_DATA_LOADED = EVENT_APP_ID + '_map_data_loaded';
const FINANCIAL_SUMMARY_LOADED = EVENT_APP_ID + '_cand_summary_loaded';
const CONTRIBUTION_SIZES_LOADED = EVENT_APP_ID + '_cand_sizes_loaded';

// Element selectors
// TODO: Update so we're using IDs everywhere?
const selector_mainElement = '#gov-fec-pres-finance';
const selector_yearControl = '#filter-year';
const selector_resetApp = '.js-reset-app';
const selector_map = '.map-wrapper .election-map';
const selector_candidateDetails = '.candidate-details';
const selector_candidatesTable = '#pres-fin-map-candidates-table';
const selector_breadcrumbNav = '.breadcrumb-nav';
const selector_summariesHolder = '#financial-summaries';
const selector_candidateNamePartyAndLink = '.js-cand-name-par-a';

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
    let decimalPos = toReturn.indexOf('.');
    let firstHalf = toReturn.substr(0, decimalPos);
    let secondHalf = toReturn.substr(decimalPos); // grabs the decimal, too
    toReturn = firstHalf.replace(/\d(?=(\d{3})+$)/g, '$&,') + secondHalf;
  } else {
    toReturn = String(Math.round(passedValue));
    toReturn = toReturn.replace(/\d(?=(\d{3})+$)/g, '$&,');
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
function buildCandidateNameAndPartyLink(
  candidateID,
  candidateName,
  electionYear,
  party
) {
  return `<a href="/data/candidate/${candidateID}/?cycle=${electionYear}&election_full=true">${candidateName}</a> [${party}]`;
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

  // Where to find
  this.basePath_financialSummary = ['presidential', 'financial_summary'];

  this.basePath_contributionSizes = [
    'presidential',
    'contributions',
    'by_size'
  ];
  // // Where to find candidate's coverage dates
  // this.basePath_candidateCoverageDatesPath = [
  //   'candidate',
  //   '000', //candidate ID
  //   'totals'
  // ];
  // // Where to find the highest-earning candidates:
  // this.basePath_highestRaising = ['candidates', 'totals'];
  // Where to find the data for the map
  this.basePath_mapData = ['presidential', 'contributions', 'by_state'];
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
  this.data_summary;
  this.data_sizes;
  this.data_map;
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
  this.fetchingData = false; // Are we waiting for data?
  this.element = document.querySelector(selector_mainElement); // The visual element associated with this, this.instance
  this.candidateDetailsHolder; // Element to hold candidate name, party, office, and ID
  this.current_electionYear = availElectionYears[0];
  this.current_electionState = 'US';
  this.current_electionStateName = 'United States';
  this.current_candidateID = specialCandidateIDs[0];
  this.current_candidateName = 'All candidates';
  this.current_candidateLastName = '';
  this.map; // Starts as the element for the map but then becomes a DataMap object
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
  this.yearControl = this.element.querySelector(selector_yearControl);
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

  this.element.addEventListener(
    MAP_DATA_LOADED,
    this.handleMapDataLoaded.bind(this)
  );

  this.element.addEventListener(
    FINANCIAL_SUMMARY_LOADED,
    this.handleFinancialSummaryLoaded.bind(this)
  );

  this.element.addEventListener(
    CONTRIBUTION_SIZES_LOADED,
    this.handleContributionSizesLoaded.bind(this)
  );

  this.element
    .querySelector(selector_resetApp)
    .addEventListener('click', this.handleResetClick.bind(this));

  this.element.addEventListener(
    'STATE_CLICKED',
    this.handleStateClick.bind(this)
  );

  // Initialize the various queries
  this.baseCandidateQuery = { office: 'P' }; // Calls for candidate details
  this.baseCandidatesQuery = { per_page: 100, sort: '-net_receipts' };
  this.baseStatesQuery = { per_page: 100 };
  this.baseMapQuery = { per_page: 100 };
  this.baseSummaryQuery = { per_page: 100 }; // just in case
  this.baseSizesQuery = { per_page: 100 }; // just in case

  // Find the visual elements
  this.map = document.querySelector(selector_map);
  this.candidateDetailsHolder = document.querySelector(
    selector_candidateDetails
  );
  this.table = document.querySelector(selector_candidatesTable);

  // Fire up the map
  this.map = new DataMap(this.map, {
    color: '#36BDBB',
    data: '',
    addLegend: true,
    addTooltips: true,
    eventAppID: EVENT_APP_ID
  });

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
    this.handleCandidatesDataLoaded.bind(this)
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

  // Let's stop any currently-running candidates fetches
  if (this.fetchingData) this.fetchAbortController.abort();
  // Start loading the candidates
  this.fetchingData = true;

  let instance = this;
  let thisQuery = Object.assign({}, this.baseCandidatesQuery, {
    election_year: this.current_electionYear,
    contributor_state: this.current_electionState
  });
  window
    .fetch(buildUrl(this.basePath_candidatesList, thisQuery), this.fetchInitObj)
    .then(function(response) {
      if (response.status !== 200)
        throw new Error('The network rejected the candidate raising request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        // Let the audience know the load is complete
        instance.element.dispatchEvent(
          new CustomEvent(CHANGE_CANDIDATES_DATA, { detail: data })
        );
      });
    })
    .catch(function() {
      instance.fetchingData = false;
    });
};

/**
 * TODO -
 */
PresidentialFundsMap.prototype.handleCandidatesDataLoaded = function(e) {
  this.data_candidates = e.detail;

  this.fetchingData = false; // clear the abort controller

  this.displayUpdatedData_candidates(this.data_candidates.results);

  // We're going to dispatch a candidate change event,
  // which will trigger a details load if needed
  this.element.dispatchEvent(
    new CustomEvent(CHANGE_CANDIDATE, {
      detail: {
        candidate_id: this.current_candidateID,
        name: this.current_candidateName
      }
    })
  );

  // this.loadCandidateDetails(this.current_candidateID);
};

/**
 *
 * TODO: Would like to make this into an event for the map to hear, rather than send the data into the map
 */
PresidentialFundsMap.prototype.handleMapDataLoaded = function(e) {
  this.fetchingData = false; // clear the abort controller

  this.data_map = e.detail;

  // The map will map 'value' attributes but we have 'net_receipts'
  // We also need to change 'contribution_state' to 'state'
  // So let's fix that
  let dataForMap = Object.assign({}, e.detail);
  dataForMap.results.forEach(item => {
    item.total = item.contribution_receipt_amount;
    item.state = item.contribution_state;
  });

  this.map.handleDataRefresh(dataForMap);

  document.dispatchEvent(new CustomEvent(FINISH_LOADING_EVENT));
};

/**
 *
 */
PresidentialFundsMap.prototype.handleCandidateDetailsLoaded = function(e) {
  console.log('handleCandidateDetailsLoaded(): ', e);

  this.data_candidate = e.detail;

  let dataObj = {
    candidate_id: e.detail.candidate_id,
    name: e.detail.name,
    party: e.detail.party,
    year: this.current_electionYear,
    currentState: this.current_electionState, // for breadcrumbs
    currentStateName: this.current_electionStateName, // for breadcrumbs
    candidateLastName: this.current_candidateLastName // for breadcrumbs
  };

  this.displayUpdatedData_candidate(dataObj);
  this.updateBreadcrumbs(dataObj);

  // Now that we have the individual details, let's get the summary details
  this.loadFinancialSummary();
};

/**
 *
 */
PresidentialFundsMap.prototype.handleFinancialSummaryLoaded = function(e) {
  console.log('handleFinancialSummaryLoaded(): ', e.detail);

  this.data_summary = e.detail;

  this.displayFinancialSummary(e.detail.results[0]);

  // Now let's get the breakdown of contribution sizes
  this.loadContributionSizes();
};

/**
 *
 */
PresidentialFundsMap.prototype.handleContributionSizesLoaded = function(e) {
  console.log('handleContributionSizesLoaded(): ', e);

  this.data_sizes = e.detail;

  this.displaySizesSummary(e.detail.results);

  // Now that we have all the numbers out of the way, let's load the map
  this.loadMapData();
};

/**
 * Retrieves full candidate details when the typeahead is used
 * Called from
 * Similar to {@see loadCandidatesList() }
 * @param {String} cand_id Comes from the typeahead
 */
PresidentialFundsMap.prototype.loadCandidateDetails = function(cand_id) {
  console.log('loadCandidateDetails(): ', cand_id);
  document.dispatchEvent(new CustomEvent(ENTER_LOADING_EVENT));

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
        // Let the audience know the load is complete
        instance.element.dispatchEvent(
          new CustomEvent(CANDIDATE_DETAILS_LOADED, { detail: data.results[0] })
        );
      });
    })
    .catch(function() {
      instance.fetchingData = false;
    });
};

/**
 * Starts the fetch to go get the values for the states
 */
PresidentialFundsMap.prototype.loadMapData = function() {
  document.dispatchEvent(new CustomEvent(ENTER_LOADING_EVENT));

  let instance = this;
  let thisQuery = Object.assign({}, this.baseMapQuery, {
    candidate_id: this.current_candidateID,
    election_year: this.current_electionYear
  });
  // Let's stop any currently-running map data fetches
  if (this.fetchingData) this.fetchAbortController.abort();
  // Start loading the map data
  this.fetchingData = true;
  window
    .fetch(buildUrl(this.basePath_mapData, thisQuery), this.fetchInitObj)
    .then(function(response) {
      // instance.fetchingStates = false;
      if (response.status !== 200)
        throw new Error('The network rejected the states request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        // Let the audience know the load is complete
        instance.element.dispatchEvent(
          new CustomEvent(MAP_DATA_LOADED, {
            detail: data
          })
        );
      });
    })
    .catch(function() {
      instance.fetchingData = false;
    });
};

/**
 * Starts the fetch to go get the values for the candidate's financial summary
 */
PresidentialFundsMap.prototype.loadFinancialSummary = function() {
  document.dispatchEvent(new CustomEvent(ENTER_LOADING_EVENT));

  let instance = this;
  let thisQuery = Object.assign({}, this.baseSummaryQuery, {
    candidate_id: this.current_candidateID,
    election_year: this.current_electionYear
  });
  // Let's stop any currently-running map data fetches
  if (this.fetchingData) this.fetchAbortController.abort();
  // Start loading the map data
  this.fetchingData = true;
  window
    .fetch(
      buildUrl(this.basePath_financialSummary, thisQuery),
      this.fetchInitObj
    )
    .then(function(response) {
      // instance.fetchingStates = false;
      if (response.status !== 200)
        throw new Error('The network rejected the states request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        // Let the audience know the load is complete
        instance.element.dispatchEvent(
          new CustomEvent(FINANCIAL_SUMMARY_LOADED, {
            detail: data
          })
        );
      });
    })
    .catch(function() {
      instance.fetchingData = false;
    });
};

/**
 * Starts the fetch to go get the values for the contributions by size
 */
PresidentialFundsMap.prototype.loadContributionSizes = function() {
  document.dispatchEvent(new CustomEvent(ENTER_LOADING_EVENT));

  let instance = this;
  let thisQuery = Object.assign({}, this.baseSizesQuery, {
    candidate_id: this.current_candidateID,
    election_year: this.current_electionYear
  });
  // Let's stop any currently-running map data fetches
  if (this.fetchingData) this.fetchAbortController.abort();
  // Start loading the map data
  this.fetchingData = true;
  window
    .fetch(
      buildUrl(this.basePath_contributionSizes, thisQuery),
      this.fetchInitObj
    )
    .then(function(response) {
      // instance.fetchingStates = false;
      if (response.status !== 200)
        throw new Error('The network rejected the sizes request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        // Let the audience know the load is complete
        instance.element.dispatchEvent(
          new CustomEvent(CONTRIBUTION_SIZES_LOADED, {
            detail: data
          })
        );
      });
    })
    .catch(function() {
      instance.fetchingData = false;
    });
};

/**
 * Puts the candidate details in the page,
 */
PresidentialFundsMap.prototype.displayUpdatedData_candidate = function(detail) {
  console.log('displayUpdatedData_candidate(): ', detail);

  // The name fields are in the candidate details above the map, but also in the summary accordion items
  let theNameFields = this.element.querySelectorAll(
    selector_candidateNamePartyAndLink
  );
  let theOfficeField = this.candidateDetailsHolder.querySelector('h2');
  let theIDField = this.candidateDetailsHolder.querySelector('h3');

  let theNameString = '';
  let theOfficeString = '';
  let theIDString = '';

  if (specialCandidateIDs.includes(detail.candidate_id)) {
    theNameString = detail.name;
    theOfficeString = 'for president';
  } else {
    theNameString = buildCandidateNameAndPartyLink(
      detail.candidate_id,
      detail.name,
      this.current_electionYear,
      detail.party
    );
    theOfficeString = 'Candidate for president';
    theIDString = `ID: ${detail.candidate_id}`;
  }
  theOfficeField.innerHTML = theOfficeString;
  theIDField.innerHTML = theIDString;
  // Finally, put theNameString into every name field across the app
  for (var i = 0; i < theNameFields.length; i++) {
    theNameFields[i].innerHTML = theNameString;
  }
};

/**
 * Put the list of states and totals into the table
 * Called by {@see loadMapData() }
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
      // let theStateTotalUrl = buildCandidateNameAndPartyLink(
      //   this.baseStatesQuery.cycle,
      //   this.baseStatesQuery.office,
      //   theCommitteeIDs,
      //   results[i].state,
      //   this.candidateDetails.state
      // );
      // Candidate name cell
      let rowClasses = 'TODO-myRowClass';
      if (results[i].candidate_id == this.current_candidateID)
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
 * Called by its fetch inside {@see loadMapData() }
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
PresidentialFundsMap.prototype.displayFinancialSummary = function(data) {
  let theHolder = this.element.querySelector(selector_summariesHolder);
  // for each property in the data object we receive,
  for (var prop in data) {
    // find the field with the data-sum-id attribute that matches this property's name
    let field = theHolder.querySelector(`[data-sum-id="${prop}"]`);
    // If we found a field for this property,
    // put the value into the field if it's not a number
    // and format it as currency if it is a number
    if (field)
      field.innerText = isNaN(data[prop])
        ? data[prop]
        : formatAsCurrency(data[prop]);
  }
};

/**
 *
 */
PresidentialFundsMap.prototype.displaySizesSummary = function(data) {
  let theHolder = this.element.querySelector(selector_summariesHolder);
  // for each result in the data object we receive,
  data.forEach(item => {
    // find the field with the data-size_range_id attribute that matches this results's size_range_id
    let field = theHolder.querySelector(
      `[data-size_range_id="${item.size_range_id}"]`
    );
    // If we found a field for this result,
    // format it as currency and put it into the field
    if (field)
      field.innerText = formatAsCurrency(item.contribution_receipt_amount);
  });
};

/**
 *
 */
PresidentialFundsMap.prototype.updateBreadcrumbs = function(dataObj) {
  console.log('updateBreadcrumbs()');
  let theHolder = this.element.querySelector(selector_breadcrumbNav);
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
    theSecondLabel = `${dataObj.current_candidateName}: `;
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
  if (newCandidateID != this.current_candidateID) {
    this.current_candidateID = newCandidateID;
    this.current_candidateLastName = name.substr(0, name.indexOf(' ['));
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
};

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
 *
 */
PresidentialFundsMap.prototype.handleStateClick = function(e) {
  console.log('A STATE WAS CLICKED! ', e);
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
 *
 */
PresidentialFundsMap.prototype.handleResetClick = function(e) {
  if (e) e.preventDefault();

  this.current_candidateID = specialCandidateIDs[0];
  this.current_electionState = 'US';
  this.current_electionStateName = '';
  this.current_candidateLastName = '';
  this.current_candidateName = 'All candidates';

  this.loadCandidatesList();

  let dataObj = {
    candidate_id: this.current_candidateID,
    name: this.current_candidateName,
    party: '',
    year: this.current_electionYear,
    currentState: this.current_electionState, // for breadcrumbs
    currentStateName: this.current_electionStateName, // for breadcrumbs
    candidateLastName: this.current_candidateLastName // for breadcrumbs
  };

  this.displayUpdatedData_candidate(dataObj);
  this.updateBreadcrumbs(dataObj);
};

/**
 * Controls class names and functionality of the widget.
 * Called when we both start and complete (@see loadMapData() )
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
