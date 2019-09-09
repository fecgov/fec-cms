'use strict';

var $ = require('jquery');
var moment = require('moment');

var Filter = require('./filter-base');

require('inputmask/dist/inputmask/inputmask.date.extensions');
var Inputmask = require('inputmask/dist/inputmask/inputmask.numeric.extensions');

/**
 * ValidateDateFilter
 * @class
 * Special date filter for the 6-year date range inputs that need to validate that
 * the dates entered are within a period of time
 */
function ValidateDateFilter(elm) {
  Filter.Filter.call(this, elm);
  this.duration = this.$elm.data('duration');
  this.$range = this.$elm.find('.js-date-range');
  this.$minDate = this.$elm.find('.js-min-date');
  this.$maxDate = this.$elm.find('.js-max-date');
  this.$submit = this.$elm.find('button');

  Inputmask({
    inputformat: 'mm/dd/yyyy',
    oncomplete: this.validate.bind(this)
  }).mask(this.$minDate);

  Inputmask({
    inputformat: 'mm/dd/yyyy',
    oncomplete: this.validate.bind(this)
  }).mask(this.$maxDate);

  this.$input.on('change', this.handleInputChange.bind(this));

  this.fields = ['min_' + this.name, 'max_' + this.name];

  $(document.body).on('tag:removeAll', this.handleRemoveAll.bind(this));
}

ValidateDateFilter.prototype = Object.create(Filter.Filter.prototype);
ValidateDateFilter.constructor = ValidateDateFilter;

ValidateDateFilter.prototype.handleInputChange = function(e) {
  var $input = $(e.target);
  var value = $input.val();
  var loadedOnce = $input.data('loaded-once') || false;
  var range = $input.data('range') || false;
  var nonremovable = true;
  var rangename = 'date';
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

  if (loadedOnce) {
    this.$submit.addClass('is-loading');
  }

  $input.trigger(eventName, [
    {
      key: $input.attr('id'),
      value: this.formatValue($input, value),
      loadedOnce: loadedOnce,
      range: range,
      rangeName: rangename,
      name: this.name,
      nonremovable: nonremovable,
      removeOnSwitch: true
    }
  ]);

  if (eventName === 'filter:renamed') {
    $input.data('loaded-once', true);
  }
};

ValidateDateFilter.prototype.validate = function() {
  var minDate = moment(this.$minDate.val(), 'MM/DD/YYYY');
  var maxDate = moment(this.$maxDate.val(), 'MM/DD/YYYY');
  var span = maxDate.diff(minDate, 'years', true);
  if (span <= this.duration) {
    this.hideWarning();
    this.$elm.trigger('filters:validation', [
      {
        isValid: true
      }
    ]);
  } else {
    this.showWarning();
    this.$elm.trigger('filters:validation', [
      {
        isValid: false
      }
    ]);
  }
};

ValidateDateFilter.prototype.fromQuery = function(query) {
  // If no values are passed in the query, then default to today - Jan 1 from last year
  var now = moment().format('MM/DD/YYYY');
  var startYear = moment().format('YYYY') - 1;
  var defaultStart = moment('01/01/' + startYear, 'MM-DD-YYYY').format(
    'MM/DD/YYYY'
  );

  var minDate = query['min_' + this.name]
    ? query['min_' + this.name]
    : defaultStart;
  var maxDate = query['max_' + this.name] ? query['max_' + this.name] : now;
  this.$minDate.val(minDate).change();
  this.$maxDate.val(maxDate).change();
  return this;
};

ValidateDateFilter.prototype.handleRemoveAll = function(e, opts) {
  // If this is a forceRemove event that means it was triggered by table switch
  // So we need to clear these inputs and set had-value to false so that it fires filter:added
  var forceRemove = opts.forceRemove || false;

  function remove($filter) {
    $filter.val('');
    $filter.data('had-value', false);
    $filter.trigger('filter:removed', { loadedOnce: true });
  }

  if (forceRemove) {
    remove(this.$minDate);
    remove(this.$maxDate);
  }
};

ValidateDateFilter.prototype.showWarning = function() {
  if (!this.showingWarning) {
    var warning =
      '<div class="filter__message filter__message--error">' +
      '<strong>Time period is too broad</strong><br>' +
      'Please enter dates within six years of each other.' +
      '</div>';
    this.$range.after(warning);
    this.showingWarning = true;
  }
};

ValidateDateFilter.prototype.hideWarning = function() {
  if (this.showingWarning) {
    this.$elm.find('.filter__message').remove();
    this.showingWarning = false;
  }
};

module.exports = { ValidateDateFilter: ValidateDateFilter };
