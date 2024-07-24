import { default as _escape } from 'underscore/modules/escape.js';

import Filter, { ensureArray } from './filter-base.js';
import FilterTypeahead from './filter-typeahead.js';
import { datasets } from '../typeahead.js';

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

/**
 *
 * @param {Object} query
 * @param {string} query.data_type - "processed"
 * @param {string} query.max_date - "12312024"
 * @param {string} query.min_date - "01012023"
 * @param {string} query.two_year_transaction_period - "2024"
 * @returns
 */
TypeaheadFilter.prototype.fromQuery = function(query) {
  const values = query[this.name] ? ensureArray(query[this.name]) : [];
  this.typeaheadFilter.getFilters(values);
  this.typeaheadFilter.$elm.find('input[type="checkbox"]').val(values);
  return this;
};

// Ignore changes on typeahead input
TypeaheadFilter.prototype.handleChange = function() {}; // eslint-disable-line no-empty-function

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
