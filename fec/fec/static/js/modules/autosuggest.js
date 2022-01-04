'use strict';

/**
 * @fileoverview Wrapper for @tarekraafat/autocomplete.js
 * 'autosuggest' is used to refer to this class' element and functionality
 * 'autocomplete' is used to refer to elements created by @tarekraafat/autocomplete.js
 */

import autoComplete from '@tarekraafat/autocomplete.js';
// import events from './events';

// var events = require('./events');

/**
 * used to translate 'H', 'S', and 'P' into their full office names
 */
const officeMap = {
  H: 'House',
  S: 'Senate',
  P: 'President'
};

let resultsListOptions = {
  class: 'as-dataset as-dataset-candidate',
  maxResults: 20,
  tabSelect: true,
  element: (item, data) => {
    item.setAttribute('role', 'presentation');
  }
};

let resultItemOptions = {
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
      item.setAttribute('tabindex', '-1');
      item.innerHTML = `<strong>${data.value.name}</strong> "<strong class="as-highlight">${data.value.id}</strong>"`;

    // For other entries, we want to include the name, id, and office if applicable, also highlight the matched data
    } else {
      item.innerHTML = `<span class="as-suggestion__name" tabindex="-1">`;
      item.innerHTML += data['key'] == 'name' ? data.match : data.value.name;
      item.innerHTML += ' (';
      item.innerHTML += data['key'] == 'id' ? data.match : data.value.id;
      item.innerHTML += `)</span>`;

      if (data.value.office_sought) {
        let officeLabel = officeMap[data.value.office_sought];
        `<span class="as-suggestion__office" tabindex="-1">${officeLabel}</span>`;
      }

      if (data.value.is_active === true) item.innerHTML += '<span class="is-active-status"></span>';
      else if (data.value.is_active === false) item.innerHTML += '<span class="is-terminated-status"></span>';
    }
  }
};

/**
 * Security tools don't like when we hardcode something like 'key' with a value.
 * The autocomplete package uses 'keys' to point to what it should search from results' attributes
 * @returns {Array}
 */
function searchedAttribs() {
  // In autocomplete, we want to look at the 'name' and 'id' values from data results
  return ['name', 'id'];
}

// function formatCandidate(result) {
//   console.log('formatCandidate(result): ', result);
//   return {
//     name: result.name,
//     id: result.id,
//     type: 'candidate',
//     office: officeMap[result.office_sought]
//   };
// }

// function formatCommittee(result) {
//   return {
//     name: result.name,
//     id: result.id,
//     is_active: result.is_active,
//     type: 'committee'
//   };
// }

// function formatAuditCommittee(result) {
//   return {
//     name: result.name,
//     id: result.id,
//     type: 'auditCommittee'
//   };
// }

// function formatAuditCandidate(result) {
//   return {
//     name: result.name,
//     id: result.id,
//     type: 'auditCandidate'
//   };
// }

/**
 *
 * @param {string} resource
 * @param {string} queryString
 * @returns {string} like https://api.open.fec.gov/v1/names/candidates/?q=${queryString}&api_key=${window.API_KEY_PUBLIC}
 */
function getUrl(resource, queryString) {
  let toReturn = [
    window.API_LOCATION,
    window.API_VERSION,
    'names',
    resource,
    ''
  ].join('/');
  toReturn += `?q=${queryString}&api_key=${window.API_KEY_PUBLIC}`;
  return toReturn;
}

// let dataSteps = [
//   {
//   console.log('siteSearchOpts.data.src this: ', this);
//   let fetchedResults = [];
//   window.queryText = q;
//   await fetch(getUrl('candidates', q), fetchInit)
//     .then(response => response.json())
//     .then(data => {
//       let results = data.results;

//       if (results.length > 0) fetchedResults.push({ is_header: true, id: window.queryText, name: 'Select a candidate:', type: 'none' });
//       // console.log('data.results.length: ', data.results.length);
//       // if (data.results.length > 0) console.log('  first data.results: ', data.results[0]);
//       results.forEach(element => {
//         element.type = 'candidate';
//       });
//       fetchedResults.push(...results.slice(0, 5));
//       // if (response.status !== 200) throw new Error('The network rejected the grand total request.');
//       // else if (response.type == 'cors') throw new Error('CORS error');
//       // response.json().then(data => {
//         // instance.displayUpdatedData_grandTotal(data);
//       // });
//       return fetch(getUrl('committees', q), fetchInit);
//   })
//   .then(response => response.json())
//   .then(data => {
//     let results = data.results;

//     if (!fetchedResults) fetchedResults = [];
//     if (results.length > 0) fetchedResults.push({ is_header: true, id: window.queryText, name: 'Select a committee:', type: 'none' });

//     results.forEach(element => {
//       element.type = 'committee';
//     });
//     fetchedResults.push(...results.slice(0, 10));
//   })
//   .then(data => {
//     fetchedResults.push({ is_suggestion: true, id: window.queryText, name: 'Search individual contributions from:', type: 'individual' });
//     fetchedResults.push({ is_suggestion: true, id: window.queryText, name: 'Search other pages:', type: 'site' });
//     // suggestion for individual contribs
//   });
//   return fetchedResults;
// ]

async function fetchCommittees(q) {
  return fetch(getUrl('committees', q), fetchInit);
}

// ROBERT: Trying to queue up the fetches, handle the responses, edit the items, then do the other fetch and handle its responses, too.
// Currently stuck saving data from one query to the next
// Like:
// main results, fetch, add to main results, next fetch, add to main results

// Option: nesting fetches so we do one fetch if we need to,
//   if we have results, yay, maybe do the next fetch
//   else do the next fetch anyway

//   Like:
//     should we get candidates?
//       yes: do it, handle results
//       no: should we get committees?
//         yes: do it, handle results
//         no: anything else? Legal searches?

// function handleResponse(response) {
//   console.log('handleResponse(): ', response);
//   // return Promise.resolve(response => response.json());
//   return response.json();
// }

function handleResults(type, data) {
  console.log('handleResults(): ', type, data);
  let toReturn = [];
  let results = data.results;
  let resultsLimit = 5;

  if (type == 'candidates' && results.length > 0)
    toReturn.push({ is_header: true, id: window.queryText, name: 'Select a candidate:', type: 'none' });

  else if (type == 'committees' && results.length > 0)
    toReturn.push({ is_header: true, id: window.queryText, name: 'Select a committee:', type: 'none' });

  results.forEach(element => {
    element.type = type;
  });

  toReturn.push(...results.slice(0, resultsLimit));

  return toReturn;
}
function getSuggestions(type) {
  console.log('getSuggestions(type): ', type);
  let toReturn = [];
  if (type == 'all') {
    toReturn.push({ is_suggestion: true, id: window.queryText, name: 'Search individual contributions from:', type: 'individual' });
    toReturn.push({ is_suggestion: true, id: window.queryText, name: 'Search other pages:', type: 'site' });
  }
  return toReturn;
}

async function getData(q, qType) {
    console.log('get_datas()', q, qType);
    // return var1 => {
    let fetchedResults = [];
    // fetchedResults.push({ is_header: true, id: window.queryText, name: 'TESTING', type: 'none' });
    window.queryText = q;
    // fetchedResults = await getData(q);
    if (qType == 'all') {
      console.log('would have got all data');
      fetch(getUrl('candidates', q), fetchInit)
        .then(response => response.json())
        .then(data => {
          fetchedResults.push(handleResults('candidates', data));
          return fetch(getUrl('committees', q), fetchInit);
        })
        .then(response => response.json())
        .then(data => {
          fetchedResults.push(handleResults('committees', data));
        })
        .then(() => {
          fetchedResults.push(getSuggestions(qType));
          // return fetchedResults;
        });
    }

    if (fetchedResults.length === 0) {
      fetchedResults.push({ is_suggestion: true, id: window.queryText, name: 'No results found:', type: 'none' });
    }
    return fetchedResults;
    Promise.resolve();
  };
  // };
  // let promises = [fetchCandidates, handleResponse, handleCandidatesResponses];
  // fetchedResults = promises.reduce((prev, curr) => {
  //     return prev.then(curr);
  //   },
  //   Promise.resolve(q)
  //   )
  //   .then(result => {
  //     console.log("result!: ", result);
  //     return [{ is_header: true, id: window.queryText, name: 'Select a candidate:', type: 'none' }];
  //   });
  // await fetch(getUrl('candidates', q), fetchInit)
  //   .then(response => response.json())
  //   .then(data => {
  //     let results = data.results;

  //     if (results.length > 0) fetchedResults.push({ is_header: true, id: window.queryText, name: 'Select a candidate:', type: 'none' });
  //     // console.log('data.results.length: ', data.results.length);
  //     // if (data.results.length > 0) console.log('  first data.results: ', data.results[0]);
  //     results.forEach(element => {
  //       element.type = 'candidate';
  //     });
  //     fetchedResults.push(...results.slice(0, 5));
  //   });
  
  // return [{ is_header: true, id: window.queryText, name: 'Select a candidate:', type: 'none' }];
}

/**
 *
 */
let siteSearchOpts = {
  selector: () => {
    '.js-site-search';
  },
  data: {
    src: async q => {
      // console.log('siteSearchOpts.data.src this: ', this);
      // let fetchedResults = [];
      // window.queryText = q;
      // fetchedResults = await getData(q);
      // fetch(getUrl('candidates', q), fetchInit)
      //   .then(response => response.json())
      //   .then(data => {
      //     let results = data.results;

      //     if (results.length > 0) fetchedResults.push({ is_header: true, id: window.queryText, name: 'Select a candidate:', type: 'none' });
      //     // console.log('data.results.length: ', data.results.length);
      //     // if (data.results.length > 0) console.log('  first data.results: ', data.results[0]);
      //     results.forEach(element => {
      //       element.type = 'candidate';
      //     });
      //     fetchedResults.push(...results.slice(0, 5));
      //     // if (response.status !== 200) throw new Error('The network rejected the grand total request.');
      //     // else if (response.type == 'cors') throw new Error('CORS error');
      //     // response.json().then(data => {
      //       // instance.displayUpdatedData_grandTotal(data);
      //     // });
      //     return fetch(getUrl('committees', q), fetchInit);
      // })
      // .then(response => response.json())
      // .then(data => {
      //   let results = data.results;

      //   if (!fetchedResults) fetchedResults = [];
      //   if (results.length > 0) fetchedResults.push({ is_header: true, id: window.queryText, name: 'Select a committee:', type: 'none' });

      //   results.forEach(element => {
      //     element.type = 'committee';
      //   });
      //   fetchedResults.push(...results.slice(0, 10));
      // })
      // .then(data => {
      //   fetchedResults.push({ is_suggestion: true, id: window.queryText, name: 'Search individual contributions from:', type: 'individual' });
      //   fetchedResults.push({ is_suggestion: true, id: window.queryText, name: 'Search other pages:', type: 'site' });
      //   // suggestion for individual contribs
      // });
      // return fetchedResults;
    },
    keys: searchedAttribs(),
  },
  resultsList: resultsListOptions,
  resultItem: resultItemOptions
};

// const engineOpts = {
//   datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
//   queryTokenizer: Bloodhound.tokenizers.whitespace,
//   limit: 10
// };

// function createEngine(opts) {
//   return new Bloodhound(Object.assign({}, engineOpts, opts));
// }

// const candidateEngine = createEngine({
//   remote: {
//     url: getUrl('candidates'),
//     wildcard: '%QUERY',
//     transform: function(response) {
//       console.log('committeeEngine transform');
//       let toReturn = _.map(response.results, formatCandidate);
//       // return _.map(response.results, formatCommittee);
//       let toReturn2 = response['results'].map(n => formatCandidate(n));
//       console.log('  toReturn: ', toReturn);
//       console.log('  toReturn2: ', toReturn2);
//     }
//   }
// });

// const committeeEngine = createEngine({
//   remote: {
//     url: getUrl('committees'),
//     wildcard: '%QUERY',
//     transform: function(response) {
//       console.log('committeeEngine');
//       let toReturn = _.map(response.results, formatCommittee);
//       // return _.map(response.results, formatCommittee);
//       let toReturn2 = response['results'].map(n => formatCommittee(n));
//       console.log('  toReturn: ', toReturn);
//       console.log('  toReturn2: ', toReturn2);
//       return toReturn;
//     }
//   }
// });

// const auditCommitteeEngine = createEngine({
//   remote: {
//     url: getUrl('audit_committees'),
//     wildcard: '%QUERY',
//     transform: function(response) {
//       console.log('auditCommitteeEngine');
//       let toReturn = _.map(response.results, formatAuditCommittee);
//       // return _.map(response.results, formatCommittee);
//       let toReturn2 = response['results'].map(n => formatAuditCommittee(n));
//       console.log('  toReturn: ', toReturn);
//       console.log('  toReturn2: ', toReturn2);
//     }
//   }
// });

// const auditCandidateEngine = createEngine({
//   remote: {
//     url: getUrl('audit_candidates'),
//     wildcard: '%QUERY',
//     transform: function(response) {
//       console.log('auditCandidateEngine');
//       let toReturn = _.map(response.results, formatAuditCandidate);
//       // return _.map(response.results, formatCommittee);
//       let toReturn2 = response['results'].map(n => formatAuditCandidate(n));
//       console.log('  toReturn: ', toReturn);
//       console.log('  toReturn2: ', toReturn2);
//     }
//   }
// });

// const candidateDataset = {
//   name: 'candidate',
//   display: 'name',
//   limit: 5,
//   source: candidateEngine,
//   templates: {
//     header: '<span class="as-suggestion__header">Select a candidate:</span>',
//     pending:
//       '<span class="as-suggestion__loading">Loading candidates&hellip;</span>',
//     notFound: Handlebars.compile(''), // This has to be empty to not show anything
//     suggestion: Handlebars.compile(
//       '<span>' +
//         '<span class="as-suggestion__name">{{ name }} ({{ id }})</span>' +
//         '<span class="as-suggestion__office">{{ office }}</span>' +
//         '</span>'
//     )
//   }
// };

// const committeeDataset = {
//   name: 'committee',
//   display: 'name',
//   limit: 10,
//   source: committeeEngine,
//   templates: {
//     header: '<span class="as-suggestion__header">Select a committee:</span>',
//     pending:
//       '<span class="as-suggestion__loading">Loading committees&hellip;</span>',
//     notFound: Handlebars.compile(''), // This has to be empty to not show anything
//     suggestion: Handlebars.compile(
//       '<span class="as-suggestion__name">{{ name }} ({{ id }})&nbsp;' +
//         '<span class="{{#if is_active}}is-active-status' +
//         '{{else}}is-terminated-status{{/if}}"></span></span>'
//     )
//   }
// };

// const auditCommitteeDataset = {
//   name: 'auditCommittees',
//   display: 'name',
//   limit: 10,
//   source: auditCommitteeEngine,
//   templates: {
//     header: '<span class="as-suggestion__header">Select a committee:</span>',
//     pending:
//       '<span class="as-suggestion__loading">Loading committees&hellip;</span>',
//     notFound: Handlebars.compile(''), // This has to be empty to not show anything
//     suggestion: Handlebars.compile(
//       '<span class="as-suggestion__name">{{ name }} ({{ id }})</span>'
//     )
//   }
// };

// const auditCandidateDataset = {
//   name: 'auditCandidates',
//   display: 'name',
//   limit: 10,
//   source: auditCandidateEngine,
//   templates: {
//     header: '<span class="as-suggestion__header">Select a candidate:</span>',
//     pending:
//       '<span class="as-suggestion__loading">Loading candidates&hellip;</span>',
//     notFound: Handlebars.compile(''), // This has to be empty to not show anything
//     suggestion: Handlebars.compile(
//       '<span class="as-suggestion__name">{{ name }} ({{ id }})</span>'
//     )
//   }
// };

/* This is a fake dataset for showing an empty option with the query
 * when clicked, this will load the receipts page,
 * filtered to contributions from this person
 */
// var individualDataset = {
//   display: 'id',
//   source: function(query, syncResults) {
//     syncResults([
//       {
//         id: sanitizeValue(query),
//         type: 'individual'
//       }
//     ]);
//   },
//   templates: {
//     suggestion: function(datum) {
//       return (
//         '<span><strong>Search individual contributions from:</strong> "' +
//         datum.id +
//         '"</span>'
//       );
//     }
//   }
// };

/** This is a fake dataset for showing an empty option with the query
 * when clicked, this will submit the form to the DigitalGov search site
 */
// var siteDataset = {
//   display: 'id',
//   source: function(query, syncResults) {
//     syncResults([
//       {
//         id: sanitizeValue(query),
//         type: 'site'
//       }
//     ]);
//   },
//   templates: {
//     suggestion: function(datum) {
//       return (
//         '<span><strong>Search other pages:</strong> "' + datum.id + '"</span>'
//       );
//     }
//   }
// };

// var datasets = {
//   candidates: candidateDataset,
//   committees: committeeDataset,
//   auditCandidates: auditCandidateDataset,
//   auditCommittees: auditCommitteeDataset,
//   allData: [candidateDataset, committeeDataset],
//   all: [candidateDataset, committeeDataset, individualDataset, siteDataset]
// };

/**
 * @param {string|HTMLInputElement} elementSelector
 * @param {string} type
 * @param {string} url
 *
 * @property {HTMLElement|string} elementSelector
 * @property {autoComplete} autocomplete
 * @property {number} formerSelectionIndex an integer used for tracking hover/selected states with arrows, especially for ⬆︎/⬇︎ onto a non-selectable element
 * @property {HTMLInputElement} input the <input> for this instance of AutoSuggest
 * @property {HTMLElement} element the element created to wrap the <input> and the results
 * @property {HTMLElement} resultsHolder
 * @property {string} queryType
 * @property {string} url
 */
function AutoSuggest(elementSelector, type, url) {
  // if elementSelector is a string, use that string to find the dom element and set that to this.input
  // else if elementSelector is an element, just save it
  this.input = typeof elementSelector == 'string' ? document.querySelector(elementSelector) : elementSelector;
  this.queryType = type;
  this.url = url || '/';
  this.autoComplete = null;
  this.formerSelectionIndex;

//   this.dataset = datasets[type];

  this.init();
}

/**
 * @prop
 */
 AutoSuggest.prototype.init = function() {
  console.log('AutoSuggest.init()');
  // TODO: do we need to destroy/reset one if it already exists?
  // if (this.typeahead) this.input.typeahead('destroy');
  this.input.value = '';

  let theseOpts = siteSearchOpts;


  // Create a new span to wrap the input,
  // add the span to the page before the input
  // and move the input into it
  this.element = document.createElement('span');
  this.element.setAttribute('class', 'autosuggest');
  this.element.setAttribute('aria-expanded', 'false');
  // this.element.setAttribute('aria-expanded', 'false');
  this.element.innerHTML = `<span role="status" aria-live="polite"></span><pre aria-hidden="true"></pre>`;
  // Create an element to hold the results
  this.resultsHolder = document.createElement('div');
  this.resultsHolder.setAttribute('role', 'listbox');
  this.resultsHolder.setAttribute('class', 'as-menu');
  this.resultsHolder.setAttribute('aria-live', 'polite');
  // this.resultsHolder.setAttribute('aria-expanded', 'false');
  this.resultsHolder.innerHTML = '<span />';
  this.element.appendChild(this.resultsHolder);

  this.input.parentNode.insertBefore(this.element, this.input);
  this.element.prepend(this.input);

  // Now to set the options for creating the autocomplete
  // The selector gets tricky if we're only using classes when there are multiple fields on the page (like /search)
  // so we'll use the input field's ID since they're unique
  theseOpts.selector = `#${this.input.getAttribute('id')}`;
  theseOpts.resultsList.destination = () => {
    // return `#${this.input.getAttribute('aria-controls')} span`;
    return this.element.querySelector('.as-menu span');
  };
  // theseOpts.data['keys'] = searchedAttribs();
  theseOpts.data.src = q => {
    return getData(q, this.queryType);
  };

  this.autocomplete = new autoComplete(theseOpts);

  let theMenus = this.element.querySelectorAll('.as-menu');
  theMenus.forEach(el => {
    el.setAttribute('aria-live', 'polite');
  });

  let theInputs = this.element.querySelectorAll('.as-input');
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
 AutoSuggest.prototype.off = function(eventName) {
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
 * @param {Event} e
 */
AutoSuggest.prototype.handleFocus = function(e) {
  // Only opens if the resultsList is not empty
  this.autocomplete.open();
};

/**
 *
 * @param {Object} e
 * @param {Object} e.detail carries the autoComplete.js "feedback" object
 */
AutoSuggest.prototype.handleOpen = function(e) {
  this.matchAriaExpandeds();
};

/**
 * Fires after "resultsList" is closed
 * @param {Object} e
 * @param {Object} e.detail carries the autoComplete.js "feedback" object
 */
AutoSuggest.prototype.handleClose = function(e) {
  this.matchAriaExpandeds();
};

/**
 * Called to copy the aria-expanded state from the autocomplete element up to the <input>'s wrapper for css selectors
 */
AutoSuggest.prototype.matchAriaExpandeds = function() {
  let theACwrapper = this.element.querySelector('.autoComplete_wrapper');

  this.element.setAttribute(
    'aria-expanded',
    theACwrapper.getAttribute('aria-expanded')
  );
};

/**
 * 
 * @param {Object} e
 * @param {Object} e.detail carries the matching results values
 */
AutoSuggest.prototype.handleResults = function(e) {
  // Reset the 'last selected' marker for arrow/keyboard navigation
  this.formerSelectionIndex = 0;
};

/**
 * Handles when a results item is clicked, tapped, or selected with the keyboard
 * @param {Object} e
 * @param {Object} e.detail carries the autoComplete.js "feedback" object
 * @returns {null} if (e.detail.selection.value.is_header)
 */
AutoSuggest.prototype.handleSelect = function(e) {
  let val = e.detail.selection.value;

  // If it's a header, ignore the selection/click/tap
  if (val.is_header) return;

  // Find the element
  if (val.type == 'individual') {
    window.location = `${this.url}receipts/individual-contributions/?contributor_name=${val.id}`;

  } else if (val.type == 'candidate' || val.type == 'committee') {
    window.location = `${this.url}${val.type}/${val.id}`;

  } else if (val.type == 'site') {
    this.searchSite(e.detail.selection.match);
  }
};

/**
 * Mostly called after keyboard navigation, this function checks if the user would now be on a header (nonselectable) element
 * and then moves them upward, downward, or to the other end of the results list based on which direction they want to go
 * and which item was 'hovered' last (based on this.formerSelectionIndex)
 * @param {Object} e
 * @param {Object} e.detail carries the autoComplete.js "feedback" object
 */
AutoSuggest.prototype.handleNavigate = function(e) {
  // If we've just focused on a header object, we want to nav off of it
  if (e.detail.selection.value.is_header === true) {
    // If we were previously higher on the list, let's go to the next
    if (this.formerSelectionIndex <= e.detail.selection.index) this.autocomplete.next();
    // If we were previously lower on the list, let's jump up another
    else this.autocomplete.previous();

    // Save the former selection for next time
    this.formerSelectionIndex = e.detail.selection.index;

  } else if (this.formerSelectionIndex == e.detail.selection.index && this.formerSelectionIndex >= e.detail.results.length - 1) {
    this.formerSelectionIndex = -1;
    this.autocomplete.goTo(0);

  } else {
    this.formerSelectionIndex = e.detail.selection.index;
    this.input.value = e.detail.selection.match;
  }
};

/**
 * Called by @see handleSelect 
 * @param {Object} q
 * q is the same as e.detail.selection.match from @see AutoSuggest.prototype.handleSelect
 */
AutoSuggest.prototype.searchSite = function(q) {
  /** If the site search option is selected, this function handles submitting
   * a new search on /search
   */
  let form = this.input.closest('form');
  let action = form.getAttribute('action');
  this.input.value = q;
  form.setAttribute('action', action);
  form.submit();
};


/**
 *
 */
 let fetchInit = {
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
  AutoSuggest: AutoSuggest
};
