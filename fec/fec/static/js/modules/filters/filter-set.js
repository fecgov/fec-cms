import { default as _chain } from 'underscore/modules/chain.js';
import { default as _each } from 'underscore/modules/each.js';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as _isEmpty } from 'underscore/modules/isEmpty.js';
import { default as _reduce } from 'underscore/modules/reduce.js';
import { default as URI } from 'urijs';

import { default as CheckboxFilter } from './checkbox-filter.js';
import { default as DateFilter } from './date-filter.js';
import { default as ElectionFilter } from './election-filter.js';
import { default as MultiFilter } from './multi-filter.js';
import { default as RangeFilter } from './range-filter.js';
import { default as SelectFilter } from './select-filter.js';
import { default as TextFilter } from './text-filter.js';
import { default as ToggleFilter } from './toggle-filter.js';
import { default as TypeaheadFilter } from './typeahead-filter.js';
import { sanitizeQueryParams } from '../helpers.js';

export default function FilterSet(elm) {
  this.$body = $(elm);
  $(document.body).on('tag:removed', this.handleTagRemoved.bind(this));

  this.$body.on('filters:validation', this.handleValidation.bind(this));
  this.efiling = this.$body.data('efiling-filters') || false;

  this.fields = [];
  this.isValid = true;
  this.firstLoad = true;
  this.filters = {};
  this.efilingFilters = {};
  this.processedFilters = {};
}

const filterMap = {
  text: TextFilter,
  checkbox: CheckboxFilter,
  date: DateFilter,
  typeahead: TypeaheadFilter,
  election: ElectionFilter,
  multi: MultiFilter,
  select: SelectFilter,
  toggle: ToggleFilter,
  range: RangeFilter
};

FilterSet.prototype.buildFilter = function($elm) {
  const filterType = $elm.attr('data-filter');
  const F = filterMap[filterType].constructor;
  return new F($elm);
};

FilterSet.prototype.activate = function($selector) {
  const self = this;
  const query = sanitizeQueryParams(
    URI.parseQuery(window.location.search)
  );
  const filters = _chain($selector)
    .map(function(elm) {
      var filter = self.buildFilter($(elm)); // .fromQuery(query);
      return [filter.name, filter];
    })
    .object()
    .value();
    const fields = _chain(filters)
    .pluck('fields')
    .flatten()
    .value();

  // Activate each filter
  _each(filters, function(filter) {
    filter.fromQuery(query);
  });

  // Store all field key-values in this.fields and return the filters object
  this.fields = this.fields.concat(fields);
  return filters;
};

FilterSet.prototype.activateProcessed = function() {
  if (_isEmpty(this.processedFilters)) {
    const $filters = this.$body.find('.js-processed-filters .js-filter');
    this.processedFilters = this.activate($filters);
    // Store the processed filters in this.filters for later reference
    this.filters = this.processedFilters;
  }
};

FilterSet.prototype.activateEfiling = function() {
  if (_isEmpty(this.efilingFilters)) {
    const $filters = this.$body.find('.js-efiling-filters .js-filter');
    this.efilingFilters = this.activate($filters);
    // Store the efiling filters in this.filters for later reference
    this.filters = this.efilingFilters;
  }
};

FilterSet.prototype.activateDataType = function() {
  const $filter = this.$body.find('#data-type-toggle .js-filter');
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
  return _reduce(
    this.$body.find('input,select').serializeArray(),
    function(memo, val) {
      if (val.value && val.name.slice(0, 1) !== '_') {
        if (memo[val.name]) {
          memo[val.name].push(val.value);
        } else {
          memo[val.name] = [val.value];
        }
      }
      return memo;
    },
    {}
  );
};

FilterSet.prototype.clear = function() {
  _each(this.filters, function(filter) {
    filter.setValue();
  });
};

//This removes the checkboxes in the panel that show whats been selected when you remove the tag from
//the tags panel at the top of the table
FilterSet.prototype.handleTagRemoved = function(e, opts) {
  const $input = $(document.getElementById(opts.key));
  if ($input.length > 0) {
    const type = $input.get(0).type;

    if (type === 'checkbox' || type === 'radio') {
      $input.click(); // TODO: jQuery deprecation
    } else if (type === 'text') {
      $input.val('').trigger('change');
    }
    else if (type === 'select-one') {
        $input.find('option[value=""]').prop('selected', true);
        $input.trigger('change');
    }
  }
};

FilterSet.prototype.handleValidation = function(e, opts) {
  this.isValid = opts.isValid;
};

FilterSet.prototype.switchFilters = function(dataType) {
  // Identify which filter group to show and which to hide
  const currentFilters = '.js-' + dataType + '-filters';
  const otherFilters =
    dataType == 'efiling' ? '.js-processed-filters' : '.js-efiling-filters';

  // Toggle visibility of filters
  this.$body.find(otherFilters).attr('aria-hidden', true);
  this.$body.find(currentFilters).attr('aria-hidden', false);

  // If necessary activate the filters
  if (dataType === 'efiling' && _isEmpty(this.efilingFilters)) {
    this.activateEfiling();
  } else if (dataType === 'processed' && _isEmpty(this.processedFilters)) {
    this.activateProcessed();
  }

  this.activateSwitchedFilters(dataType);
};

FilterSet.prototype.activateSwitchedFilters = function(dataType) {
  // Save the current query for later
  let query = sanitizeQueryParams(
    URI.parseQuery(window.location.search)
  );

  // Set forceRemove: true to clear date filters that are usually non-removable
  this.$body.trigger('tag:removeAll', {
    forceRemove: true,
    fromFilterSet: true
  });
  // Go through the current panel and set loaded-once on each input
  // So that they don't show loading indicators
  _each(this.filters, function(filter) {
    filter.loadedOnce = false;
    filter.$elm.find('input').data('loaded-once', false);
  });

  // If there was a previous query, combine the two
  if (this.previousQuery) {
    query = _extend({}, this.previousQuery, query);
  }

  // Identify which set of filters to activate and store as this.filters
  this.filters =
    dataType === 'efiling' ? this.efilingFilters : this.processedFilters;

  _each(this.filters, function(filter) {
    filter.fromQuery(query);
  });

  this.previousQuery = query;
  this.firstLoad = false;
};
