'use strict';

var $ = require('jquery');
var _ = require('underscore');

var FilterControl = require('./filter-control').FilterControl;

function ensureArray(value) {
  return _.isArray(value) ? value : [value];
}

function prepareValue($elm, value) {
  return $elm.attr('type') === 'checkbox' ? ensureArray(value) : value;
}

/**
 * @interface
 *
 * @param {jQuery} elm
 *
 * @property {jQuery} $filterLabel - In collapsible filters,
 * it's the previous sibling of the .accordion__content ancestor.
 * Usually button.js-accordion-trigger ? Note: this.$filterLabel is the element
 * but some functions here use a lesser-scoped $filterLabel as a string
 * for the number of filters that have been applied
 */
function Filter(elm) {
  console.log('new Filter(elm): ', elm);
  this.$elm = $(elm);
  this.$input = this.$elm.find('input:not([name^="_"])');
  this.$filterLabel = this.$elm.closest('.accordion__content').prev();
  console.log('this.$filterLabel: ', this.$filterLabel);
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
 * 
 * @param {object} query - Key/value pairs of the parameters from the page's URL
 * @returns {Filter}
 */
Filter.prototype.fromQuery = function(query) {
  console.log('Filter.fromQuery(query): ', query);
  console.log('  this.name: ', this.name);
  this.setValue(query[this.name]);
  this.loadedOnce = true;
  return this;
};

Filter.prototype.setValue = function(value) {
  var $input = this.$input.data('temp')
    ? this.$elm.find('#' + this.$input.data('temp'))
    : this.$input;
  $input.val(prepareValue($input, value)).change();
  return this;
};

Filter.prototype.formatValue = function($input, value) {
  var prefix = _.escape($input.data('prefix'));
  var suffix = _.escape($input.data('suffix'));
  var escapedValue = _.escape(value);
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
 * 
 * @param {jQuery.Event|CustomEvent} e - 
 * @param {object} opts - 
 * @returns 
 */
Filter.prototype.handleAddEvent = function(e, passedOpts) {
  console.log('Filter.handleAddEvent(e, passedOpts): ', e, passedOpts);
  var opts = passedOpts || e.detail;
  console.log('  opts.name and this.name: ', opts.name, this.name);
  // If this event doesn't apply to me, do nothing
  if (opts.name !== this.name) {
    return;
  }
  // The only time when opts.filterLabel != this.$filterLabel
  // is when a checkbox is a subfilter of a multifilter.
  // In that case, the multifilter explicitly sets the label and the checkbox
  // passes that value through via the event options.
  // Subfilters don't add listeners that trigger this handler, so it will only
  // be called by the MultiFilter.
  var $filterLabel = opts.filterLabel || this.$filterLabel;
  if ($filterLabel.length > 0) this.increment($filterLabel);
  this.setLastAction(e, opts);
};

/**
 *
 * @param {jQuery.Event} e
 * @param {object} passedOpts
 * @returns {null} if (opts.name !== this.name || opts.loadedOnce !== true)
 */
Filter.prototype.handleRemoveEvent = function(e, passedOpts) {
  console.log('Filter.handleRemoveEvent(e, opts): ', e, opts);
  const opts = passedOpts || e.originalEvent.detail;
  // Don't decrement on initial page load
  if (opts.name !== this.name || opts.loadedOnce !== true) {
    return;
  }
  var $filterLabel = opts.filterLabel || this.$filterLabel;
  this.decrement($filterLabel);
  this.setLastAction(e, opts);
};

/**
 * Adds or increases the filter count of the accordion item's button
 * @param {jQuery} $filterLabel - Either the jQuery selector for the label or the results of document.querySelector
 */
 Filter.prototype.increment = function($filterLabel) {
  var filterCount = $filterLabel.find('.filter-count');
  if (filterCount.html()) {
    filterCount.html(parseInt(filterCount.html(), 10) + 1);
  } else {
    $filterLabel.append(' <span class="filter-count">1</span>');
  }
};

/**
 * Removes or decreases the filter count of the accordion item's button
 * @param {jQuery|HTMLLabelElement} $filterLabel - Either the jQuery selector for the label or the results of document.querySelector
 */
Filter.prototype.decrement = function($filterLabel) {
  console.log('Filter.decrement($filterLabel): ', $filterLabel);

  // If it's not a jQuery object, let's find what it
  if (!$filterLabel.prevObject)
    $filterLabel = $($filterLabel).closest('.accordion__content').prev();

    console.log('  $filterLabel: ', $filterLabel);
  var filterCount = $filterLabel.find('.filter-count');
  if (filterCount.html() === '1') {
    filterCount.remove();
  } else {
    filterCount.html(parseInt(filterCount.html(), 10) - 1);
  }
};

/**
 * 
 * @param {jQuery.Event} e 
 * @param {object} passedOpts 
 *
 * @returns {null} if this filter's name isn't === opts.name
 */
Filter.prototype.setLastAction = function(e, passedOpts) {
  console.log('Filter.setLastAction(e, passedOpts): ', e, passedOpts);
  const opts = passedOpts || e.originalEvent.detail;
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

Filter.prototype.disable = function() {
  this.$elm.find('input, label, button, .label').each(function() {
    var $this = $(this);
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

Filter.prototype.enable = function() {
  this.$elm.find('input, label, button, .label').each(function() {
    var $this = $(this);
    $this.removeClass('is-disabled').prop('disabled', false);
    $this.trigger('filter:enabled', {
      key: $this.attr('id')
    });
  });
  this.isEnabled = true;
};

module.exports = {
  Filter: Filter,
  ensureArray: ensureArray,
  prepareValue: prepareValue
};
