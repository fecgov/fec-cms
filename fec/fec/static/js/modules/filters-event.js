'use strict';

var $ = require('jquery');
var _ = require('underscore');

var URI = require('urijs');

function lineNumberFilters() {
  lineNumberFiltersCheck();

  $('#filters').on('change', 'input,select', _.debounce(lineNumberFiltersCheck, 250));
}

function lineNumberFiltersCheck() {
  var params = URI.parseQuery(window.location.search);

  if (Number(params.two_year_transaction_period) < 2007) {
    $('.js-line-number-filters').hide();
    $('.js-line-number-message').show();
  }
  else {
    $('.js-line-number-filters').show();
    $('.js-line-number-message').hide();
  }
}

module.exports = {
  lineNumberFilters: lineNumberFilters
};
