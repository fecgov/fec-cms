/* eslint-disable no-console */
/* eslint-disable no-trailing-spaces */
/* eslint-disable semi */
/* eslint-disable no-unused-vars */

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
import { officeNames } from './utils';

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
const dataTypes = {
  candidates: {
    type: 'candidates', url: '',
    queryFieldName: 'candidate_id',
    name: 'candidate', display: 'name', limit: 5,
    source: 'N/A FOR AUTOSUGGEST?', templates: {}
  },
  committees: {
    type: 'committees', url: '',
    queryFieldName: 'committee_id',
    name: 'committee', display: 'name', limit: 10,
    source: 'N/A FOR AUTOSUGGEST?', templates: {}
  },
  auditCandidates: {
    type: 'auditCandidates', url: '',
    queryFieldName: 'qq',
    name: 'auditCandidates', display: 'name', limit: 10,
    source: 'N/A FOR AUTOSUGGEST?', templates: {}
  },
  auditCommittees: {
    type: 'auditCommittees', url: '',
    queryFieldName: 'q',
    name: 'auditCommittees', display: 'name', limit: 10,
    source: 'N/A FOR AUTOSUGGEST?', templates: {}
  },
  allData: {
    type: 'allData', url: '/data/',
    queryFieldName: '',
    name: 'TODO - autosuggest.dataTypes[allData]', display: 'name', limit: 10,
    source: 'N/A FOR AUTOSUGGEST?', templates: {}
  },
  all: {
    type: 'all', url: '/data/',
    queryFieldName: '',
    name: 'all', display: 'name', limit: 10,
    source: 'N/A FOR AUTOSUGGEST?', templates: {}
  },
  // caseRegulatoryCitation
  //   case_regulatory_citation
  // caseRegulatoryCitation
  murs: {
    type: 'murs', url: '',
    queryFieldName: '',
    name: 'murs', display: 'name', limit: 10,
    source: 'N/A FOR AUTOSUGGEST?', templates: {}
  },
  individuals: { // Only here so we can use the url
    type: 'individuals', url: '/'
  },
  site: { // Only here so we can use the url
    type: 'site', url: '/'
  }
};

/**
 * @private
 * Used inside autocomplete to build the results list
 */
const resultsListOptions = {
  class: 'as-dataset as-dataset-candidate',
  maxResults: 20,
  tabSelect: true,
  element: item => {
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
      const displayName = data['key'] == 'name' ? data.match : data.value.name;
      const theID = data['key'] == 'id' ? data.match : data.value.id;
      item.innerHTML = `<span class="as-suggestion__name" tabindex="-1">${displayName} (${theID})</span>`;

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
function getUrl(resourceType, queryString) {
  console.log('getUrl(resources, queryString): ', resourceType, queryString);

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
  const results = data.results;
  const resultsLimit = 5;

  if ((type == 'candidates' || type == 'auditCandidates' ) && results.length > 0)
    toReturn.push({ is_header: true, id: window.queryText, name: 'Select a candidate:', type: 'none' });

  else if ((type == 'committees' || type == 'auditCommittees') && results.length > 0)
    toReturn.push({ is_header: true, id: window.queryText, name: 'Select a committee:', type: 'none' });

  // TODO: CHECK THIS
  else if ((type == 'case_regulatory_citation' || type == 'case_statutory_citation') && results.length > 0)
    toReturn.push({ is_header: true, id: window.queryText, name: 'Select a citation:', type: 'none' });

  results.forEach(element => {
    element.type = dataTypes[type].name;
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
  if (type == 'individual')
    return [{ is_suggestion: true, id: window.queryText, name: 'Search individual contributions from:', type: 'individual' }];

  if (type == 'site')
    return [{ is_suggestion: true, id: window.queryText, name: 'Search other pages:', type: 'site' }];

  return;
}

/**
 *
 * @param {string} q
 * @param {Autosuggest} self
 * @returns {object[]} Array of results formatted like [{ id: C123456789, name: 'Candidate Name', type: 'candidate' }]
 */
async function getData(q, self) {
  console.log('src.getData()');
  console.log('  q: ', q);
  const fetchedResults = [];
  window.queryText = q;

  let dataTypesToGet = [];
  // Let's figure out which types of queries we want.
  // The order inside dataTypesToGet is the order the results will be displayed
  switch(self.dataDetails.type) {
    case 'candidates':
      dataTypesToGet.push('candidates'); break;

    case 'canCom': // Candidates and committees only, no suggestions
      dataTypesToGet.push('candidates', 'committees'); break;

    case 'canSit': // Candidates + suggestion for other website pages
        dataTypesToGet.push('candidates', 'site'); break;

    case 'comSit': // Committes + suggestion for other website pages
        dataTypesToGet.push('committees', 'site'); break;

    case 'committees':
      dataTypesToGet.push('committees'); break;

    case 'all':
      dataTypesToGet.push('candidates', 'committees', 'individual', 'site'); break;

    case 'allData':
      dataTypesToGet.push('candidates', 'committees', 'individual'); break;

    case 'auditCandidates':
      dataTypesToGet.push('audit_candidates'); break;

    case 'auditCommittees':
      dataTypesToGet.push('audit_committees'); break;

      case 'TODO':
      dataTypesToGet.push('site');
      // legal/citation/regulation
      // legal/citation/statute
      break;

    default:
      dataTypesToGet.push('site'); break;
  }

  // A place to save the promises we're going to make
  let promises = [];
  // Taking that list (promises), let's queue up a Promise for each
  while (dataTypesToGet.length > 0) {
    const thisType = dataTypesToGet[0];
    // If we're dealing with a type that only returns a suggestion (doesn't do a fetch, just formats what we give it)
    if (thisType == 'individual' || thisType == 'site') {
      // Add a new Promise for returning those results
      promises.push(new Promise(resolve => {
        resolve(getSuggestions(thisType));
      }));
    } else {
      // Otherwise, if we need to do a fetch, let's get it built
      promises.push(new Promise((resolve, reject) => {
        fetch(getUrl(thisType, q), fetchInit)
          .then(response => response.json())
          .then(data => {
            resolve(formatResults(thisType, data));
          })
          .catch(error => {
            reject(`The ${thisType} fetch failed because: ${error}`);
          });
      }));
    }
    // Now that we've added the Promise, remove the first element from the list so we don't while() forever
    dataTypesToGet.shift();
  }

  await Promise.allSettled(promises)
    .then(responses => {
      responses.forEach(response => {
        if (response.status == 'fulfilled') {
          console.log('response: ', response);
          fetchedResults.push(...response.value);
        } else {
          console.log('another response: ', response);
        }
      });
    });

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
 * @property {string|number} value
 * @property {HTMLElement} wrapper - The element created to wrap the <input> and the results
 * @property {object} dataDetails - pulled from dataTypes[opts.type]
 * @property {boolean} isSiteSearch - Site searches handle their selection events themselves; filters and others that use Autosuggest handle their own selections
 * @property {string|boolean} canRefineSearch - Determines whether this instance listens for changes to its form and adjusts its suggestions accordingly
 *
 * @listens events.searchTypeChanged
 * @emits autosuggest:select
 */
function Autosuggest(elementSelector, opts = {}) {
  console.log('Autosuggest(elementSelector, opts): ', elementSelector, opts);
  // if elementSelector is a string, use that string to find the dom element and set that to this.input
  // else if elementSelector is an element, just save it
  this.input = typeof elementSelector == 'string' ? document.querySelector(elementSelector) : elementSelector;
  this.dataDetails = dataTypes[this.input.dataset.searchType];

  this.autoComplete = null;
  this.formerSelectionIndex;
  this.value = '';
  this.isSiteSearch = this.input.classList.contains('js-site-search');
  this.canRefineSearch = false; // default to false
  //
  if(this.input.closest('form') && this.input.closest('form').dataset.refineSearch)
    this.canRefineSearch = this.input.closest('form').dataset.refineSearch;

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
  // this.input.value = '';
  let self = this;
  let theseOpts = Object.assign({}, defaultAutocompleteOptions);

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
    console.log('  this: ', this);
    try {
      console.log('try');
      console.log('  this: ', this);
      // console.log('  this.queryType: ', this.queryType);
      // console.log('  q: ', q);
      let results = await getData(q, self);
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
  // this.input.addEventListener('focus', this.handleFocus.bind(this));
  this.input.addEventListener('navigate', this.handleNavigate.bind(this));
  this.input.addEventListener('open', this.handleOpen.bind(this));
  this.input.addEventListener('results', this.handleResults.bind(this));
  this.input.addEventListener('selection', this.handleSelect.bind(this));

  // The search page uses events to dispatch when the dataset type has changed
  if (this.canRefineSearch) {
    this.input.closest('form').addEventListener('change', this.handleRefineChange.bind(this));
  }

  this.matchAriaExpandeds();
};

/**
 * Removes the default listener specified by eventName (typically to be added added by another package)
 * @param {string="close","focus","navigate","open","results","selection"} eventName - the name of the event to removeEventListener
 */
Autosuggest.prototype.off = function(eventName) {
  // Only opens if the resultsList is not empty
  if (eventName == 'close') this.input.removeEventListener('close', this.handleClose);
  // else if (eventName == 'focus') this.input.removeEventListener('focus', this.handleFocus);
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
Autosuggest.prototype.handleOpen = function() {
  console.log('handleOpen()');
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
  console.log('Autosuggest.handleResults(e): ', e);
  // Reset the 'last selected' marker for arrow/keyboard navigation
  this.formerSelectionIndex = 0;

  /**
   * Autosuggest open event
   *
   * @event autosuggest:results
   * @type {object}
   * @property {Event} e - an event? // TODO: add these
   */
  const newEvent = new CustomEvent('autosuggest:results', {
    bubbles: true,
    detail: e
  });
  this.input.dispatchEvent(newEvent);
};

/**
 * Handles when a results item is clicked, tapped, or selected with the keyboard
 * @param {CustomEvent} e - From autocomplete
 * @param {object} e.detail - Carries the autoComplete.js "feedback" object
 *
 * @emits this.input#autosuggest:close
 *
 * @returns {null} if (e.detail.selection.value.is_header)
 */
Autosuggest.prototype.handleSelect = function(e) {
  console.log('Autosuggest.handleSelect(e): ', e);
  // First, stop the event here, just in case
  e.stopImmediatePropagation();

  const val = e.detail.selection.value;

  // If it's a header, ignore the selection/click/tap
  if (val.is_header) return;

  // If we aren't in a filter, what should we do?
  else if (this.isSiteSearch) {
    console.log('  else if');
    // Find the element
    if (val.type == 'individual')
      window.location = `${this.dataDetails.individuals.url}receipts/individual-contributions/?contributor_name=${val.id}`;

    else if (val.type == 'candidate' || val.type == 'committee')
      window.location = `${this.dataDetails[val.type].url}${val.type}/${val.id}`;

    else if (val.type == 'site')
      this.searchSite(e.detail.query);

  } else {
    console.log('  else');
    // If we're in a filter or some other, we'll dispatch the event and be done

    /**
     * @event autosuggest:select
     * @type {object}
     * @property {} e - an event? // TODO: add these
     */
    const newEvent = new CustomEvent('autosuggest:select', {
      bubbles: false,
      detail: e.detail
    });
    this.input.dispatchEvent(newEvent);
  }
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
 * Updates this.dataDetails when a filter/refining element is changed. Changes dataDetails to a different option or,
 * if there is a special case, it sets dataDetails to a special combination.
 * Final output must correlate to values in a getData#switch case
 * Options here will be used inside @see Autosuggest.getData .
 * Similar to typeahead.handleChangeEvent()
 * @todo Current functionality only accounts for /search/ and will need to be expanded if used elsewhere
 * @param {Event} e - Change event from the form hosting this element, which fires any time a field inside changes its value
 * @property {string[]} selectors - The product of <input data-refine-search="">, which is a list of selectors for the form elements to check
 * @property {HTMLElement[]} elements - Array of the elements found using the selectors from selectors[]
 * @property {string[]} types - List of types that correspond to dataTypes[] values, info comes from <input value="">
 * @listens form.change
 */
Autosuggest.prototype.handleRefineChange = function(e) {
  const selectors = this.canRefineSearch.split(',');
  const elements = [];
  const types = [];
  let newDataDetails;

  // For each selector, let's find those elements and put them in, you guessed it: elements[].
  selectors.forEach(selector => {
    elements.push(document.querySelector(selector.trim()));
  });
  // For all of the elements, let's look at their value attribute for which type to query. Then, yep, save them into types[].
  elements.forEach(element => {
    if (element.checked) types.push(element.value);
  });

  // If types[] is only one, we can go ahead and use that dataType—no reason to create a special combination.
  if (types.length === 1) {
    newDataDetails = dataTypes[types[0]];

  // But if we have more than one, we'll need to build that
  } else {
    let theSpecialType = '';
    // Make a camelcase string of each type[]. e.g. canComSit
    for (let i = 0; i < types.length; i++) {
      theSpecialType += i == 0
        ? types[i].toString().substring(0, 3).toLowerCase()
        : types[i].charAt(0).toUpperCase() + types[i].substring(1, 3).toLowerCase();
    }
    // Then make a special one-off dataDetails
    newDataDetails = { type: theSpecialType };
  }
  // Assign our new dataDetails
  this.dataDetails = newDataDetails;
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
 * TODO: remove this?
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
  mode: 'cors',
  cache: 'default'
};

module.exports = {
  Autosuggest: Autosuggest,
  dataTypes: dataTypes,
  fetchInit: fetchInit
};
