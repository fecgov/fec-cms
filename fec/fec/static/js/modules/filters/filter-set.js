'use strict';

var $ = require('jquery');
var _ = require('underscore');
var URI = require('urijs');

var helpers = require('./helpers');
var TextFilter = require('./text-filter').TextFilter;
var CheckboxFilter = require('./checkbox-filter').CheckboxFilter;
var MultiFilter = require('./multi-filter').MultiFilter;
var TypeaheadFilter = require('./typeahead-filter').TypeaheadFilter;
var SelectFilter = require('./select-filter').SelectFilter;
var DateFilter = require('./date-filter').DateFilter;
var ElectionFilter = require('./election-filter').ElectionFilter;
var ToggleFilter = require('./toggle-filter').ToggleFilter;
var RangeFilter = require('./range-filter').RangeFilter;

function FilterSet(elm) {
  this.$body = $(elm);
  $(document.body).on('tag:removed', this.handleTagRemove.bind(this));
  this.$body.on('filters:validation', this.handleValidation.bind(this));
  this.efiling = this.$body.data('efiling-filters') || false;

  this.fields = [];
  this.isValid = true;
  this.firstLoad = true;
  this.filters = {};
  this.efilingFilters = {};
  this.processedFilters = {};
}

var filterMap = {
  'text': TextFilter,
  'checkbox': CheckboxFilter,
  'date': DateFilter,
  'typeahead': TypeaheadFilter,
  'election': ElectionFilter,
  'multi': MultiFilter,
  'select': SelectFilter,
  'toggle': ToggleFilter,
  'range': RangeFilter,
};

FilterSet.prototype.buildFilter = function($elm) {
  var filterType = $elm.attr('data-filter');
  var F = filterMap[filterType].constructor;
  return new F($elm);
};

FilterSet.prototype.activate = function($selector) {
  var self = this;
  var query = helpers.sanitizeQueryParams(URI.parseQuery(window.location.search));
  var filters = _.chain($selector)
    .map(function(elm) {
      var filter = self.buildFilter($(elm)); // .fromQuery(query);
      return [filter.name, filter];
    })
    .object()
    .value();
  var fields = _.chain(filters)
    .pluck('fields')
    .flatten()
    .value();

  // Activate each filter
  _.each(filters, function(filter) {
    filter.fromQuery(query);
  });

  // Store all field key-values in this.fields and return the filters object
  this.fields = this.fields.concat(fields);
  return filters;
};

FilterSet.prototype.activateProcessed = function() {
  if (_.isEmpty(this.processedFilters)) {
    var $filters = this.$body.find('.js-processed-filters .js-filter');
    this.processedFilters = this.activate($filters);
    // Store the processed filters in this.filters for later reference
    this.filters = this.processedFilters;
  }
};

FilterSet.prototype.activateEfiling = function() {
  if (_.isEmpty(this.efilingFilters)) {
    var $filters = this.$body.find('.js-efiling-filters .js-filter');
    this.efilingFilters = this.activate($filters);
    // Store the efiling filters in this.filters for later reference
    this.filters = this.efilingFilters;
  }
};

FilterSet.prototype.activateDataType = function() {
  var $filter = this.$body.find('#data-type-toggle .js-filter');
  this.activate($filter);
};

FilterSet.prototype.activateAll = function() {
  // If the panel uses efiling filters, activate the data type filter
  // and activate the others when necessary
  if (this.efiling) {
    this.activateDataType();
  } else {
    this.filters = this.activate(this.$body.find('.js-filter'));
  }
  return this;
};

FilterSet.prototype.serialize = function() {
  return _.reduce(this.$body.find('input,select').serializeArray(), function(memo, val) {
    if (val.value && val.name.slice(0, 1) !== '_') {
      if (memo[val.name]) {
        memo[val.name].push(val.value);
      } else{
        memo[val.name] = [val.value];
      }
    }
    return memo;
  }, {});
};

FilterSet.prototype.clear = function() {
  _.each(this.filters, function(filter) {
    filter.setValue();
  });
};

FilterSet.prototype.handleTagRemove = function(e, opts) {
  var $input = this.$body.find('#' + opts.key);
  var type = $input.get(0).type;

  if (type === 'checkbox' || type === 'radio') {
    $input.click();
  } else if (type === 'text') {
    $input.val('').trigger('change');
  }
};

FilterSet.prototype.handleValidation = function(e, opts) {
  this.isValid = opts.isValid;
};

FilterSet.prototype.switchFilters = function(dataType) {
  // Identify which filter group to show and which to hide
  var currentFilters = '.js-' + dataType + '-filters';
  var otherFilters = dataType == 'efiling' ? '.js-processed-filters' : '.js-efiling-filters';

  // Toggle visibility of filters
  this.$body.find(otherFilters).attr('aria-hidden', true);
  this.$body.find(currentFilters).attr('aria-hidden', false);

  // If necessary activate the filters
  if (dataType === 'efiling' && _.isEmpty(this.efilingFilters)) {
    this.activateEfiling();
  } else if (dataType === 'processed' && _.isEmpty(this.processedFilters)) {
    this.activateProcessed();
  }

  this.activateSwitchedFilters(dataType);
};

FilterSet.prototype.activateSwitchedFilters = function(dataType) {
  // Save the current query for later
  var query = helpers.sanitizeQueryParams(URI.parseQuery(window.location.search));

  // Set forceRemove: true to clear date filters that are usually nonremovable
  this.$body.trigger('tag:removeAll', {forceRemove: true});
  // Go through the current panel and set loaded-once on each input
  // So that they don't show loading indicators
  _.each(this.filters, function(filter) {
    filter.loadedOnce = false;
    filter.$elm.find('input').data('loaded-once', false);
  });

  // If there was a previous query, combine the two
  if (this.previousQuery) {
    query = _.extend({}, this.previousQuery, query);
  }

  // Identify which set of filters to activate and store as this.filters
  this.filters = dataType === 'efiling' ? this.efilingFilters : this.processedFilters;

  _.each(this.filters, function(filter) {
    filter.fromQuery(query);
  });

  this.previousQuery = query;
  this.firstLoad = false;
};

module.exports = {FilterSet: FilterSet};
