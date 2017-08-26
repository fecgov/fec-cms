'use strict';

var $ = require('jquery');
var moment = require('moment');

var Filter = require('./filter-base.js');

require('jquery.inputmask');
require('inputmask/inputmask.date.extensions');

function DateFilter(elm) {
  Filter.Filter.call(this, elm);
  this.validateInput = this.$elm.data('validate') || false;
  this.$range = this.$elm.find('.js-date-range');
  this.$grid = this.$elm.find('.js-date-grid');
  this.$minDate = this.$elm.find('.js-min-date');
  this.$maxDate = this.$elm.find('.js-max-date');
  this.$submit = this.$elm.find('button');

  this.$minDate.inputmask('mm/dd/yyyy', {
    oncomplete: this.validate.bind(this)
  });
  this.$maxDate.inputmask('mm/dd/yyyy', {
    oncomplete: this.validate.bind(this)
  });

  this.$input.on('change', this.handleInputChange.bind(this));

  this.fields = ['min_' + this.name, 'max_' + this.name];

  this.$minDate.on('focus', this.handleMinDateSelect.bind(this));
  this.$maxDate.on('focus', this.handleMaxDateSelect.bind(this));

  this.$elm.on('click', '.date-range__grid li', this.handleGridItemSelect.bind(this));

  $(document.body).on('filter:modify', this.handleModifyEvent.bind(this));
  $(document.body).on('tag:removeAll', this.handleRemoveAll.bind(this));
}

DateFilter.prototype = Object.create(Filter.Filter.prototype);
DateFilter.constructor = DateFilter;

DateFilter.prototype.handleInputChange = function(e) {
  var $input = $(e.target);
  var value = $input.val();
  var loadedOnce = $input.data('loaded-once') || false;
  var range = $input.data('range') || false;
  var nonremovable = true;
  var rangename = 'date';
  var eventName;

  // on dates that aren't tied to two-year transactional periods
  // tags should be removable
  if ($input.data('removable')) {
    nonremovable = false;
    $input.data('loaded-once', true);
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

  this.setupDateGrid();

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

DateFilter.prototype.validate = function() {
  if (!this.validateInput) { return; }
  var years = [this.minYear, this.maxYear];
  var minDateYear = this.$minDate.val() ?
    parseInt(this.$minDate.val().split('/')[2]) : this.minYear;
  var maxDateYear = this.$maxDate.val() ?
    parseInt(this.$maxDate.val().split('/')[2]) : this.maxYear;
  if ( years.indexOf(minDateYear) > -1 && years.indexOf(maxDateYear) > -1 ) {
    this.hideWarning();
    this.$elm.trigger('filters:validation', [
      {
        isValid: true,
      }
    ]);
  } else {
    this.showWarning();
    this.$elm.trigger('filters:validation', [
      {
        isValid: false,
      }
    ]);
  }
};

DateFilter.prototype.fromQuery = function(query) {
  if (query['min_' + this.name] || query['max_' + this.name]) {
    this.setValue([
      query['min_' + this.name],
      query['max_' + this.name]
    ]);
  }
  return this;
};

DateFilter.prototype.setValue = function(value) {
  value = Filter.ensureArray(value);
  this.$minDate.val(value[0]).change();
  this.$maxDate.val(value[1]).change();
};

DateFilter.prototype.handleModifyEvent = function(e, opts) {
  var today = new Date();
  // Sets min and max years based on the transactionPeriod filter
  if (opts.filterName === this.name) {
    this.maxYear = parseInt(opts.filterValue);
    this.minYear = this.maxYear - 1;
    this.$minDate.val('01/01/' + this.minYear.toString()).change();
    if (this.maxYear === today.getFullYear()) {
      today = moment(today).format('MM/DD/YYYY');
      this.$maxDate.val(today).change();
    } else {
      this.$maxDate.val('12/31/' + this.maxYear.toString()).change();
    }
    this.validate();
  }
};

DateFilter.prototype.handleRemoveAll = function(e, opts) {
  // If this is a forceRemove event that means it was triggered by table switch
  // So we need to clear these inputs and set had-value to false so that it fires filter:added
  var forceRemove = opts.forceRemove || false;

  function remove($filter) {
    $filter.val('');
    $filter.data('had-value', false);
    $filter.trigger('filter:removed', {loadedOnce: true});
  }

  if (forceRemove) {
   remove(this.$minDate);
   remove(this.$maxDate);
  }
};

DateFilter.prototype.setupDateGrid = function() {
  var dateBegin = this.$minDate.val().split('/');
  var dateEnd = this.$maxDate.val().split('/');
  var dateRangeFirst = this.$grid.find('.date-range__row').eq(0);
  var dateRangeSecond = this.$grid.find('.date-range__row').eq(1);
  var minDateMonth = dateBegin[0];
  var minDateYear = dateBegin[2];
  var maxDateMonth = dateEnd[0];
  var maxDateYear = dateEnd[2];
  var $dateBegin;
  var $dateEnd;

  // the transaction year starts with the later, so begin before
  dateRangeFirst.find('.date-range__year').html(this.minYear);
  dateRangeFirst.find('ul').attr('data-year', this.minYear);

  dateRangeSecond.find('.date-range__year').html(this.maxYear);
  dateRangeSecond.find('ul').attr('data-year', this.maxYear);

  // get the elements of the beginning and ending dates
  $dateBegin = this.$grid.find('ul[data-year="' + minDateYear + '"] ' +
    'li[data-month="' + minDateMonth + '"]');
  $dateEnd = this.$grid.find('ul[data-year="' + maxDateYear + '"] ' +
    'li[data-month="' + maxDateMonth + '"]');

  // set the selected date range in the grid
  this.handleDateGridRange($dateBegin, $dateEnd);
};

DateFilter.prototype.handleDateGridRange = function($dateBegin, $dateEnd) {
  this.$grid.find('li').removeClass();

  $dateBegin.addClass('selected month--begin');
  $dateEnd.addClass('selected month--end');

  if (!$dateBegin.is($dateEnd)) {
    $dateBegin.nextUntil('.month--end').addClass('selected');
    $dateEnd.prevUntil('.month--begin').addClass('selected');
  }
};

DateFilter.prototype.handleMinDateSelect = function() {
  var self = this;
  var $dateBegin = this.$grid.find('.month--begin');
  var $dateEnd = this.$grid.find('.month--end');

  this.$grid.show().removeClass('pick-max').addClass('pick-min');
  this.$grid.find('.is-active').removeClass('is-active');
  $dateBegin.addClass('is-active');

  this.$grid.find('li').hover(
    function() {
      var dateBeginNum = parseInt($(this).parent().attr('data-year') + $(this).attr('data-month'));
      var dateEndNum = parseInt($dateEnd.parent().attr('data-year') + $dateEnd.attr('data-month'));

      if (dateBeginNum <= dateEndNum) {
        self.$grid.removeClass('is-invalid');
        self.handleDateGridRange($(this), $dateEnd);
      }
      else {
        self.$grid.addClass('is-invalid');
      }
    },
    function() {
      self.handleDateGridRange($dateBegin, $dateEnd);
      $dateBegin.addClass('is-active');
    }
  );
};

DateFilter.prototype.handleMaxDateSelect = function() {
  var self = this;
  var $dateBegin = this.$grid.find('.month--begin');
  var $dateEnd = this.$grid.find('.month--end');

  this.$grid.show().removeClass('pick-min').addClass('pick-max');
  this.$grid.find('.is-active').removeClass('is-active');
  $dateEnd.addClass('is-active');

  this.$grid.find('li').hover(
    function() {
      // turn dates to numbers for comparsion
      // to make sure hover date range is valid
      var dateBeginNum =
        parseInt($dateBegin.parent().attr('data-year') + $dateBegin.attr('data-month'));
      var dateEndNum =
        parseInt($(this).parent().attr('data-year') + $(this).attr('data-month'));

      if (dateBeginNum <= dateEndNum) {
        self.$grid.removeClass('is-invalid');
        self.handleDateGridRange($dateBegin, $(this));
      }
      else {
        self.$grid.addClass('is-invalid');
      }
    },
    function() {
      self.handleDateGridRange($dateBegin, $dateEnd);
      $dateEnd.addClass('is-active');
    }
  );
};

DateFilter.prototype.handleGridItemSelect = function(e) {
  var value = [];
  var $selectDate = $(e.target).parent();
  var selectDateMonth = $selectDate.data('month');
  var selectDateYear = $selectDate.parent().attr('data-year');

  // if user clicks outside of border radius within the date box
  if ($(e.target).hasClass('selected')) {
    $selectDate = $(e.target);
  }

  if (this.$grid.hasClass('pick-min')) {
    value[0] = selectDateMonth + '/01/' + selectDateYear;
    value[1] = this.$maxDate.val();
  }
  else {
    // calculate last day of month for end date
    var lastDay = new Date(selectDateYear, selectDateMonth, 0);
    lastDay = lastDay.getDate();

    value[0] = this.$minDate.val();
    value[1] = selectDateMonth + '/' + lastDay +'/' + selectDateYear;
  }

  if (!this.$grid.hasClass('is-invalid')) {
    var $nextItem = this.$grid.hasClass('pick-min') ? this.$maxDate : this.$submit;
    this.$grid.removeClass('pick-min pick-max');
    this.$grid.find('li').unbind('mouseenter mouseleave');
    this.setValue(value);
    this.$grid.addClass('is-invalid');
    $nextItem.focus();
  }
};

DateFilter.prototype.showWarning = function() {
  if (!this.showingWarning) {
    var warning =
    '<div class="message message--error message--small">' +
      'You entered a date that\'s outside the two-year time period. ' +
      'Please enter a receipt date from ' +
      '<strong>' + this.minYear + '-' + this.maxYear + '</strong>' +
    '</div>';
    this.$range.after(warning);
    this.showingWarning = true;
    this.$grid.hide();
  }
};

DateFilter.prototype.hideWarning = function() {
  if (this.showingWarning) {
    this.$elm.find('.message').remove();
    this.showingWarning = false;
  }
};

module.exports = {DateFilter: DateFilter};
