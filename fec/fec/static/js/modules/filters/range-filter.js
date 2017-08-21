'use strict';

var $ = require('jquery');
var Filter = require('./filter-base');

function RangeFilter(elm) {
  Filter.Filter.call(this, elm);
  this.id = this.$input.attr('id');
  this.$submit = this.$elm.parent().find('button');

  this.$input.on('change', this.handleChange.bind(this));
  this.$input.on('keyup', this.handleKeyup.bind(this));

  if (this.$input.data('inputmask')) {
    this.$input.inputmask();
  }
}

RangeFilter.prototype = Object.create(Filter.Filter.prototype);
RangeFilter.constructor = RangeFilter;

RangeFilter.prototype.handleChange = function(e) {
  var $input = $(e.target);
  var value = $input.val();
  var loadedOnce = $input.data('loaded-once') || false;
  var range = $input.data('range') || 'false';
  var eventName;

  if ($input.data('had-value') && value.length > 0) {
    eventName = 'filter:renamed';
  } else if (value.length > 0) {
    eventName = 'filter:added';
    $input.data('had-value', true);
  } else {
    eventName = 'filter:removed';
    $input.data('had-value', false);
  }

  if (value.length > 0) {
    this.$submit.removeClass('is-disabled');
  } else {
    this.$submit.addClass('is-disabled');
  }

  if (loadedOnce) {
    this.$submit.addClass('is-loading');
  }

  $input.trigger(eventName, [
    {
      key: $input.attr('id'),
      value: this.formatValue($input, value),
      loadedOnce: loadedOnce,
      name: this.name,
      range: range,
      rangeName: this.name.split('_')[1]
    }
  ]);

  $input.data('loaded-once', true);
};

RangeFilter.prototype.handleKeyup = function() {
  this.$submit.removeClass('is-disabled');
};

module.exports = {RangeFilter: RangeFilter};
