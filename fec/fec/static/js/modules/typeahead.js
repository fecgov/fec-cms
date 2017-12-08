'use strict';

var $ = require('jquery');
var URI = require('urijs');
var _ = require('underscore');
var Handlebars = require('handlebars');
var helpers = require('./helpers');

// Hack: Append jQuery to `window` for use by typeahead.js
window.$ = window.jQuery = $;

require('typeahead.js/dist/typeahead.jquery');
var Bloodhound = require('typeahead.js/dist/bloodhound');

var events = require('./events');

var officeMap = {
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
      api_key: window.API_KEY
    })
    .readable();
}

var engineOpts = {
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  limit: 10
};

function createEngine(opts) {
  return new Bloodhound(_.extend({}, engineOpts, opts));
}

var candidateEngine = createEngine({
  remote: {
    url: getUrl('candidates'),
    wildcard: '%QUERY',
    transform: function(response) {
      return _.map(response.results, formatCandidate);
    }
  }
});

var committeeEngine = createEngine({
  remote: {
    url: getUrl('committees'),
    wildcard: '%QUERY',
    transform: function(response) {
      return _.map(response.results, formatCommittee);
    },
  }
});

var auditCommitteeEngine = createEngine({
  remote: {
    url: getUrl('audit_committees'),
    wildcard: '%QUERY',
    transform: function(response) {
      return _.map(response.results, formatAuditCommittee);
    },
  }
});

var auditCandidateEngine = createEngine({
  remote: {
    url: getUrl('audit_candidates'),
    wildcard: '%QUERY',
    transform: function(response) {
      return _.map(response.results, formatAuditCandidate);
    },
  }
});

var candidateDataset = {
  name: 'candidate',
  display: 'name',
  limit: 5,
  source: candidateEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a candidate:</span>',
    pending: '<span class="tt-suggestion__loading">Loading candidates...</span>',
    notFound: Handlebars.compile(''), // This has to be empty to not show anything
    suggestion: Handlebars.compile(
      '<span>' +
      '<span class="tt-suggestion__name">{{ name }} ({{ id }})</span>' +
      '<span class="tt-suggestion__office">{{ office }}</span>' +
      '</span>'
    )
  }
};

var committeeDataset = {
  name: 'committee',
  display: 'name',
  limit: 10,
  source: committeeEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a committee:</span>',
    pending: '<span class="tt-suggestion__loading">Loading committees...</span>',
    notFound: Handlebars.compile(''), // This has to be empty to not show anything
    suggestion: Handlebars.compile(
      '<span class="tt-suggestion__name">{{ name }} ({{ id }})</span>'
    )
  }
};


var auditCommitteeDataset = {
  name: 'auditCommittees',
  display: 'name',
  limit: 10,
  source: auditCommitteeEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a committee:</span>',
    pending: '<span class="tt-suggestion__loading">Loading committees...</span>',
    notFound: Handlebars.compile(''), // This has to be empty to not show anything
    suggestion: Handlebars.compile(
      '<span class="tt-suggestion__name">{{ name }} ({{ id }})</span>'
    )
  }
};

var auditCandidateDataset = {
  name: 'auditCandidates',
  display: 'name',
  limit: 10,
  source: auditCandidateEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a candidate:</span>',
    pending: '<span class="tt-suggestion__loading">Loading candidates...</span>',
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
    syncResults([{
      id: helpers.sanitizeValue(query),
      type: 'individual'
    }]);
  },
  templates: {
    suggestion: function(datum) {
      return '<span><strong>Search individual contributions from:</strong> "' + datum.id +
      '"</span>';
    }
  }
};

/* This is a fake dataset for showing an empty option with the query
 * when clicked, this will submit the form to the DigitalGov search site
 */
var siteDataset = {
  display: 'id',
  source: function(query, syncResults) {
    syncResults([{
      id: helpers.sanitizeValue(query),
      type: 'site'
    }]);
  },
  templates: {
    suggestion: function(datum) {
      return '<span><strong>Search other pages:</strong> "' + datum.id + '"</span>';
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
  minLength: 3,
  highlight: true,
  hint: false
};

function Typeahead(selector, type, url) {
  this.$input = $(selector);
  this.url = url || '/';
  this.typeahead = null;

  this.dataset = datasets[type];

  this.init();

  events.on('searchTypeChanged', this.handleChangeEvent.bind(this));
}

Typeahead.prototype.init = function() {
  if (this.typeahead) {
    this.$input.typeahead('destroy');
  }
  this.typeahead = this.$input.typeahead(typeaheadOpts, this.dataset);
  this.$element = this.$input.parent('.twitter-typeahead');
  this.$element.css('display', 'block');
  this.$element.find('.tt-menu').attr('aria-live', 'polite');
  this.$input.on('typeahead:select', this.select.bind(this));
};

Typeahead.prototype.handleChangeEvent = function(data) {
  this.init(data.type);
};

Typeahead.prototype.select = function(event, datum) {
  if (datum.type === 'individual') {
    window.location = this.url + 'receipts/individual-contributions/?contributor_name=' + datum.id;
  } else if (datum.type === 'site') {
    this.searchSite(datum.id);
  } else {
    window.location = this.url + datum.type + '/' + datum.id;
  }
};

Typeahead.prototype.searchSite = function(query) {
  /* If the site search option is selected, this function handles submitting
   * a new search on /search
   */

  var $form = this.$input.closest('form');
  var action = $form.attr('action');
  this.$input.val(query);
  $form.attr('action', action);
  $form.submit();
};

module.exports = {
  Typeahead: Typeahead,
  datasets: datasets
};
