import { default as _debounce } from 'underscore/modules/debounce.js';
import { default as URI } from 'urijs';

export function lineNumberFilters() {
  lineNumberFiltersCheck();

  $('#filters').on(
    'change',
    'input,select',
    _debounce(lineNumberFiltersCheck, 250)
  );
}

function lineNumberFiltersCheck() {
  const params = URI.parseQuery(window.location.search);

  if (Number(params.two_year_transaction_period) < 2007) {
    $('.js-line-number-filters').hide();
    $('.js-line-number-message').show();
  } else {
    $('.js-line-number-filters').show();
    $('.js-line-number-message').hide();
  }
}
