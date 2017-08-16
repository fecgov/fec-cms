'use strict';

var $ = require('jquery');
var _ = require('underscore');

var FilterControl = require('./filter-control').FilterControl;

function ensureArray(value) {
  return _.isArray(value) ? value : [value];
}

function prepareValue($elm, value) {
  return $elm.attr('type') === 'checkbox' ?
    ensureArray(value) :
    value;
}

function Filter(elm) {
  this.$elm = $(elm);
  this.$input = this.$elm.find('input:not([name^="_"])');
  this.$filterLabel = this.$elm.closest('.accordion__content').prev();
  // on error message, click to open feedback panel
  this.$elm.on('click', '.js-filter-feedback', function () {
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

Filter.prototype.fromQuery = function(query) {
  this.setValue(query[this.name]);
  this.loadedOnce = true;
  return this;
};

Filter.prototype.setValue = function(value) {
  var $input = this.$input.data('temp') ?
    this.$elm.find('#' + this.$input.data('temp')) :
    this.$input;
  $input.val(prepareValue($input, value)).change();
  return this;
};

Filter.prototype.formatValue = function($input, value) {
  var prefix = $input.data('prefix');
  var suffix = $input.data('suffix');
  if (prefix) {
    prefix = prefix === '$' ? prefix : prefix + ' ';
    value = '<span class="prefix">' + prefix + '</span>' + value;
  }
  if (suffix) {
    value = value + '<span class="suffix"> ' + suffix + '</span>';
  }
  return value;
};

Filter.prototype.handleAddEvent = function(e, opts) {
  if (opts.name !== this.name) { return; }
  // The only time when opts.filterLabel != this.$filterLabel
  // is when a checkbox is a subfilter of a multifilter.
  // In that case, the multifilter explicitly sets the label and the checkbox
  // passes that value through via the event options.
  // Subfilters don't add listeners that trigger this handler, so it will only
  // be called by the MultiFilter.
  var $filterLabel = opts.filterLabel || this.$filterLabel;
  this.increment($filterLabel);
  this.setLastAction(e, opts);
};

Filter.prototype.handleRemoveEvent = function(e, opts) {
  // Don't decrement on initial page load
  if (opts.name !== this.name || opts.loadedOnce !== true) { return; }
  var $filterLabel = opts.filterLabel || this.$filterLabel;
  this.decrement($filterLabel);
  this.setLastAction(e, opts);
};

Filter.prototype.increment = function($filterLabel) {
  var filterCount = $filterLabel.find('.filter-count');
  if (filterCount.html()) {
    filterCount.html(parseInt(filterCount.html(), 10) + 1);
  }
  else {
    $filterLabel.append(' <span class="filter-count">1</span>');
  }
};

Filter.prototype.decrement = function($filterLabel) {
  var filterCount = $filterLabel.find('.filter-count');
  if (filterCount.html() === '1') {
    filterCount.remove();
  }
  else {
    filterCount.html(parseInt(filterCount.html(), 10) - 1);
  }
};

Filter.prototype.setLastAction = function(e, opts) {
  if (opts.name !== this.name) { return; }

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

