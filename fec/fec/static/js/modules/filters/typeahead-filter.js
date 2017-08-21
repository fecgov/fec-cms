'use strict';

var $ = require('jquery');

var Filter = require('./filter-base.js');
var typeahead = require('../typeahead');
var FilterTypeahead = require('./filter-typeahead').FilterTypeahead;

function TypeaheadFilter(elm) {
  Filter.Filter.call(this, elm);

  var key = this.$elm.data('dataset');
  var allowText = this.$elm.data('allow-text') !== undefined;
  var dataset = key ? typeahead.datasets[key] : null;
  this.typeaheadFilter = new FilterTypeahead(this.$elm, dataset, allowText);
  this.typeaheadFilter.$elm.on('change', 'input[type="checkbox"]', this.handleNestedChange.bind(this));
}

TypeaheadFilter.prototype = Object.create(Filter.Filter.prototype);
TypeaheadFilter.constructor = TypeaheadFilter;

TypeaheadFilter.prototype.fromQuery = function(query) {
  var values = query[this.name] ? Filter.ensureArray(query[this.name]) : [];
  this.typeaheadFilter.getFilters(values);
  this.typeaheadFilter.$elm.find('input[type="checkbox"]').val(values);
  return this;
};

// Ignore changes on typeahead input
TypeaheadFilter.prototype.handleChange = function() {};

TypeaheadFilter.prototype.handleNestedChange = function(e) {
  var $input = $(e.target);
  var id = $input.attr('id');
  var $label = this.$elm.find('[for="' + id + '"]');

  var eventName = $input.is(':checked') ? 'filter:added' : 'filter:removed';

  $input.trigger(eventName, [
    {
      key: id,
      value: $label.text(),
      name: $input.attr('name'),
      loadedOnce: true
    }
  ]);
};

TypeaheadFilter.prototype.disable = function() {
  this.$elm.find('input, label, button').addClass('is-disabled').prop('disabled', true);
  this.$elm.find('input:checked').each(function() {
    $(this).trigger('filter:disabled', {
      key: $(this).attr('id')
    });
  });
};

TypeaheadFilter.prototype.enable = function() {
  this.$elm.find('input, label, button').removeClass('is-disabled').prop('disabled', false);
  this.$elm.find('input:checked').each(function() {
    $(this).trigger('filter:enabled', {
      key: $(this).attr('id')
    });
  });
};

module.exports = {TypeaheadFilter: TypeaheadFilter};
