/**
 * @fileoverview Creates the Typeahead element, extending node_modules/typeahead.js/dist/typeahead.jquery.js
 */

// import 'corejs-typeahead/src/typeahead/typeahead.js';
import 'corejs-typeahead/dist/typeahead.jquery.js';
import { default as Bloodhound } from 'corejs-typeahead/dist/bloodhound.js';
import { compile as compileHBS } from 'handlebars';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as _map } from 'underscore/modules/map.js';
import { default as URI } from 'urijs';

import initEvents from './events.js';
import { sanitizeValue } from './helpers.js';

// Hack: Append jQuery to `window` for use by typeahead.js
// window.$ = window.jQuery = $;

const events = initEvents();

const officeMap = {
  H: 'House',
  S: 'Senate',
  P: 'President'
};

function formatCandidate(result) {
  return {
    name: result.name,
    id: result.id,
    type: 'candidate',
    office: officeMap[result.office_sought]
  };
}

function formatCommittee(result) {
  return {
    name: result.name,
    id: result.id,
    is_active: result.is_active,
    type: 'committee'
  };
}

function formatAuditCommittee(result) {
  return {
    name: result.name,
    id: result.id,
    type: 'auditCommittee'
  };
}

function formatAuditCandidate(result) {
  return {
    name: result.name,
    id: result.id,
    type: 'auditCandidate'
  };
}

function getUrl(resource) {
  return URI(window.API_LOCATION)
    .path([window.API_VERSION, 'names', resource, ''].join('/'))
    .query({
      q: '%QUERY',
      api_key: window.API_KEY_PUBLIC
    })
    .readable();
}

const engineOpts = {
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  limit: 10
};

function createEngine(opts) {
  return new Bloodhound(_extend({}, engineOpts, opts));
}

const candidateEngine = createEngine({
  remote: {
    url: getUrl('candidates'),
    wildcard: '%QUERY',
    transform: function(response) {
      return _map(response.results, formatCandidate);
    }
  }
});

const committeeEngine = createEngine({
  remote: {
    url: getUrl('committees'),
    wildcard: '%QUERY',
    transform: function(response) {
      return _map(response.results, formatCommittee);
    }
  }
});

const auditCommitteeEngine = createEngine({
  remote: {
    url: getUrl('audit_committees'),
    wildcard: '%QUERY',
    transform: function(response) {
      return _map(response.results, formatAuditCommittee);
    }
  }
});

const auditCandidateEngine = createEngine({
  remote: {
    url: getUrl('audit_candidates'),
    wildcard: '%QUERY',
    transform: function(response) {
      return _map(response.results, formatAuditCandidate);
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
    notFound: compileHBS(''), // This has to be empty to not show anything
    suggestion: compileHBS(
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
    notFound: compileHBS(''), // This has to be empty to not show anything
    suggestion: compileHBS(
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
    notFound: compileHBS(''), // This has to be empty to not show anything
    suggestion: compileHBS(
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
    notFound: compileHBS(''), // This has to be empty to not show anything
    suggestion: compileHBS(
      '<span class="tt-suggestion__name">{{ name }} ({{ id }})</span>'
    )
  }
};

/* This is a fake dataset for showing an empty option with the query
 * when clicked, this will load the receipts page,
 * filtered to contributions from this person
 */
const individualDataset = {
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
        `<span><strong>Search individual contributions from: &ldquo;</strong>${datum.id}<strong>&rdquo;</strong></span>`
      );
    }
  }
};

/* This is a fake dataset for showing an empty option with the query
 * when clicked, this will submit the form to the Search.gov  website
 */
const siteDataset = {
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
        '<span><strong>Search other pages: &ldquo;</strong>' + datum.id + '<strong>&rdquo;</strong></span>'
      );
    }
  }
};

/* When clicked, this will submit the query to the legal search form */
export const legalDataset = {
  display: 'id',
  source: function(query, syncResults) {
    syncResults([
      {
        id: sanitizeValue(query),
        type: 'legal'
      }
    ]);
  },
  templates: {
    suggestion: function(datum) {
      return (
        '<span><strong>Search legal resources: &ldquo;</strong>' + datum.id + '<strong>&rdquo;</strong></span>'
      );
    }
  }
};

export const datasets = {
  candidates: candidateDataset,
  committees: committeeDataset,
  auditCandidates: auditCandidateDataset,
  auditCommittees: auditCommitteeDataset,
  allData: [candidateDataset, committeeDataset],
  all: [candidateDataset, committeeDataset, individualDataset, siteDataset, legalDataset]
};

const typeaheadOpts = {
  minLength: 3, // minimum characters before a search will happen
  highlight: true,
  hint: false
};

/**
 * @class
 * @param {string} selector - A string to be used to find the element in the page.
 * @param {string} type - The kinda of data we'll be showing. e.g., 'candidates'.
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
export default function Typeahead(selector, type, url) {
  this.$input = $(selector);
  this.url = url || '/';
  this.typeahead = null;

  this.dataset = datasets[type];

  this.init();

  events.on('searchTypeChanged', this.handleChangeEvent.bind(this));

  this.$input.on('keyup', this.setAria.bind(this));
}

Typeahead.prototype.init = function() {
  // TODO: THIS IS TO MAKE TESTS NOT FAIL
  // TODO: COME BACK TO THIS
  if (this.$input.typeahead) {
    if (this.typeahead) {
      this.$input.typeahead('destroy');
    }
    this.typeahead = this.$input.typeahead(typeaheadOpts, this.dataset);
  }
  this.$element = this.$input.parent('.twitter-typeahead');
  this.$element.css('display', 'block');
  this.$element.find('.tt-menu').attr('aria-live', 'polite');
  this.$element.find('.tt-input').removeAttr('aria-readonly');
  this.$element.find('.tt-input').attr('aria-expanded', 'false');
  this.$input.on('typeahead:select', this.select.bind(this));
};

Typeahead.prototype.handleChangeEvent = function(data) {
  this.init(data.type);
};

Typeahead.prototype.setAria = function() {
  if (this.$element.find('.tt-menu').attr('aria-expanded') == 'false') {
    this.$element.find('.tt-input').attr('aria-expanded', 'false');
  } else {
    this.$element.find('.tt-input').attr('aria-expanded', 'true');
  }
  //alert('closed')
};

Typeahead.prototype.select = function(event, datum) {
  if (datum.type === 'individual') {
    window.location =
      this.url +
      'receipts/individual-contributions/?contributor_name=' +
      datum.id;
  } else if (datum.type === 'site') {
    this.searchSite(datum.id);
  } else if (datum.type === 'legal') {
    window.location =
      this.url +
      'legal/search/?search_type=all&search=' +
      datum.id;
  } else {
    window.location = this.url + datum.type + '/' + datum.id;
  }
};

Typeahead.prototype.searchSite = function(query) {
  /* If the site search option is selected, this function handles submitting
   * a new search on /search
   */

  const $form = this.$input.closest('form');
  const action = $form.attr('action');
  this.$input.val(query);
  $form.attr('action', action);
  $form.trigger('submit');
};
