import { default as Filter } from './filter-base.js';

export default function RangeFilter(elm) {
  Filter.call(this, elm);
  this.id = this.$input.attr('id');
  this.$submit = this.$elm.parent().find('button');

  this.$input.on('change', this.handleChange.bind(this));
  this.$input.on('keyup', this.handleKeyup.bind(this));

  if (this.$input.data('inputmask')) {
    this.$input.inputmask();
  }
}

RangeFilter.prototype = Object.create(Filter.prototype);
RangeFilter.constructor = RangeFilter;

RangeFilter.prototype.handleChange = function(e) {
  var $input = $(e.target);
  var value = $input.val();
  var loadedOnce = $input.data('loaded-once') || false;
  var range = $input.data('range') || 'false';
  var eventName;
  var rangeNameForTag = this.name.split('_')[1]; // (initial functionality)
  // If the name has more than two underscores, use all of the name after the second _.
  // Why?
  // Because longer field names that were similar to each other were being combined
  // ex: `outstanding_balance_beginning_of_period` and `outstanding_balance_close_of_period`
  //     were being abbreviated to `outstanding` and then combined into one group of tabs/chiclets
  //
  if ((this.name.match(/_/g) || []).length > 2) {
    // split the name on every _
    var rangeSplit = this.name.split('_');
    // use all of the name after the second _ (not just the parts between the second and third _)
    rangeNameForTag = this.name.substr(rangeSplit[0].length + 1);
  }

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
      rangeName: rangeNameForTag
    }
  ]);

  $input.data('loaded-once', true);
};

RangeFilter.prototype.handleKeyup = function() {
  this.$submit.removeClass('is-disabled');
};
