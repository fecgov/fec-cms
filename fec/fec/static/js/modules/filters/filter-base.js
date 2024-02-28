import { escape as _escape, isArray as _isArray } from 'underscore';

import { default as FilterControl } from './filter-control.js';

export function ensureArray(value) {
  return _isArray(value) ? value : [value];
}

export function prepareValue($elm, value) {
  return $elm.attr('type') === 'checkbox' ? ensureArray(value) : value;
}

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

Filter.prototype.fromQuery = function(query) {
  this.setValue(query[this.name]);
  this.loadedOnce = true;
  return this;
};

Filter.prototype.setValue = function(value) {
  const $input = this.$input.data('temp')
    ? this.$elm.find('#' + this.$input.data('temp'))
    : this.$input;
  $input.val(prepareValue($input, value)).change();
  return this;
};

Filter.prototype.formatValue = function($input, value) {
  const prefix = _escape($input.data('prefix'));
  const suffix = _escape($input.data('suffix'));
  const escapedValue = _escape(value);
  if (prefix) {
    prefix = prefix === '$' ? prefix : prefix + ' ';
    escapedValue = '<span class="prefix">' + prefix + '</span>' + escapedValue;
  }
  if (suffix) {
    escapedValue = escapedValue + '<span class="suffix"> ' + suffix + '</span>';
  }
  return escapedValue;
};

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

Filter.prototype.handleRemoveEvent = function(e, opts) {
  // Don't decrement on initial page load
  if (opts.name !== this.name || opts.loadedOnce !== true) {
    return;
  }
  const $filterLabel = opts.filterLabel || this.$filterLabel;
  this.decrement($filterLabel);
  this.setLastAction(e, opts);
};

Filter.prototype.increment = function($filterLabel) {
  const filterCount = $filterLabel.find('.filter-count');
  if (filterCount.html()) {
    filterCount.html(parseInt(filterCount.html(), 10) + 1);
  } else {
    $filterLabel.append(' <span class="filter-count">1</span>');
  }
};

Filter.prototype.decrement = function($filterLabel) {
  const filterCount = $filterLabel.find('.filter-count');
  if (filterCount.html() === '1') {
    filterCount.remove();
  } else {
    filterCount.html(parseInt(filterCount.html(), 10) - 1);
  }
};

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
