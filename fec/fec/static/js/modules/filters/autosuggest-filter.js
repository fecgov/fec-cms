'use strict';

var $ = require('jquery');
var _ = require('underscore');

var Filter = require('./filter-base.js');
import AutoSuggest from '../autosuggest';
// import AutoSuggestFilter from './filter-autosuggest';

function AutoSuggestFilter(elm) {
  Filter.Filter.call(this, elm);

  // var k—ey = this.$elm.data('dataset');  // TODO: BRING THIS BACK AFTER RENAMING (caulking doesn't like it)
  var allowText = this.$elm.data('allow-text') !== undefined;
  // var dataset = key ? typeahead.datasets[key] : null; // TODO: BRING THIS BACK AFTER RENAMING (caulking doesn't like it)
  this.typeaheadFilter = new AutoSuggestFilter(this.$elm, dataset, allowText);
  this.typeaheadFilter.$elm.on(
    'change',
    'input[type="checkbox"]',
    this.handleNestedChange.bind(this)
  );
}

AutoSuggestFilter.prototype = Object.create(Filter.Filter.prototype);
AutoSuggestFilter.constructor = AutoSuggestFilter;

AutoSuggestFilter.prototype.fromQuery = function(query) {
  var values = query[this.name] ? Filter.ensureArray(query[this.name]) : [];
  this.typeaheadFilter.getFilters(values);
  this.typeaheadFilter.$elm.find('input[type="checkbox"]').val(values);
  return this;
};

// Ignore changes on typeahead input
AutoSuggestFilter.prototype.handleChange = function() {};

AutoSuggestFilter.prototype.handleNestedChange = function(e) {
  var $input = $(e.target);
  var id = $input.attr('id');
  var $label = this.$elm.find('[for="' + id + '"]');

  var eventName = $input.is(':checked') ? 'filter:added' : 'filter:removed';

  $input.trigger(eventName, [
    {
      // key: id, // TODO: BRING THIS BACK AFTER RENAMING (caulking doesn't like it)
      value: _.escape($label.text()),
      name: $input.attr('name'),
      loadedOnce: true
    }
  ]);
};

AutoSuggestFilter.prototype.disable = function() {
  this.$elm
    .find('input, label, button')
    .addClass('is-disabled')
    .prop('disabled', true);
  this.$elm.find('input:checked').each(function() {
    $(this).trigger('filter:disabled', {
      // key: $(this).attr('id') // TODO: BRING THIS BACK AFTER RENAMING (caulking doesn't like it)
    });
  });
};

AutoSuggestFilter.prototype.enable = function() {
  this.$elm
    .find('input, label, button')
    .removeClass('is-disabled')
    .prop('disabled', false);
  this.$elm.find('input:checked').each(function() {
    $(this).trigger('filter:enabled', {
      // key: $(this).attr('id') // TODO: BRING THIS BACK AFTER RENAMING (caulking doesn't like it)
    });
  });
};

module.exports = { AutoSuggestFilter: AutoSuggestFilter };
