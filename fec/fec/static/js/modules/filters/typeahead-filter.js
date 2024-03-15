import { escape as _escape } from 'underscore';

import { default as Filter, ensureArray } from './filter-base.js';
import { datasets } from '../typeahead.js';
import { default as FilterTypeahead } from './filter-typeahead.js';

/**
 * 
 * @param {jQuery.Object} elm 
 */
export default function TypeaheadFilter(elm) {
  Filter.call(this, elm);

  const key = this.$elm.data('dataset');
  const allowText = this.$elm.data('allow-text') !== undefined;
  const dataset = key ? datasets[key] : null;
  this.typeaheadFilter = new FilterTypeahead(this.$elm, dataset, allowText);
  this.typeaheadFilter.$elm.on(
    'change',
    'input[type="checkbox"]',
    this.handleNestedChange.bind(this)
  );
}

TypeaheadFilter.prototype = Object.create(Filter.prototype);
TypeaheadFilter.constructor = TypeaheadFilter;

TypeaheadFilter.prototype.fromQuery = function(query) {
  const values = query[this.name] ? ensureArray(query[this.name]) : [];
  this.typeaheadFilter.getFilters(values);
  this.typeaheadFilter.$elm.find('input[type="checkbox"]').val(values);
  return this;
};

// Ignore changes on typeahead input
TypeaheadFilter.prototype.handleChange = function() {};

TypeaheadFilter.prototype.handleNestedChange = function(e) {
  const $input = $(e.target);
  const id = $input.attr('id');
  const $label = this.$elm.find('[for="' + id + '"]');

  const eventName = $input.is(':checked') ? 'filter:added' : 'filter:removed';

  $input.trigger(eventName, [
    {
      key: id,
      value: _escape($label.text()),
      name: $input.attr('name'),
      loadedOnce: true
    }
  ]);
};

TypeaheadFilter.prototype.disable = function() {
  this.$elm
    .find('input, label, button')
    .addClass('is-disabled')
    .prop('disabled', true);
  this.$elm.find('input:checked').each(function() {
    $(this).trigger('filter:disabled', {
      key: $(this).attr('id')
    });
  });
};

TypeaheadFilter.prototype.enable = function() {
  this.$elm
    .find('input, label, button')
    .removeClass('is-disabled')
    .prop('disabled', false);
  this.$elm.find('input:checked').each(function() {
    $(this).trigger('filter:enabled', {
      key: $(this).attr('id')
    });
  });
};
