'use strict';

/**
 * @fileoverview Wrapper for @tarekraafat/autocomplete.js
 * 'autosuggest' is used to refer to this class' element and functionality
 * 'autocomplete' is used to refer to elements created by @tarekraafat/autocomplete.js
 */

// TODO: double check that the autosuggest filters handle a generic user returnkey appropriately (type + returnkey without clicking)
// TODO: rename (and standardize) title cases like `autoComplete` `autoSuggest:open` (autocomplete, autoComplete, AutoComplete?)
// TODO: better solution for window.queryText
// TODO: auditCandidates
// TODO: auditCommittees
// TODO: rad lookup

import autoComplete from '@tarekraafat/autocomplete.js';
import officeNames from './utils';

// var events = require('./events');

/**
 * Holds the configuration data for the various search/lookup types/
 * @public
 * @property {object} dataDetails - From <input data-search-type="">. Inside instances, the selected object becomes this.dataDetails.
 * Valid values: dataTypes['candidates'|'committees'|'auditCandidates'|'auditCommittees'|'allData'|'all'] // TODO: add the MURS and legal options
 * @property {string} dataDetails.type - The same as used for dataTypes[{string}] so we have it as part of this.dataDetails.
 * @property {string} dataDetails.url - //TODO: is this really necessary?
 * @property {string} dataDetails.queryFieldName - Some fields have different IDs and Types. This connects them to the right value in the db/api.
 * @property {string} dataDetails.name - Used while naming fields.
 * @property {string} dataDetails.display - Which field to display. // TODO: are we using this?
 * @property {number} dataDetails.limit - How many results to display. // TODO: use this?
 * @property {string} dataDetails.source - // TODO: unused?
 * @property {object} dataDetails.templates - Unused // TODO: safe to remove?
 */
const resultsListOptions = {
  class: 'as-dataset as-dataset-candidate',
  maxResults: 20,
  tabSelect: true,
  element: (item, data) => {
    item.setAttribute('role', 'presentation');
  }
};

/**
 * @private
 * Used inside autocomplete to build the results list's items
 */
const resultItemOptions = {
  class: 'as-suggestion as-selectable',
  selected: 'as-cursor',
  submit: true,
  highlight: 'as-highlight',
  element: (item, data) => {
    // For headers (e.g. "Select a candidate"), no tabbing, data.value.name only
    if (data.value.is_header) {
      item.setAttribute('class', 'as-suggestion__header');
      item.setAttribute('tabindex', '-1');
      item.innerHTML = data.value.name;

    // For suggestions (e.g. "Search other pages"), no tabbing, data.value.name + the searched text
    } else if (data.value.is_suggestion) {
      item.setAttribute('class', 'as-suggestion as-select');
      item.setAttribute('tabindex', '-1'); // TODO: should suggestions be tabbable
      item.innerHTML = `<strong>${data.value.name}</strong> "<strong class="as-highlight">${data.value.id}</strong>"`;

    // For other entries, we want to include the name, id, and office if applicable, also highlight the matched data
    } else {
      // If the match was in the name, display data.match, otherwise show the default of data.value.name
      // Likewise for the ID: if ID is the match, show data.match instead of data.value.id
      let theName = data['key'] == 'name' ? data.match : data.value.name;
      let theID = data['key'] == 'id' ? data.match : data.value.id;
      item.innerHTML = `<span class="as-suggestion__name" tabindex="-1">${theName} (${theID})</span>`;

      // Include the office sought if it exists
      if (data.value.office_sought) {
        const officeLabel = officeNames[data.value.office_sought];
        item.innerHTML += ` <span class="as-suggestion__office" tabindex="-1">${officeLabel}</span>`;
      }

      // For committees, include the icon for whether it's still active
      if (data.value.is_active === true) item.innerHTML += '<span class="is-active-status"></span>';
      else if (data.value.is_active === false) item.innerHTML += '<span class="is-terminated-status"></span>';
    }
  }
};

/**
 * Security tools don't like when we hardcode something like 'key' with a value.
 * The autocomplete package uses 'keys' to point to what it should search from results' attributes.
 * So we have an array of the fields we need to tell autocorrect.
 * @returns {array} Array: ['name', 'id'] to be used for autocorrect
 */
function searchedAttribs() {
  // In autocomplete, we want to look at the 'name' and 'id' values from data results
  return ['name', 'id'];
}

/**
 * Called inside @getData to determine the queryPath for the different search types
 * @param {string} resource - the type of resource/path requested (e.g. candidates, committees)
 * @param {string} queryString
 * @returns {string} A string like https://api.open.fec.gov/v1/names/candidates/?q=${queryString}&api_key=${window.API_KEY_PUBLIC}
 */
function getUrl(resource, queryString) {
  console.log('getUrl(resources, queryString): ', resource, queryString);

  window.API_LOCATION = 'https://fec-dev-api.app.cloud.gov'; // TODO: remove this

  // console.log('getUrl(): ', resource, queryString);
  const thePath = [
    window.API_LOCATION,
    window.API_VERSION
  ];

  if (resourceType == 'candidates' || resourceType == 'committees'
    || resourceType == 'audit_candidates' || resourceType == 'audit_committees') {
    thePath.push('names', resourceType, '');

    // TODO: CHECK THESE
  } else if (resourceType == 'regulation' || resourceType == 'statute') {
    console.log('TODO - getURL FOR MUR SEARCHES');
    thePath.push('legal', 'citation', resourceType);
  }

  let toReturn = thePath.join('/');

  toReturn += `?q=${queryString}&api_key=${window.API_KEY_PUBLIC}`;
  // console.log('getUrl toReturn: ', toReturn);
  return toReturn;
}

/**
 * 
 * @param {string} type - The type of data results to structure
 * @param {JSON} data - The API response i the form of {api_version: "", results: [{…}]}
 * @returns {object[]} Array of objects structured like { is_header: true, id: window.queryText, name: 'Select a committee:', type: 'none' }
 */
function formatResults(type, data) {
  let toReturn = [];
  let results = data.results;
  let resultsLimit = 5;

  if ((type == 'candidates' || type == 'audit_candidates' ) && results.length > 0)
    toReturn.push({ is_header: true, id: window.queryText, name: 'Select a candidate:', type: 'none' });

  else if ((type == 'committees' || type == 'audit_committees') && results.length > 0)
    toReturn.push({ is_header: true, id: window.queryText, name: 'Select a committee:', type: 'none' });

  // TODO: CHECK THIS
  else if ((type == 'case_regulatory_citation' || type == 'case_statutory_citation') && results.length > 0)
    toReturn.push({ is_header: true, id: window.queryText, name: 'Select a citation:', type: 'none' });

  results.forEach(element => {
    element.type = type;
  });
  // TODO: handle the audit_* types in the click handler

  // Take the results array, shave it to fit within resultsLimit, then add it to toReturn
  toReturn = toReturn.concat(results.slice(0, resultsLimit));

  return toReturn;
}

/**
 *
 * @param {*} type
 * @returns
 */
function getSuggestions(type) {
  const toReturn = [];
  if (type == 'all') {
    toReturn.push({ is_suggestion: true, id: window.queryText, name: 'Search individual contributions from:', type: 'individual' });
    toReturn.push({ is_suggestion: true, id: window.queryText, name: 'Search other pages:', type: 'site' });
  }
  return toReturn;
}

/**
 *
 * @param {string} q
 * @param {object} theDataset
 * @returns {object[]} Array of results formatted like [{ id: C123456789, name: 'Candidate Name', type: 'candidate' }]
 */
async function getData(q, qType) {
  console.log('src.getData()');
  // TODO: Would like to come back and make this more adaptable, remove the repeated code
  // console.log('  q: ', q);
  // console.log('  qType: ', qType);
  const fetchedResults = [];
  window.queryText = q;
  if (qType == 'candidate') {
    console.log('  qType == candidate');
    // Any changes here should also be made inside `== 'all'`
    await fetch(getUrl('candidates', q), fetchInit)
      .then(response => response.json())
      .then(data => {
        fetchedResults.push(...formatResults('candidates', data));
      });

  } else if (qType == 'committee_id') {
    // Any changes here should also be made inside `== 'all'`
    await fetch(getUrl('committees', q), fetchInit)
      .then(response => response.json())
      .then(data => {
        fetchedResults.push(...formatResults('committees', data));
      });

  } else if (qType == 'all' || qType == 'allData') { /** 'all' will include suggestions; 'allData' won't @see getSuggestions */
    // Any changes here should be made inside `== 'candidate'` and `== 'committee'`, too
    // console.log('would have got all data');
    await fetch(getUrl('candidates', q), fetchInit)
      .then(response => response.json())
      .then(data => {
        fetchedResults.push(...formatResults('candidates', data));
        return fetch(getUrl('committees', q), fetchInit);
      })
      .then(response => response.json())
      .then(data => {
        fetchedResults.push(...formatResults('committees', data));
      })
      .then(() => {
        fetchedResults.push(...getSuggestions(qType));
      });

  } else if (qType == 'auditCandidates') {
    console.log('  qType = auditCandidates');
    await fetch(getUrl('audit_candidates', q), fetchInit)
      .then(response => response.json())
      .then(data => {
        fetchedResults.push(...formatResults('audit_candidates', data));
      });

  } else if (qType == 'auditCommittees') {
    console.log('  qType = auditCommittees');
    await fetch(getUrl('audit_committees', q), fetchInit)
      .then(response => response.json())
      .then(data => {
        fetchedResults.push(...formatResults('audit_committees', data));
      });

  // TODO: CHECK THESE
  } else if (qType == 'MUR CITATION FILTERS') {
    legal/citation/regulation
    legal/citation/statute
  } else {
    console.log(`  qType was '${qType}' so didn't do anything`);
  }

  if (fetchedResults.length === 0) {
    fetchedResults.push({ is_suggestion: true, id: window.queryText, name: 'No results found:', type: 'none' });
  }
  // console.log('going to return fetchedResults: ', fetchedResults);
  return fetchedResults;
}

/**
 * @private
 * Default options for autocomplete
 * Of note, `selector` and `data.src` are basically always replaced.
 */
const defaultAutocompleteOptions = {
  selector: () => {
    '.js-site-search';
  },
  data: {
    src: async () => {
      /** Default function will be replaced when we have an instance type, etc. @see Autosuggest.prototype.init */
      return [];
    },
    keys: searchedAttribs()
  },
  resultsList: resultsListOptions,
  resultItem: resultItemOptions
};

/**
 * The main Autosuggest element
 * @constructor
 * @param {string|HTMLInputElement} elementSelector - The <input> field that will serve as the Autosuggest <input>
 * @param {object} opts - 
 *
 * @property {autoComplete} autoComplete - The instance of autoComplete
 * @property {number} formerSelectionIndex - An integer used for tracking hover/selected states with arrows, especially for ⬆︎/⬇︎ onto a non-selectable element
 * @property {HTMLInputElement} input - The <input> for this instance of Autosuggest
 * @property {HTMLElement} resultsHolder
 * @property {string} url
 * @property {string | number} value
 * @property {HTMLElement} wrapper - The element created to wrap the <input> and the results
 * @property {object} dataDetails - pulled from dataTypes[opts.type]
 * @property {boolean} isSiteSearch - Site searches handle their selection events themselves; filters and others that use Autosuggest handle their own selections
 *
 * @listens events.searchTypeChanged
 * @emits autosuggest:select
 */
function Autosuggest(elementSelector, opts = {}) {
  console.log('Autosuggest(elementSelector, opts): ', elementSelector, opts);
  // if elementSelector is a string, use that string to find the dom element and set that to this.input
  // else if elementSelector is an element, just save it
  this.input = typeof elementSelector == 'string' ? document.querySelector(elementSelector) : elementSelector;
  this.queryType = opts.queryType;
  this.url = opts.url || '/';
  this.autoComplete = null;
  this.formerSelectionIndex;
  this.value = '';

  console.log('  this.input: ', this.input);
  console.log('  this.queryType: ', this.queryType);

  this.init();
}

/**
 * Called by the constructor,
 * - makes HTMLElements to convert the <input> to the whole autosuggest element
 * - gets data ready for the autocomplete functionality
 * - initializes the autocomplete
 * - sets aria attributes
 * - adds event listeners
 */
Autosuggest.prototype.init = function() {
  // console.log('Autosuggest.init()');
  // TODO: do we need to destroy/reset one if it already exists?
  // if (this.typeahead) this.input.typeahead('destroy');
  this.input.value = '';

  let theseOpts = defaultAutocompleteOptions;

  // Create a new span to wrap the input,
  // add the span to the page before the input
  // and move the input into it
  this.wrapper = document.createElement('span');
  this.wrapper.setAttribute('class', 'autosuggest');
  this.wrapper.setAttribute('aria-expanded', 'false');
  // this.wrapper.setAttribute('aria-expanded', 'false');
  this.wrapper.innerHTML = `<span role="status" aria-live="polite"></span><pre aria-hidden="true"></pre>`;
  // Create an element to hold the results
  this.resultsHolder = document.createElement('div');
  this.resultsHolder.setAttribute('role', 'listbox');
  this.resultsHolder.setAttribute('class', 'as-menu');
  this.resultsHolder.setAttribute('aria-live', 'polite');
  // this.resultsHolder.setAttribute('aria-expanded', 'false');
  this.resultsHolder.innerHTML = '<span />';
  this.wrapper.appendChild(this.resultsHolder);

  this.input.parentNode.insertBefore(this.wrapper, this.input);
  this.wrapper.prepend(this.input);

  // Now to set the options for creating the autocomplete
  // The selector gets tricky if we're only using classes when there are multiple fields on the page (like /search)
  // so we'll use the input field's ID since they're unique
  theseOpts.selector = `#${this.input.getAttribute('id')}`;
  theseOpts.resultsList.destination = () => {
    // return `#${this.input.getAttribute('aria-controls')} span`;
    return this.wrapper.querySelector('.as-menu span');
  };
  // theseOpts.data['keys'] = searchedAttribs();
  theseOpts.data.src = async q => {
    console.log('AutoSuggest.src: async q: ', q);
    try {
      console.log('try');
      // console.log('  this.queryType: ', this.queryType);
      // console.log('  q: ', q);
      let results = await getData(q, this.queryType);
      // console.log('got results of ', results);
      return results;
    } catch(e) {
      console.log('catch e: ', e);
      return e;
    }
  };

  this.autocomplete = new autoComplete(theseOpts);

  let theMenus = this.wrapper.querySelectorAll('.as-menu');
  theMenus.forEach(el => {
    el.setAttribute('aria-live', 'polite');
  });

  let theInputs = this.wrapper.querySelectorAll('.as-input');
  theInputs.forEach(el => {
    el.setAttribute('aria-expanded', 'false').removeAttribute('aria-readonly');
  });

  this.input.addEventListener('close', this.handleClose.bind(this));
  this.input.addEventListener('focus', this.handleFocus.bind(this));
  this.input.addEventListener('navigate', this.handleNavigate.bind(this));
  this.input.addEventListener('open', this.handleOpen.bind(this));
  this.input.addEventListener('results', this.handleResults.bind(this));
  this.input.addEventListener('selection', this.handleSelect.bind(this));

  this.matchAriaExpandeds();
};

/**
 * Removes the default listener specified by eventName (typically to be added added by another package)
 * @param {String="close","focus","navigate","open","results","selection"} eventName - the name of the event to removeEventListener
 */
Autosuggest.prototype.off = function(eventName) {
  // Only opens if the resultsList is not empty
  if (eventName == 'close') this.input.removeEventListener('close', this.handleClose);
  else if (eventName == 'focus') this.input.removeEventListener('focus', this.handleFocus);
  else if (eventName == 'navigate') this.input.removeEventListener('navigate', this.handleNavigate);
  else if (eventName == 'open') this.input.removeEventListener('open', this.handleOpen);
  else if (eventName == 'results') this.input.removeEventListener('results', this.handleResults);
  else if (eventName == 'selection') this.input.removeEventListener('selection', this.handleSelect);
};

/**
 *
 * @param {CustomEvent} e - from autocomplete
 * @param {object} e.detail - Carries the autoComplete.js "feedback" object
 * @emits this.input#autosuggest:open // TODO: it doesn't emit this
 */
Autosuggest.prototype.handleOpen = function(e) {
  this.matchAriaExpandeds();
};

/**
 * Fires after "resultsList" is closed
 * @param {CustomEvent} e - From autocomplete
 * @param {object} e.detail - Carries the autoComplete.js "feedback" object
 * @emits this.input#autosuggest:close // TODO: nope, doesn't emit this
 */
Autosuggest.prototype.handleClose = function(e) {
  this.matchAriaExpandeds();
};

/**
 * Called to copy the aria-expanded state from the autocomplete element up to the <input>'s wrapper for css selectors
 */
Autosuggest.prototype.matchAriaExpandeds = function() {
  let theACwrapper = this.wrapper.querySelector('.autoComplete_wrapper');

  this.wrapper.setAttribute(
    'aria-expanded',
    theACwrapper.getAttribute('aria-expanded')
  );
};

/**
 * Called when Autocomplete gets results
 * @param {CustomEvent} e - from autocomplete
 * @param {object} e.detail - carries the matching results values
 * @event autosuggest:results
 */
Autosuggest.prototype.handleResults = function(e) {
  // Reset the 'last selected' marker for arrow/keyboard navigation
  this.formerSelectionIndex = 0;

  /**
   * Autosuggest open event
   *
   * @event autosuggest:results
   * @type {object}
   * @property {Event} e - an event? // TODO: add these
   */
   this.input.dispatchEvent(new CustomEvent('autosuggest:results', e));
};

/**
 * Handles when a results item is clicked, tapped, or selected with the keyboard
 * @param {CustomEvent} e - From autocomplete
 * @param {object} e.detail - Carries the autoComplete.js "feedback" object
 *
 * @emits this.input#autosuggest:close
 *
 * @returns {null} if (e.detail.selection.value.is_header)
 * @event autosuggest:close
 */
Autosuggest.prototype.handleSelect = function(e) {
  console.log('Autosuggest.handleSelect(e): ', e);

  const val = e.detail.selection.value;

  // If it's a header, ignore the selection/click/tap
  if (val.is_header) return;

  // Find the element
  if (val.type == 'individual') {
    window.location = `${this.url}receipts/individual-contributions/?contributor_name=${val.id}`;

  } else if (val.type == 'candidate_id' || val.type == 'committee_id') {
    window.location = `${this.url}${val.type}/${val.id}`;

  } else if (val.type == 'site') {
    this.searchSite(e.detail.selection.match);
  }

  // let eventObj = Object.assign
  /**
   * Broadcast the autosuggest:select event
   * @event autosuggest:select
   * @type {Object}
   * @property {CustomEvent} e - the CustomEvent that came in from autocomplete
   */
   this.input.dispatchEvent(new CustomEvent('autosuggest:select', e));
};

/**
 * Mostly called after keyboard navigation, this function checks if the user would now be on a header (nonselectable) element
 * and then moves them upward, downward, or to the other end of the results list based on which direction they want to go
 * and which item was 'hovered' last (based on this.formerSelectionIndex)
 * @param {CustomEvent} e - from autocomplete
 * @param {object} e.detail - carries the autoComplete.js "feedback" object
 */
Autosuggest.prototype.handleNavigate = function(e) {
  console.log('handleNavigate(e): ', e);
  // If we've just focused on a header object, we want to nav off of it
  let sel = e.detail.selection;
  if (sel.value.is_header === true) {
    // If we were previously higher on the list, let's go to the next
    if (this.formerSelectionIndex <= sel.index) this.autocomplete.next();
    // If we were previously lower on the list, let's jump up another
    else this.autocomplete.previous();

    // Save the former selection for next time
    this.formerSelectionIndex = sel.index;

  } else if (
    this.formerSelectionIndex == sel.index &&
    this.formerSelectionIndex >= e.detail.results.length - 1
    ) {
      this.formerSelectionIndex = -1;
      this.autocomplete.goTo(0);

  } else {
    this.formerSelectionIndex = sel.index;
    this.input.value = sel.value.name;
    this.value = sel.value.name;
  }
};

/**
 *
 */
Autosuggest.prototype.highlightFirstResult = function() {
  // TODO: do we still care about doing this?
  // this.formerSelectionIndex = -1;
  // this.autocomplete.goTo(0);
};

/**
 * Called by @see handleSelect
 * @param {object} q
 * q is the same as e.detail.selection.match from @see Autosuggest.prototype.handleSelect
 */
Autosuggest.prototype.searchSite = function(q) {
  /** If the site search option is selected, this function handles submitting
   * a new search on /search
   */
  let form = this.input.closest('form');
  let action = form.getAttribute('action');
  this.input.value = q;
  this.value = q;
  form.setAttribute('action', action);
  form.submit();
};

/**
 *
 */
const fetchInit = {
  headers: {
    accept: 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    pragma: 'no-cache'
  },
  referrerPolicy: 'same-origin',
  body: null,
  method: 'GET',
  mode: 'cors'
};

module.exports = {
  Autosuggest: Autosuggest
};
