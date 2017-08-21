'use strict';

var $ = require('jquery');
var Filter = require('./filter-base.js').Filter;
var CheckboxFilter = require('./checkbox-filter').CheckboxFilter;

/* MultiFilters used when there are multiple filters that share the
 * same name attribute
*/

function MultiFilter(elm) {
  Filter.call(this, elm);
  this.subfilters = this.activateSubfilters();
}

MultiFilter.prototype = Object.create(Filter.prototype);
MultiFilter.constructor = MultiFilter;

MultiFilter.prototype.activateSubfilters = function() {
  var subfilters = [];
  // Activate each sub-filter and add it to an array
  this.$elm.find('.js-sub-filter[data-name="' + this.name + '"]').each(function() {
    var subfilter = new CheckboxFilter(this);
    // Explicitly assign filterLabel, which will show the count
    // Necessary because each subfilter may be part of a different accordion
    subfilter.$filterLabel = $('#' + subfilter.$elm.data('filter-label'));
    subfilters.push(subfilter);
  });

  return subfilters;
};

MultiFilter.prototype.fromQuery = function(query) {
  this.subfilters.forEach(function(filter) {
    filter.fromQuery(query);
  });
};

module.exports = {
  MultiFilter: MultiFilter
};
