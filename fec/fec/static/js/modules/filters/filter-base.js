import { default as _escape } from 'underscore/modules/escape.js';

import { default as FilterControl } from './filter-control.js';

/**
 * If it's not an Array, make it into one
 * @param {*} value
 * @returns {Array}
 */
export function ensureArray(value) {
  return Array.isArray(value) ? value : [value];
}

/**
 * Ensure next value is ready, specifically that checkboxes are given Arrays.
 * @param {JQuery} $elm
 * @param {*} value
 * @returns {*} [Array] for checkboxes, otherwise, the value that's given it
 */
export function prepareValue($elm, value) {
  return $elm.attr('type') === 'checkbox' ? ensureArray(value) : value;
}

/**
 * @param {JQuery} elm
 *
 * @property {Filter} this - The individual instance of `new Filter()`
 * @property {JQuery} this.$elm - The jQuery-selected HTMLElement
 * @property {JQuery} this.$input - The jQuery-selected HTMLElement <input>
 * @property {JQuery} this.$filterLabel - The HTMLElement where the label and filter count will go
 * @property {Array} this.fields
 * @property {boolean} this.isSubfilter
 * @property {string} this.lastAction - When filters are changed, this is the message for the user @ex "Filter added"
 * @property {boolean} this.loadedOnce
 * @property {string} this.name
 */
export default function Filter(elm) {
  this.$elm = $(elm);
  this.$input = this.$elm.find('input:not([name^="_"])');
  this.$filterLabel = this.$elm.closest('.accordion__content').prev();
  // on error message, click to open feedback panel
  this.$elm.on('click', '.js-filter-feedback', function() {
    $(document.body).trigger('feedback:open');
  });

  this.name = this.$elm.data('name') || this.$input.attr('name');
  this.fields = [this.name];
  this.lastAction;

  if (this.$elm.hasClass('js-filter-control')) {
    new FilterControl(this.$elm);
  }

  // For filters that are part of a MultiFilter, set a property
  if (this.$elm.hasClass('js-sub-filter')) {
    this.isSubfilter = true;
  }

  if (!this.isSubfilter) {
    $(document.body).on('filter:added', this.handleAddEvent.bind(this));
    $(document.body).on('filter:removed', this.handleRemoveEvent.bind(this));
    $(document.body).on('filter:changed', this.setLastAction.bind(this));
  }
}

/**
 * Sets its own value, makes loadedOnce true, returns self.
 * Called at the end of FilterSet.activate()
 * @param {Object} query - An object of query parameters
 * @returns {Filter} This particular Filter
 */
Filter.prototype.fromQuery = function(query) {
  this.setValue(query[this.name]);
  this.loadedOnce = true;
  return this;
};

/**
 *
 * @param {*} value
 * @returns {Filter}
 */
Filter.prototype.setValue = function(value) {
  const $input = this.$input.data('temp')
    ? this.$elm.find('#' + this.$input.data('temp'))
    : this.$input;
  $input.val(prepareValue($input, value)).change(); // TODO: jQuery deprecation
  return this;
};

/**
 * Escape value and optionally wrap it in
 * 1) a prefix span if $input has a data-prefix attribute
 * 2) a suffix span if $input has a data-suffix attribute
 * @param {JQuery} $input - The <input> to be used for the data-prefix and data-suffix values
 * @param {string} value - The value to be escaped and wrapped in a prefix/suffix
 * @returns {string} An escaped string of the value, wrapped in HTML with a prefix and/or suffix span
 */
Filter.prototype.formatValue = function($input, value) {
  let prefix = _escape($input.data('prefix'));
  const suffix = _escape($input.data('suffix'));
  let escapedValue = _escape(value);
  if (prefix) {
    prefix = prefix === '$' ? prefix : prefix + ' ';
    escapedValue = '<span class="prefix">' + prefix + '</span>' + escapedValue;
  }
  if (suffix) {
    escapedValue = escapedValue + '<span class="suffix"> ' + suffix + '</span>';
  }
  return escapedValue;
};

/**
 * @param {jQuery.event} e
 * @param {Object} opts
 * @returns {Null} Return if irrelevant (opts.name != this.name)
 */
Filter.prototype.handleAddEvent = function(e, opts) {
  if (opts.name !== this.name) {
    return;
  }
  // The only time when opts.filterLabel != this.$filterLabel
  // is when a checkbox is a subfilter of a multifilter.
  // In that case, the multifilter explicitly sets the label and the checkbox
  // passes that value through via the event options.
  // Subfilters don't add listeners that trigger this handler, so it will only
  // be called by the MultiFilter.
  const $filterLabel = opts.filterLabel || this.$filterLabel;
  this.increment($filterLabel);
  this.setLastAction(e, opts);
};

/**
 * @param {jQuery.event} e
 * @param {Object} opts
 * @returns {Null} Return if irrelevant (opts.name != this.name || opts.loadedOnce !== true)
 */
Filter.prototype.handleRemoveEvent = function(e, opts) {
  // Don't decrement on initial page load
  if (opts.name !== this.name || opts.loadedOnce !== true) {
    return;
  }
  const $filterLabel = opts.filterLabel || this.$filterLabel;
  this.decrement($filterLabel);
  this.setLastAction(e, opts);
};

/**
 * If necessary, creates the <span> and for the number of applied filters and sets its count to 1
 * Otherwise, increments that count of applied filters
 * @param {JQuery} $filterLabel
 */
Filter.prototype.increment = function($filterLabel) {
  const filterCount = $filterLabel.find('.filter-count');
  if (filterCount.html()) {
    filterCount.html(parseInt(filterCount.html(), 10) + 1);
  } else {
    $filterLabel.append(' <span class="filter-count">1</span>');
  }
};

/**
 * If necessary, creates the <span> and for the number of applied filters and sets its count to 1
 * Otherwise, decrements that count of applied filters
 * @param {JQuery} $filterLabel
 */
Filter.prototype.decrement = function($filterLabel) {
  const filterCount = $filterLabel.find('.filter-count');
  if (filterCount.html() === '1') {
    filterCount.remove();
  } else {
    filterCount.html(parseInt(filterCount.html(), 10) - 1);
  }
};

/**
 * Called when a filter is updated, saves 'Filter [action]' text to this.lastAction
 * to be used in the in-filter "Filter added, 1,000 results removed" notification
 * @param {jQuery.Event} e
 * @param {Object} opts
 */
Filter.prototype.setLastAction = function(e, opts) {
  if (opts.name !== this.name) {
    return;
  }

  if (e.type === 'filter:added') {
    this.lastAction = 'Filter added';
  } else if (e.type === 'filter:removed') {
    this.lastAction = 'Filter removed';
  } else {
    this.lastAction = 'Filter changed';
  }
};

/**
 * Deactivate all the interactive elements in this filter,
 * @emits 'filter:disabled' if this element is checked or otherwise has a value
 */
Filter.prototype.disable = function() {
  this.$elm.find('input, label, button, .label').each(function() {
    const $this = $(this);
    $this.addClass('is-disabled').prop('disabled', true);
    // Disable the tag if it's checked
    if ($this.is(':checked') || $this.val()) {
      $this.trigger('filter:disabled', {
        key: $this.attr('id')
      });
    }
  });
  this.isEnabled = false;
};

/**
 * Reactivate all the interactive elements in this filter,
 * @emits 'filter:enabled' if this element is disabled
 */
Filter.prototype.enable = function() {
  this.$elm.find('input, label, button, .label').each(function() {
    const $this = $(this);
    $this.removeClass('is-disabled').prop('disabled', false);
    $this.trigger('filter:enabled', {
      key: $this.attr('id')
    });
  });
  this.isEnabled = true;
};
