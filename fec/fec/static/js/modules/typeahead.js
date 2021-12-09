'use strict';

/**
 * @fileoverview Creates the Typeahead element, extending node_modules/typeahead.js/dist/typeahead.jquery.js
 */

var $ = require('jquery');
// var URI = require('urijs');
var _ = require('underscore');
let Handlebars = require('handlebars');
import { sanitizeValue } from './helpers';

// Hack: Append jQuery to `window` for use by typeahead.js
window.$ = window.jQuery = $;

// require('corejs-typeahead/dist/typeahead.jquery');
var Bloodhound = require('corejs-typeahead/dist/bloodhound');

import autoComplete from '@tarekraafat/autocomplete.js';
import events from './events';

// var events = require('./events');

const officeMap = {
  H: 'House',
  S: 'Senate',
  P: 'President'
};

function formatCandidate(result) {
  console.log('formatCandidate(result): ', result);
  return {
    name: result.name,
    id: result.id,
    type: 'candidate',
    office: officeMap[result.office_sought]
  };
}

function formatCommittee(result) {
  console.log('formatCommittee(result): ', result);
  return {
    name: result.name,
    id: result.id,
    is_active: result.is_active,
    type: 'committee'
  };
}

function formatAuditCommittee(result) {
  console.log('formatAuditCommittee(result): ', result);
  return {
    name: result.name,
    id: result.id,
    type: 'auditCommittee'
  };
}

function formatAuditCandidate(result) {
  console.log('formatAuditCandidate(result): ', result);
  return {
    name: result.name,
    id: result.id,
    type: 'auditCandidate'
  };
}

function getUrl(resource) {
  console.log('getURL(resource): ', resource);

  let toReturn = [
    window.API_LOCATION,
    window.API_VERSION,
    'names',
    resource,
    ''
  ].join('/');
  toReturn += `?q=%QUERY&api_key=${window.API_KEY_PUBLIC}`;
  return toReturn;
}

const engineOpts = {
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  limit: 10
};

function createEngine(opts) {
  return new Bloodhound(Object.assign({}, engineOpts, opts));
}

const candidateEngine = createEngine({
  remote: {
    url: getUrl('candidates'),
    wildcard: '%QUERY',
    transform: function(response) {
      console.log('committeeEngine transform');
      let toReturn = _.map(response.results, formatCandidate);
      // return _.map(response.results, formatCommittee);
      let toReturn2 = response['results'].map(n => formatCandidate(n));
      console.log('  toReturn: ', toReturn);
      console.log('  toReturn2: ', toReturn2);
    }
  }
});

const committeeEngine = createEngine({
  remote: {
    url: getUrl('committees'),
    wildcard: '%QUERY',
    transform: function(response) {
      console.log('committeeEngine');
      let toReturn = _.map(response.results, formatCommittee);
      // return _.map(response.results, formatCommittee);
      let toReturn2 = response['results'].map(n => formatCommittee(n));
      console.log('  toReturn: ', toReturn);
      console.log('  toReturn2: ', toReturn2);
      return toReturn;
    }
  }
});

const auditCommitteeEngine = createEngine({
  remote: {
    url: getUrl('audit_committees'),
    wildcard: '%QUERY',
    transform: function(response) {
      console.log('auditCommitteeEngine');
      let toReturn = _.map(response.results, formatAuditCommittee);
      // return _.map(response.results, formatCommittee);
      let toReturn2 = response['results'].map(n => formatAuditCommittee(n));
      console.log('  toReturn: ', toReturn);
      console.log('  toReturn2: ', toReturn2);
    }
  }
});

const auditCandidateEngine = createEngine({
  remote: {
    url: getUrl('audit_candidates'),
    wildcard: '%QUERY',
    transform: function(response) {
      console.log('auditCandidateEngine');
      let toReturn = _.map(response.results, formatAuditCandidate);
      // return _.map(response.results, formatCommittee);
      let toReturn2 = response['results'].map(n => formatAuditCandidate(n));
      console.log('  toReturn: ', toReturn);
      console.log('  toReturn2: ', toReturn2);
    }
  }
});

const candidateDataset = {
  name: 'candidate',
  display: 'name',
  limit: 5,
  source: candidateEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a candidate:</span>',
    pending:
      '<span class="tt-suggestion__loading">Loading candidates&hellip;</span>',
    notFound: Handlebars.compile(''), // This has to be empty to not show anything
    suggestion: Handlebars.compile(
      '<span>' +
        '<span class="tt-suggestion__name">{{ name }} ({{ id }})</span>' +
        '<span class="tt-suggestion__office">{{ office }}</span>' +
        '</span>'
    )
  }
};

const committeeDataset = {
  name: 'committee',
  display: 'name',
  limit: 10,
  source: committeeEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a committee:</span>',
    pending:
      '<span class="tt-suggestion__loading">Loading committees&hellip;</span>',
    notFound: Handlebars.compile(''), // This has to be empty to not show anything
    suggestion: Handlebars.compile(
      '<span class="tt-suggestion__name">{{ name }} ({{ id }})&nbsp;' +
        '<span class="{{#if is_active}}is-active-status' +
        '{{else}}is-terminated-status{{/if}}"></span></span>'
    )
  }
};

const auditCommitteeDataset = {
  name: 'auditCommittees',
  display: 'name',
  limit: 10,
  source: auditCommitteeEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a committee:</span>',
    pending:
      '<span class="tt-suggestion__loading">Loading committees&hellip;</span>',
    notFound: Handlebars.compile(''), // This has to be empty to not show anything
    suggestion: Handlebars.compile(
      '<span class="tt-suggestion__name">{{ name }} ({{ id }})</span>'
    )
  }
};

const auditCandidateDataset = {
  name: 'auditCandidates',
  display: 'name',
  limit: 10,
  source: auditCandidateEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a candidate:</span>',
    pending:
      '<span class="tt-suggestion__loading">Loading candidates&hellip;</span>',
    notFound: Handlebars.compile(''), // This has to be empty to not show anything
    suggestion: Handlebars.compile(
      '<span class="tt-suggestion__name">{{ name }} ({{ id }})</span>'
    )
  }
};

/* This is a fake dataset for showing an empty option with the query
 * when clicked, this will load the receipts page,
 * filtered to contributions from this person
 */
var individualDataset = {
  display: 'id',
  source: function(query, syncResults) {
    syncResults([
      {
        id: sanitizeValue(query),
        type: 'individual'
      }
    ]);
  },
  templates: {
    suggestion: function(datum) {
      return (
        '<span><strong>Search individual contributions from:</strong> "' +
        datum.id +
        '"</span>'
      );
    }
  }
};

/** This is a fake dataset for showing an empty option with the query
 * when clicked, this will submit the form to the DigitalGov search site
 */
var siteDataset = {
  display: 'id',
  source: function(query, syncResults) {
    syncResults([
      {
        id: sanitizeValue(query),
        type: 'site'
      }
    ]);
  },
  templates: {
    suggestion: function(datum) {
      return (
        '<span><strong>Search other pages:</strong> "' + datum.id + '"</span>'
      );
    }
  }
};

var datasets = {
  candidates: candidateDataset,
  committees: committeeDataset,
  auditCandidates: auditCandidateDataset,
  auditCommittees: auditCommitteeDataset,
  allData: [candidateDataset, committeeDataset],
  all: [candidateDataset, committeeDataset, individualDataset, siteDataset]
};

var typeaheadOpts = {
  minLength: 3, // minimum characters before a search will happen
  highlight: true,
  hint: false
};

let autoCompleteOpts = window.tempOpts;
/*{
  selector: '.js-site-search',
  // placeHolder: 'The opts worked!',
  data: {
    src: async q => {
      // console.log('src! q: ', q);
      let toReturn;
      toReturn = [
        { food: 'Sauce - Thousand Island', cities: 'Soanindrariny', animals: 'Common boubou shrike' },
        { food: 'Wild Boar - Tenderloin', cities: 'Luthu', animals: 'Eastern diamondback rattlesnake' },
        { food: 'Goat - Whole Cut', cities: 'Kargowa', animals: 'Sheep, red' }
      ];
      console.log('typeof toReturn: ', typeof toReturn);
      return toReturn;
      // src: [{ name: 'OBAMA, BARACK \/ JOSEPH R. BIDEN', office_sought: 'P', id: 'P80003338' }, { name: 'BIDEN, JOSEPH R JR', office_sought: 'P', id: 'P80000722' }, { name: 'BIDEN, JOSEPH R JR', office_sought: 'S', id: 'S8DE00012' }, { name: 'BIDEN, JOE R', office_sought: 'P', id: 'P60012143' }, { name: 'BIDEN, JOSEPH ROBINETTEE', office_sought: 'P', id: 'P60012135' }, { name: 'BIDEN, JR., JOSEPH R.', office_sought: 'P', id: 'P60012465' }],
      // keys: ['name', 'id'],
    },
    keys: ['food', 'cities', 'animals']
    },
    resultsList: {
      tag: 'div',
      id: '',
    }
};*/

/**
 * @class
 * @param {String} selector - A string to be used to find the element in the page.
 * @param {String} type - The kinda of data we'll be showing. e.g., 'candidates'.
 * @param {URL} url - Optional. Where we should find the data if not the default.
 *
 * @event typeahead:select Triggered when a user clicks an autocomplete search result
 * @property {jQuery.Event}
 * @property {Object} - The data from the selected item
 *
 * @event typeahead:render Inherited from typeahead.jquery.js, called any time the pulldown menu changes. Typing a character calls the event when the menu is reset _and_ when it's drawn again
 * @property {jQuery.Event}
 * @property {Object} - null if no results. Otherwise we get back an {Object} for each item in the menu
 */
function Typeahead(selector, type, url) {
  // this.$input = $(selector);
  // this.url = url || '/';
  // this.typeahead = null;
  // this.dataset = datasets[type];
  // this.init();
  // events.on('searchTypeChanged', this.handleChangeEvent.bind(this));
  // this.$input.on('keyup', this.setAria.bind(this));
}
function AutoComplete(element, type, url) {
  console.log('new AutoComplete!');

  this.$input = element;
  this.url = url || '/';
  this.autoComplete = null;
  this.formerSelectionIndex;

  this.dataset = datasets[type];

  this.init();

  events.on('searchTypeChanged', this.handleChangeEvent.bind(this));

  this.$input.addEventListener('keyup', this.setAria.bind(this));
  this.$input.addEventListener('focus', this.handleFocus.bind(this));
}

Typeahead.prototype.init = function() {
  // if (this.typeahead) {
  //   this.$input.typeahead('destroy');
  // }
  // this.typeahead = this.$input.typeahead(typeaheadOpts, this.dataset);
  // this.$element = this.$input.parent('.twitter-typeahead');
  // this.$element.css('display', 'block');
  // this.$element.find('.tt-menu').attr('aria-live', 'polite');
  // this.$element.find('.tt-input').removeAttr('aria-readonly');
  // this.$element.find('.tt-input').attr('aria-expanded', 'false');
  // this.$input.on('typeahead:select', this.select.bind(this));
};

AutoComplete.prototype.init = function() {
  console.log('AutoComplete.init()');
  // TODO: do we need to destroy/reset one if it already exists?
  // if (this.autoComplete) this.$input.typeahead('destroy');
  this.$input.value = '';

  let theseOpts = autoCompleteOpts;
  theseOpts.data = Object.assign(theseOpts.data, theseOpts );

  // Create a new span to wrap the input,
  // add the span to the page before the input
  // and move the input into it
  this.$element = document.createElement('span');
  this.$element.setAttribute('class', 'twitter-typeahead');
  this.$element.setAttribute('style', 'position: relative; display: block');
  this.$element.innerHTML = `\
    <span\
      role="status"\
      aria-live="polite"\
      style="position: absolute; padding: 0px; border: 0px; height: 1px; width: 1px; margin-bottom: -1px; margin-right: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap;">\
    </span>\
    <pre\
      aria-hidden="true"\
      style="position: absolute; visibility: hidden; white-space: pre; font-family: karla, sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: 400; word-spacing: 0px; letter-spacing: 0px; text-indent: 0px; text-rendering: auto; text-transform: none;">\
    </pre>\
    </div>`;
  // Create an element to hold the results
  this.resultsHolder = document.createElement('div');
  this.resultsHolder.setAttribute('role', 'listbox');
  this.resultsHolder.setAttribute('class', 'tt-menu');
  this.resultsHolder.setAttribute('aria-live', 'polite');
  this.resultsHolder.setAttribute('style', 'position: absolute; top: 100%; left: 0px; z-index: 100;');
  this.resultsHolder.setAttribute('aria-expanded', 'false');
  this.resultsHolder.innerHTML = '<span />';
  this.$element.appendChild(this.resultsHolder);

  this.$input.parentNode.insertBefore(this.$element, this.$input);
  this.$element.prepend(this.$input);

  this.autoComplete = new autoComplete(autoCompleteOpts);

  let theMenus = this.$element.querySelectorAll('.tt-menu');
  theMenus.forEach(el => {
    el.setAttribute('aria-live', 'polite');
  });

  let theInputs = this.$element.querySelectorAll('.tt-input');
  theInputs.forEach(el => {
    el.setAttribute('aria-expanded', 'false').removeAttribute('aria-readonly');
  });

  this.$input.addEventListener('results', this.handleResults.bind(this));
  this.$input.addEventListener('selection', this.handleSelect.bind(this));
  this.$input.addEventListener('navigate', this.handleNavigate.bind(this));
};

AutoComplete.prototype.handleFocus = function(e) {
  // Only opens if the resultsList is not empty
  this.autoComplete.open();
};

Typeahead.prototype.handleChangeEvent = function(data) {
  // this.init(data.type);
};

AutoComplete.prototype.handleChangeEvent = function(data) {
  console.log('AutoComplete.handleChangeEvent');
  this.init(data.type);
};

Typeahead.prototype.setAria = function() {
  // if (this.$element.find('.tt-menu').attr('aria-expanded') == 'false') {
  //   this.$element.find('.tt-input').attr('aria-expanded', 'false');
  // } else {
  //   this.$element.find('.tt-input').attr('aria-expanded', 'true');
  // }
  //alert('closed')
};

AutoComplete.prototype.setAria = function() {
  console.log('AutoComplete.setAria()');

  let thisMenu = this.$input.querySelector('.tt-menu[aria-expanded]');
  let thisInput = this.$input.querySelector('.tt-input');
  console.log('  thisMenu: ', thisMenu);
  console.log('  thisInput: ', thisInput);
  console.log('  this.$input: ', this.$input);
  console.log('  !!thisMenu: ', !!thisMenu);
  if (thisInput && thisMenu)
    thisInput.setAttribute('aria-expanded', !!thisMenu);
};

AutoComplete.prototype.handleResults = function(e) {
  console.log('handleResults()');
  // Reset the 'last selected' marker for arrow/keyboard navigation
  this.formerSelectionIndex = 0;
};

AutoComplete.prototype.handleSelect = function(e) {
  console.log('handleSelect(e): ', e);
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

  // if (theURL) window.location = theURL;
};

AutoComplete.prototype.handleNavigate = function(e) {
  console.log('handleNavigate(e): ', e);
  // If we've just focused on a header object, we want to nav off of it
  if (e.detail.selection.value.is_header === true) {
    // If we were previously higher on the list, let's go to the next
    if (this.formerSelectionIndex <= e.detail.selection.index) this.autoComplete.next();
    // If we were previously lower on the list, let's jump up another
    else this.autoComplete.previous();

    // Save the former selection for next time
    this.formerSelectionIndex = e.detail.selection.index;

  } else if (this.formerSelectionIndex == e.detail.selection.index && this.formerSelectionIndex >= e.detail.results.length - 1) {
    this.formerSelectionIndex = -1;
    this.autoComplete.goTo(0);

  } else {
    this.formerSelectionIndex = e.detail.selection.index;
    this.$input.value = e.detail.selection.match;
  }
};

Typeahead.prototype.searchSite = function(query) {
  /** If the site search option is selected, this function handles submitting
   * a new search on /search
   */

  // var $form = this.$input.closest('form');
  // var action = $form.attr('action');
  // this.$input.val(query);
  // $form.attr('action', action);
  // $form.submit();
};

AutoComplete.prototype.searchSite = function(q) {
  console.log('searchSite(q): ', q);
  /** If the site search option is selected, this function handles submitting
   * a new search on /search
   */
  let form = this.$input.closest('form');
  let action = form.getAttribute('action');
  this.$input.value = q;
  form.setAttribute('action', action);
  form.submit();
};

module.exports = {
  AutoComplete: AutoComplete,
  Typeahead: Typeahead,
  datasets: datasets
};
