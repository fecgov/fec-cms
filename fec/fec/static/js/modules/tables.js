import { default as _chain } from 'underscore/modules/chain.js';
import { default as _clone } from 'underscore/modules/clone.js';
import { default as _debounce } from 'underscore/modules/debounce.js';
import { default as _each } from 'underscore/modules/each.js';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as _intersection } from 'underscore/modules/intersection.js';
import { default as _isEmpty } from 'underscore/modules/isEmpty.js';
import { default as _isEqual } from 'underscore/modules/isEqual.js';
import { default as _map } from 'underscore/modules/map.js';
import { default as _max } from 'underscore/modules/max.js';
import { default as _object } from 'underscore/modules/object.js';
import { default as _pairs } from 'underscore/modules/pairs.js';
import { default as _pluck } from 'underscore/modules/pluck.js';
import 'datatables.net-responsive-dt';

import { removeTabindex, restoreTabindex } from './accessibility.js';
import { sizeColumns, stateColumns } from './column-helpers.js';
import { download, isPending, pendingCount } from './download.js';
import Dropdown from './dropdowns.js';
import {
  buildUrl,
  filterNull,
  isLargeScreen,
  numberFormatter as formatNumber,
  LOADING_DELAY,
  SUCCESS_DELAY
} from './helpers.js';
import { updateQuery } from './urls.js';
import { default as FilterPanel } from '../modules/filters/filter-panel.js';
import { default as TagList } from '../modules/filters/filter-tags.js';
import comparisonTemplate from '../templates/comparison.hbs';
import exportWidgetTemplate from '../templates/tables/exportWidget.hbs';
import missingTemplate from '../templates/tables/noData.hbs';
import { onShow as tabsOnShow } from '../vendor/tablist.js';

export const simpleDOM = 't<"results-info"lpi>';
export const browseDOM = '<"panel__main"t>' + '<"results-info"lpi>';
// Source documentation for these two ^ :
// https://datatables.net/reference/option/dom

// To change the number of items in the "Showing __ of __ entries" blocks.
// $.fn.DataTable.ext.pager.numbers_length = 5;
// Must be an odd number

export const DOWNLOAD_CAP = 500000;
export const downloadCapFormatted = formatNumber(DOWNLOAD_CAP);
export const MAX_DOWNLOADS = 5;
export const DOWNLOAD_MESSAGES = {
  recordCap:
    'Use <a href="' +
    window.BASE_PATH +
    '/browse-data?tab=bulk-data">' +
    'bulk data</a> to export more than ' +
    downloadCapFormatted +
    ' records.',
  downloadCap:
    'Each user is limited to ' +
    MAX_DOWNLOADS +
    ' exports at a time. This helps us keep things running smoothly.',
  empty: 'This table has no data to export.',
  comingSoon: 'Data exports for this page are coming soon.',
  pending: 'You\'re already exporting this data set.'
};

/**
 * The selector string for data widgets
 */
export const DATA_WIDGETS = '.js-data-widgets';

// id for the last changed element on form for status update
let updateChangedEl;
let messageTimer;

// Only show table after draw
$(document.body).on('draw.dt', function() {
  $('.dataTable tbody').attr('role', 'rowgroup');
  $('.dataTable tbody td:first-child').attr('scope', 'row');
});

/**
 *
 * @param {number} first - The beginning year of the range
 * @param {number} last - The ending year of the range
 * @returns {string} Formatted as `${first} - ${last}`
 */
 export function yearRange(first, last) {
  if (first === last) {
    return first;
  } else {
    return first.toString() + ' - ' + last.toString();
  }
}

/**
 *
 * @param {*} value
 * @param {*} meta
 * @returns {Object} Either { cycles: {number} } or {}
 */
export function getCycle(value, meta) {
  const dataTable = DataTable_FEC.registry[meta.settings.sTableId];
  const filters = dataTable && dataTable.filters;

  if (filters && filters.cycle) {
    const cycles = _intersection(
      _map(filters.cycle, function(cycle) {
        return parseInt(cycle);
      }),
      value
    );
    return cycles.length ? { cycle: _max(cycles) } : {};
  } else {
    return {};
  }
}

/**
 *
 * @param {*} order
 * @param {*} column
 * @returns
 */
export function mapSort(order, column) {
  return _map(order, function(item) {
    let name = column[item.column].data;
    if (item.dir === 'desc') {
      name = '-' + name;
    }
    return name;
  });
}

function getCount(response) {
  let pagination_count = response.pagination.count; // eslint-disable-line camelcase

  if (response.pagination.count > 500000) {
    pagination_count = Math.round(response.pagination.count / 1000) * 1000; // eslint-disable-line camelcase
  }

  return pagination_count; // eslint-disable-line camelcase
}

/**
 *
 * @param {*} response
 * @returns An object with values for `recordsTotal`, `recordsFiltered`, and `data` (response.results)
 */
export function mapResponse(response) {
  const pagination_count = getCount(response); // eslint-disable-line camelcase

  return {
    recordsTotal: pagination_count, // eslint-disable-line camelcase
    recordsFiltered: pagination_count, // eslint-disable-line camelcase
    data: response.results
  };
}

function identity(value) {
  return value;
}

export const MODAL_TRIGGER_CLASS = 'js-panel-trigger';
export const MODAL_TRIGGER_HTML =
  '<button class="js-panel-button button--panel">' +
  '<span class="u-visually-hidden">Toggle details</span>' +
  '</button>';

/**
 * @param {HTMLTableRowElement} row
 */
export function modalRenderRow(row) {
  row.classList.add(MODAL_TRIGGER_CLASS, 'row--has-panel');
}

/**
 * @param {Function} template - Is this a function?
 * @param {*} fetch
 * @returns Function
 */
export function modalRenderFactory(template, fetch) {
  let callback;
  fetch = fetch || identity;

  return function(api, data, response) {
    const $table = $(api.table().node());
    const $modal = $('#datatable-modal');
    const $main = $table.closest('.panel__main');
    // Move the modal to the results div.
    $modal.appendTo($main);
    $modal.css('display', 'block');

    // Add a class to the .dataTables_wrapper
    $table.closest('.dataTables_wrapper').addClass('dataTables_wrapper--panel');

    $table.off(
      'click keypress',
      '.js-panel-toggle tr.' + MODAL_TRIGGER_CLASS,
      callback
    );
    callback = function(e) {
      if (e.which === 13 || e.type === 'click') {
        // Note: Use `currentTarget` to get parent row, since the target column
        // may have been moved since the triggering event
        const $row = $(e.currentTarget);
        const $target = $(e.target);
        if ($target.is('a')) {
          return true;
        }
        if (!$target.closest('td').hasClass('dataTables_empty')) {
          const index = api.row($row).index();
          $.when(fetch(response.results[index])).done(function(fetched) {
            $modal.find('.js-panel-content').html(template(fetched));
            $modal.attr('aria-hidden', 'false');
            $row.siblings().toggleClass('row-active', false);
            $row.toggleClass('row-active', true);
            $('body').toggleClass('panel-active', true);
            restoreTabindex($modal);
            const hideColumns = api.columns('.hide-panel');
            hideColumns.visible(false);

            // Populate the pdf button if there is one
            if (fetched.pdf_url) {
              $modal.find('.js-pdf_url').attr('href', fetched.pdf_url);
            } else {
              $modal.find('.js-pdf_url').remove();
            }
            // Set focus on the close button
            $('.js-hide').focus(); // TODO: jQuery deprecation

            // When under $large-screen
            // TODO figure way to share these values with CSS.
            if ($(document).width() < 980) {
              api.columns('.hide-panel-tablet').visible(false);
            }
          });
        }
      }
    };
    $table.on(
      'click keypress',
      '.js-panel-toggle tr.' + MODAL_TRIGGER_CLASS,
      callback
    );

    $modal.on('click', '.js-panel-close', function(e) {
      e.preventDefault();
      hidePanel(api, $modal);
    });
  };
}

function hidePanel(api, $modal) {
  $('.row-active .js-panel-button').focus(); // TODO: jQuery deprecation
  $('.js-panel-toggle tr').toggleClass('row-active', false);
  $('body').toggleClass('panel-active', false);
  $modal.attr('aria-hidden', 'true');

  if ($(document).width() > 640) {
    api.columns('.hide-panel-tablet').visible(true);
    api.columns('.hide-panel.min-tablet').visible(true);
  }

  if ($(document).width() > 980) {
    api.columns('.hide-panel').visible(true);
  }

  removeTabindex($modal);
}
/**
 *
 * @param {?string} template
 * @param {object} api
 */
export function barsAfterRender(template, api) {
  const $table = $(api.table().node());
  const $cols = $table.find('div[data-value]');

  // Store the initial max value on the table element just once
  // Set widths of bars relative to the global max,
  // rather than the max of each draw
  if (!$table.data('max')) {
    const values = $cols.map(function(idx, each) {
      return parseFloat(each.getAttribute('data-value'));
    });
    const max = _max(values);
    $table.data('max', max);
  }

  const tableMax = $table.data('max');
  $cols.after(function() {
    const value = $(this).attr('data-value');
    const width = (100 * parseFloat(value)) / tableMax;
    if ($(this).next('.bar-container').length > 0) {
      return;
    } else {
      return (
        '<div class="bar-container">' +
        '<div class="value-bar" style="width: ' +
        width +
        '%"></div>' +
        '</div>'
      );
    }
  });
}

function updateOnChange($form, api) {
  function onChange(e) {
    e.preventDefault();
    hidePanel(api, $('#datatable-modal'));
    api.ajax.reload();

    updateChangedEl = e.target;
  }
  $form.on('change', 'input,select', _debounce(onChange, 250));
}

function filterSuccessUpdates(changeCount) {
  // on filter change update:
  // - loading/success status
  // - count change message

  // check if there is a changed form element
  if (updateChangedEl) {
    let $label;
    const $elm = $(updateChangedEl);
    const type = $elm.attr('type');
    let message = '';
    let filterAction = '';
    let filterResult = '';
    const $filterMessage = $('.filter__message');

    $('.is-successful').removeClass('is-successful');
    $('.is-unsuccessful').removeClass('is-unsuccessful');
    // Enable all restricted fields on success
    $(
      '.restricted-fields input, .restricted-fields button, .restricted-fields legend'
    )
      .removeClass('is-disabled-filter')
      .addClass('is-active-filter');

    // Reenable committee ID typeahead input
    $('#committee_id').removeClass('is-disabled-filter');

    if (type === 'checkbox') {
      $label = $('label[for="' + updateChangedEl.id + '"]');

      filterAction = 'Filter added';

      if (!$elm.is(':checked')) {
        filterAction = 'Filter removed';
      }
    } else if (type === 'radio') {
      // Add the message after the last radio button / toggle
      $label = $('label[for="' + updateChangedEl.id + '"]').closest('fieldset');
      filterAction =
        $elm.attr('name') == 'data_type'
          ? 'Data type changed.'
          : 'Filter applied.';

      if (!$elm.is(':checked')) {
        filterAction = 'Filter removed.';
      }
    } else if (type === 'text') {
      // typeahead
      if ($elm.hasClass('tt-input')) {
        // show message after generated checkbox (last item in list)
        $label = $('[data-filter="typeahead"] li').last();
        filterAction = 'Filter added';
      } else if ($elm.closest('.range').hasClass('range--currency')) {
        $label = $elm.closest('.range');
        filterAction = 'Filter applied';
      } else if ($elm.closest('.range').hasClass('range--date')) {
        $label = $('.date-range-grid');
        filterAction = 'Filter applied';
      }
      // text input search
      else {
        $label = $('.is-loading:not(.overlay)');
        filterAction = 'Filter added';
      }
    } else {
      // probably a select dropdown
      $label = $elm;
      filterAction = '"' + $elm.find('option:selected').text() + '" applied.';
    }

    $('.is-loading:not(.overlay)')
      .removeClass('is-loading')
      .addClass('is-successful');

    // build message with number of results returned

    if (changeCount > 0) {
      filterResult = changeCount.toLocaleString() + ' more results';
    } else if (changeCount === 0) {
      filterResult = 'No change in results';
    } else {
      filterResult = Math.abs(changeCount).toLocaleString() + ' fewer results';
    }

    message = '<strong>' + filterAction + '</strong><br>' + filterResult;

    $filterMessage.fadeOut().remove();
    // if there is a message already, cancel existing message timeout
    // to avoid timing weirdness
    clearTimeout(messageTimer);

    // Clicking on "Clear all filters" will remove all dropdown checkboxes,
    // so we check to make sure the message isn't shown inside the dropdown panel.
    if ($label.closest('.dropdown__list').length < 1) {
      // append filter change count message after input
      $label.after(
        $(
          '<div class="filter__message filter__message--success">' +
            message +
            '</div>'
        )
          .hide()
          .fadeIn()
      );
    }

    messageTimer = setTimeout(function() {
      $('.filter__message.filter__message--success').fadeOut(function() {
        $(this).remove();
      });
      $('.is-successful').removeClass('is-successful');
      $('.date-range-grid').fadeOut();
    }, SUCCESS_DELAY);
  }
}

/**
 * The OffsetPaginator class
 * @function mapQuery
 * @function handleResponse
 */
export function OffsetPaginator() {/* */}

/**
 * @param {*} data
 * @returns Object with number values for `per_page` and `page`
 */
OffsetPaginator.prototype.mapQuery = function(data) {
  return {
    per_page: data.length, // eslint-disable-line camelcase
    page: Math.floor(data.start / data.length) + 1
  };
};

OffsetPaginator.prototype.handleResponse = function() {}; //eslint-disable-line no-empty-function

/**
 * The SeekPaginator class
 */
export function SeekPaginator() {
  this.indexes = {};
  this.query = null;
}

SeekPaginator.prototype.getIndexes = function(length, start) {
  return (this.indexes[length] || {})[start] || {};
};

SeekPaginator.prototype.setIndexes = function(length, start, value) {
  this.indexes[length] = this.indexes[length] || {};
  this.indexes[length][start] = value;
};

SeekPaginator.prototype.clearIndexes = function() {
  this.indexes = {};
};

SeekPaginator.prototype.mapQuery = function(data, query) {
  if (!_isEqual(query, this.query)) {
    this.query = _clone(query);
    this.clearIndexes();
  }
  const indexes = this.getIndexes(data.length, data.start);
  return _extend(
    { per_page: data.length }, // eslint-disable-line camelcase
    _chain(Object.keys(indexes))
      .filter(function(key) {
        return indexes[key];
      })
      .map(function(key) {
        return [key, indexes[key]];
      })
      .object()
      .value()
  );
};

SeekPaginator.prototype.handleResponse = function(data, response) {
  this.setIndexes(
    data.length,
    data.length + data.start,
    response.pagination.last_indexes
  );
};

const defaultOpts = {
  serverSide: true,
  searching: false,
  lengthMenu: [30, 50, 100],
  responsive: { details: false },
  language: {
    lengthMenu: 'Results per page: _MENU_'
  },
  pagingType: 'simple',
  title: null,
  dom: browseDOM,
  error400Message:
    '<strong>We had trouble processing your request</strong><br>' +
    'Please try again. If you still have trouble, ' +
    '<button class="js-filter-feedback">let us know</button>'
};

const defaultCallbacks = {
  afterRender: function() {} //eslint-disable-line no-empty-function
};

/**
 * The FEC's class of DataTable (the `_FEC` suffix is to differentiate between
 * datatables v1's '.Datatable' jQuery plugin and
 * datatables v2's official DataTable object.
 * @param {*} selector
 * @param {*} opts
 */
export function DataTable_FEC(selector, opts) {
  opts = opts || {};
  this.$body = $(selector);
  this.opts = _extend({}, defaultOpts, { ajax: this.fetch.bind(this) }, opts);
  this.callbacks = _extend({}, defaultCallbacks, opts.callbacks);
  this.xhr = null;
  this.fetchContext = null;
  this.hasWidgets = null;
  this.filters = null;
  this.$widgets = $(DATA_WIDGETS);
  this.initFilters();

  const Paginator = this.opts.paginator || OffsetPaginator;
  this.paginator = new Paginator();

  if (!this.opts.tableSwitcher) {
    this.initTable();
  }

  if (this.opts.useExport) {
    $(document.body).on('download:countChanged', this.refreshExport.bind(this));
  }

  $(document.body).on('table:switch', this.handleSwitch.bind(this));
}

DataTable_FEC.prototype.initTable = function() {
  this.api = this.$body.DataTable(this.opts);
  DataTable_FEC.registry[this.$body.attr('id')] = this;

  if (!_isEmpty(this.filterPanel)) {
    updateOnChange(this.filterSet.$body, this.api);
    updateQuery(this.filterSet.serialize(), this.filterSet.fields);
  }

  this.$body.css('width', '100%');
  this.$body.find('tbody').addClass('js-panel-toggle');
  // If there's a length select, add the id to the label
  if ($('#results_length').length) {
    $('#results_length label').attr('for', 'results-length');
    $('#results_length select').attr('id', 'results-length');
  }
};

// Get the full querystring on-load
DataTable_FEC.prototype.getVars = function() {
  const initialParams = window.location.search;
  return initialParams.toString();
};

// Parse querystring's parameters and return an object
DataTable_FEC.prototype.parseParams = function(querystring){
    // Parse query string
    const params = new URLSearchParams(querystring);
    const obj = {};
    // Iterate over all keys
    for (const key of params.keys()) {
        if (params.getAll(key).length > 1) {
         obj[key] = params.getAll(key);
        } else {
            obj[key] = params.get(key);
        }
     }
    return obj;
};

// Activate checkbox filter fields that filterSet.js cannot find to activate (see committee_types.jinja)
DataTable_FEC.prototype.checkFromQuery = function(){
    // Create a variable representing the querystring key/vals as an object
    const queryFields = this.parseParams(this.getVars());
    // Create an array to hold checkbox html elements
    const queryBoxes = [];
    // Iterate the key/vals of queryFields
    $.each(queryFields, function(key, val){
      // Create a variable for matching checkbox
      let queryBox;
      // Handle val as array
      if (Array.isArray(val)) {
          // iterate the val array
          val.forEach(i => {
            // Find matching checkboxes
            queryBox = $(`input:checkbox[name="${key}"][value="${i}"]`);
            // Push matching checkboxes to the  array
            queryBoxes.push(queryBox);
          });
        }
        // Handle singular val
        else {
          // find matching checkbox
          queryBox = $(`input:checkbox[name="${key}"][value="${val}"]`);
          // Push matching checkbox to the array
          queryBoxes.push(queryBox);
         }
      });

    // Put 0-second, set-timeout on receipts/disbursements datatables so checkoxes are availale to check...
    // ...after the two filter panels are loaded
    if ('data_type' in queryFields){
    setTimeout(function() {
      // Iterate the array of matching checkboxes(queryBoxes), check them and fire change()...
      // ...if they are not already checked
      for (let box of queryBoxes) {
        if (!($(box).is(':checked'))) {
              $(box).prop('checked', true).change(); // TODO: jQuery deprecation
        }
       }
      }, 0);

     // No Set-timeout needed on datatables without two filter panels...
     // ... Also it causes a noticeable intermittent time-lag while populating table on these pages
     } else {
      // Iterate the array of matching checkboxes(queryBoxes), check them and fire change()...
      // ...if they are not already checked
      for (let box of queryBoxes) {
        if (!($(box).is(':checked'))) {
              $(box).prop('checked', true).change(); // TODO: jQuery deprecation
        }
       }
      }

  // Remove the loading label GIF on the filter panel
  $('button.is-loading, label.is-loading').removeClass('is-loading');
};

DataTable_FEC.prototype.initFilters = function() {
  // Set `this.filterSet` before instantiating the nested `DataTable` so that
  // filters are available on fetching initial data
  if (this.opts.useFilters) {
    const tagList = new TagList({
      resultType: 'results',
      showResultCount: true,
      tableTitle: this.opts.title
      // We're using the table title to decide whether to clear or reset filters.
      // This is a temporary solution to clear filters and not break pages/tables that still require two-year restrictions
      // TODO
    });
    this.$widgets.find('.js-filter-tags').prepend(tagList.$body);
    this.filterPanel = new FilterPanel();
    this.filterSet = this.filterPanel.filterSet;

    // Activate checkbox filters missed by above logic (specifically committee checkbox filters)
    this.checkFromQuery();

    $(window).on('popstate', this.handlePopState.bind(this));
  }
};

DataTable_FEC.prototype.refreshExport = function() {
  if (this.opts.useExport && !this.opts.disableExport) {
    const numRows = this.api.context[0].fnRecordsTotal();
    if (numRows > DOWNLOAD_CAP) {
      this.disableExport({ message: DOWNLOAD_MESSAGES.recordCap });
    } else if (numRows === 0) {
      this.disableExport({ message: DOWNLOAD_MESSAGES.empty });
    } else if (this.isPending()) {
      this.disableExport({ message: DOWNLOAD_MESSAGES.pending });
    } else if (pendingCount() >= MAX_DOWNLOADS) {
      this.disableExport({ message: DOWNLOAD_MESSAGES.downloadCap });
    } else {
      this.enableExport();
    }
  } else if (this.opts.disableExport) {
    this.disableExport({ message: DOWNLOAD_MESSAGES.comingSoon });
  } else if (this.opts.aggregateExport) {
    // If it's an aggregate table, just enable the export
    this.enableExport();
  }
};

DataTable_FEC.prototype.destroy = function() {
  this.api.destroy();
  delete DataTable_FEC.registry[this.$body.attr('id')];
};

DataTable_FEC.prototype.handlePopState = function() {
  this.filterSet.activateAll();
  const filters = this.filterSet.serialize();
  if (!_isEqual(filters, this.filters)) {
    this.api.ajax.reload();
  }
};

DataTable_FEC.prototype.ensureWidgets = function() {
  if (this.hasWidgets) {
    return;
  }
  this.$processing = $('<div class="overlay is-loading"></div>').hide();
  this.$body.before(this.$processing);

  if (this.opts.useExport) {
    this.$exportWidget = $(exportWidgetTemplate({ title: this.opts.title }));
    this.$widgets.prepend(this.$exportWidget);
    this.$exportButton = $('.js-export');
    this.$exportMessage = $('.js-export-message');

    if (!isLargeScreen() && this.filterPanel) {
      this.$exportWidget.after(this.filterPanel.$body);
    }
  }

  if (this.opts.disableExport) {
    this.disableExport({ message: DOWNLOAD_MESSAGES.comingSoon });
  }

  if (this.opts.aggregateExport || this.opts.singleEntityItemizedExport) {
    this.$exportButton = $(
      '[data-export-for="' + this.$body.data('type') + '"]'
    );
  }

  if (this.opts.singleEntityItemizedExport) {
    this.$exportMessage = $(
      '[data-export-message-for="' + this.$body.data('type') + '"]'
    );
  }

  this.hasWidgets = true;
};

DataTable_FEC.prototype.disableExport = function(opts) {
  this.$exportButton.addClass('is-disabled');
  this.$exportButton.off('click');

  if (this.$exportMessage) {
    this.$exportMessage.html(opts.message);
    this.$exportMessage.attr('aria-hidden', 'false');
  }
};

DataTable_FEC.prototype.enableExport = function() {
  this.$exportButton.off('click');
  this.$exportButton.removeClass('is-disabled');
  this.$exportButton.on('click', this.export.bind(this));
  if (this.$exportMessage) {
    this.$exportMessage.attr('aria-hidden', 'true');
  }
};

DataTable_FEC.prototype.fetch = function(data, callback) {
  const self = this;
  self.ensureWidgets();

  if (self.filterSet && !self.filterSet.isValid) {
    return;
  } else if (self.filterSet && self.filterSet.isValid) {
    updateQuery(self.filterSet.serialize(), self.filterSet.fields);
    self.filters = self.filterSet.serialize();
    // Only limit for processed data in specific datatables
    // Individual contributions does not contain data_type and therefore has a separate check
    const limitOnPage =
      (self.filters.data_type == 'processed' &&
        ['Receipts', 'Disbursements', 'Independent expenditures'].indexOf(
          self.opts.title
        ) !== -1) ||
      self.opts.title === 'Individual contributions';

    // Number of allowed filters per field that is limited
    const MAX_FILTERS = 10;
    // Fields to limit
    const limitFields = {
      committee_id: `You&#39;re trying to search more than ${MAX_FILTERS} committees. Narrow your search to ${MAX_FILTERS} or fewer committees.`,
      candidate_id: `You&#39;re trying to search more than ${MAX_FILTERS} candidates. Narrow your search to ${MAX_FILTERS} or fewer candidates.`,
      contributor_name: `You&#39;re trying to search more than ${MAX_FILTERS} contributors. Narrow your search to ${MAX_FILTERS} or fewer contributors.`,
      recipient_name: `You&#39;re trying to search more than ${MAX_FILTERS} recipients. Narrow your search to ${MAX_FILTERS} or fewer recipients.`,
      contributor_zip: `You&#39;re trying to search more than ${MAX_FILTERS} ZIP codes. Narrow your search to ${MAX_FILTERS} or fewer ZIP codes.`,
      contributor_city: `You&#39;re trying to search more than ${MAX_FILTERS} cities. Narrow your search to ${MAX_FILTERS} or fewer cities.`,
      recipient_city: `You&#39;re trying to search more than ${MAX_FILTERS} cities. Narrow your search to ${MAX_FILTERS} or fewer cities.`,
      contributor_employer: `You&#39;re trying to search more than ${MAX_FILTERS} employers. Narrow your search to ${MAX_FILTERS} or fewer employers.`,
      contributor_occupation: `You&#39;re trying to search more than ${MAX_FILTERS} occupations. Narrow your search to ${MAX_FILTERS} or fewer occupations.`
    };
    // By default, filter limit is not hit
    let hitFilterLimit = false;
    const limitFieldKeys = Object.keys(limitFields);
    // By default, remove all errors icons on labels
    $('ul.dropdown__selected li label').removeClass('is-unsuccessful');
    limitFieldKeys.forEach(function(limitFieldKey) {
      // Assign unique id to each field's error messages
      const error_id = 'exceeded_' + limitFieldKey + '_limit';
      // Ensure fields are not disabled and all errors removed
      $('#' + limitFieldKey).removeClass('is-disabled-filter');
      var errorDiv = $('#' + error_id);
      errorDiv.remove();
      // Enable restricted fields on 400 error
      $('#two_year_filter_error').remove();
      $(
        '.restricted-fields input, .restricted-fields button, .restricted-fields legend'
      )
        .addClass('is-active-filter')
        .removeClass('is-disabled-filter');

      // Datatables that should have limits and reached the maxiumum
      // filter limit should display the field's error message
      // and disable that field's filter
      if (
        limitOnPage &&
        self.filters &&
        self.filters[limitFieldKey] &&
        self.filters[limitFieldKey].length > MAX_FILTERS
      ) {
        hitFilterLimit = true;
        $('#' + limitFieldKey).addClass('is-disabled-filter');
        $('#' + limitFieldKey + '-field ul.dropdown__selected')
          .last()
          .append(
            '<div id="' +
              error_id +
              '" class="message filter__message message--error">' +
              '<p>' +
              limitFields[limitFieldKey] +
              '</p>' +
              '</div>'
          );
        // Expand any accordions with an error message
        // For fields that have the error, add an error icon next to checkbox labels
        errorDiv = $('#' + error_id);
        if (errorDiv.length > 0) {
          errorDiv
            .closest('.accordion__content')
            .prev()
            .attr('aria-expanded', 'true');
          errorDiv.closest('.accordion__content').attr('aria-hidden', 'false');
          errorDiv.closest('.accordion__content').css('display', 'block');
          errorDiv
            .siblings()
            .children('label')
            .addClass('is-unsuccessful');
        }
      }
    });
    if (hitFilterLimit) {
      return;
    }

    // If 24- and 48-Hour report is selected, set the filing form to F24.
    // Otherwise, it's a regularly scheduled report, keep the filing
    // form as F3X
    if (self.filters && self.filters.filing_form) {
      const F3X_index = self.filters.filing_form.indexOf('F3X');
      if (self.filters.is_notice == 'true' && F3X_index > -1) {
        self.filters.filing_form[F3X_index] = 'F24';
      }
    }

    // Regularly scheduled reports only have current versions
    // Therefore, we need to check current version by default
    // and disable changes.
    if (
      self.filters &&
      self.filters.data_type == 'processed' &&
      self.filters.is_notice == 'false'
    ) {
      self.filters.most_recent = 'true';
      $('#most_recent_true_processed').prop('checked', true);
      $(
        '#version_processed legend, #version_processed li, #version_processed label'
      )
        .removeClass('is-active-filter')
        .addClass('is-disabled-filter');
    } else if (
      self.filters &&
      self.filters.data_type == 'processed' &&
      self.filters.is_notice == 'true'
    ) {
      $(
        '#version_processed legend, #version_processed li, #version_processed label'
      ).removeClass('is-disabled-filter');
    }
  }

  const url = self.buildUrl(data);
  self.$processing.show();
  if (self.xhr) {
    self.xhr.abort();
  }
  self.fetchContext = {
    data: data,
    callback: callback
  };
  self.xhr = $.getJSON(url);
  self.xhr.done(self.fetchSuccess.bind(self));
  self.xhr.fail(self.fetchError.bind(self));

  self.xhr.always(function() {
    self.$processing.hide();
  });
};

DataTable_FEC.prototype.export = function() {
  const url = this.buildUrl(this.api.ajax.params(), false, true);
  download(url, false, true);
  this.disableExport({ message: DOWNLOAD_MESSAGES.pending });
};

DataTable_FEC.prototype.isPending = function() {
  const url = this.buildUrl(this.api.ajax.params(), false);
  return isPending(url);
};

DataTable_FEC.prototype.buildUrl = function(data, paginate, download) {
  let query = _extend(
    { sort_hide_null: false, sort_nulls_last: true }, // eslint-disable-line camelcase
    this.filters || {}
  );
  paginate = typeof paginate === 'undefined' ? true : paginate;
  query.sort = mapSort(data.order, this.opts.columns);

  if (paginate) {
    query = _extend(query, this.paginator.mapQuery(data, query));
  }
  if (download) {
    query = _extend(query, {
      api_key: window.DOWNLOAD_API_KEY
    });
  }

  return buildUrl(
    this.opts.path,
    _extend({}, query, this.opts.query || {})
  );
};

DataTable_FEC.prototype.fetchSuccess = function(resp) {
  this.paginator.handleResponse(this.fetchContext.data, resp);
  this.fetchContext.callback(mapResponse(resp));
  this.callbacks.afterRender(this.api, this.fetchContext.data, resp);
  this.newCount = getCount(resp);
  this.refreshExport();

  const changeCount = this.newCount - this.currentCount;

  const countHTML =
    this.newCount > 0 && this.newCount <= 500000
      ? '<span class="tags__count">' +
        this.newCount.toLocaleString('en-US') +
        '</span>'
      : this.newCount > 500000
      ? 'about <span class="tags__count">' +
        this.newCount.toLocaleString('en-US') +
        '</span>'
      : '<span class="tags__count">0</span>';
  this.$widgets.find('.js-count').html(countHTML);

  filterSuccessUpdates(changeCount);

  if (this.opts.hideEmpty) {
    this.hideEmpty(resp);
  }

  this.currentCount = this.newCount;

  if (this.opts.hideColumns) {
    this.api.columns().visible(true);
    this.api.columns(this.opts.hideColumns).visible(false);
  }
};

DataTable_FEC.prototype.fetchError = function(jqXHR, textStatus) {
  const self = this;
  // Default error message that occurs most likely due to timeout
  let errorMessage =
    '<div id="two_year_filter_error" class="message filter__message message--error">' +
    self.opts.error400Message +
    '</div>';
  if (textStatus == 'abort') {
    // Pending message occurs when the previous query was cancelled due to
    // the user adding or removing filters
    errorMessage =
      '<div class="filter__message filter__message--delayed"><strong>Just a moment while we process your new request. You are searching a large dataset.</strong></div>';
  } else if (jqXHR) {
    if (jqXHR.status == 400) {
      $('#two_year_transaction_period-dropdown').attr('aria-hidden', 'true');
      $('.restricted-fields .dropdown .dropdown__button ').removeClass(
        'is-active'
      );
      // Disable restricted fields on 400 error
      $(
        '.restricted-fields input, .restricted-fields button, .restricted-fields legend'
      )
        .removeClass('is-active-filter')
        .addClass('is-disabled-filter');
    }
  }
  $('.filter__message').remove();

  if (
    $(updateChangedEl)
      .parent()
      .hasClass('range__input')
  ) {
    $(updateChangedEl)
      .closest('.range')
      .after($(errorMessage));
  } else if (
    $(updateChangedEl).attr('type') === 'text' &&
    $(updateChangedEl).hasClass('tt-input') === false
  ) {
    $(updateChangedEl)
      .parent()
      .after($(errorMessage));
  } else {
    $('label.is-loading')
      .removeClass('is-loading')
      .addClass('is-unsuccessful')
      .after($(errorMessage))
      .hide()
      .fadeIn();
  }

  $('button.is-loading').removeClass('is-loading');

  self.$processing.hide();
};

/**
 * Replace a `DataTable` with placeholder text if no results found. Should only
 * be used with unfiltered tables, else tables may be destroyed on restrictive
 * filtering.
 */
DataTable_FEC.prototype.hideEmpty = function(response) {
  if (!response.pagination.count) {
    this.destroy();
    this.$body.before(missingTemplate(this.opts.hideEmptyOpts));
    this.$body.remove();
  }
};

DataTable_FEC.registry = {};

DataTable_FEC.defer = function($table, opts) {
  tabsOnShow($table, function() {
    new DataTable_FEC($table, opts);
  });
};

DataTable_FEC.prototype.handleSwitch = function(e, opts) {
  this.opts.hideColumns = opts.hideColumns;
  this.opts.disableExport = opts.disableExport;
  this.opts.path = opts.path;

  if (opts.paginator) {
    this.paginator = new opts.paginator();
  }

  this.filterSet.switchFilters(opts.dataType);

  if (!this.api) {
    this.initTable();
  }

  this.refreshExport();
};

/**
 * Used for…
 * @param {string} className - Selector text, including the leading period (ex: `.data-table` instead of `data-table`)
 * @param {Object} pageContext - The window.context data object
 * @param {string} pageContext.candidateID
 * @param {number} pageContext.cycle
 * @param {number[]} pageContext.cycles
 * @param {boolean} pageContext.electionFull
 * @param {string} pageContext.name - Candidate name LAST, FIRST
 * @param {string} pageContext.timePeriod - In the format of `2023-2024`
 * @param {Object} options - spendingTableOpts from {@link /fec/fec/static/js/pages/elections.js}
 */
export function initSpendingTables(className, pageContext, options) {
  $(className).each(function(index, table) {
    const $table = $(table);
    const dataType = $table.attr('data-type');
    const opts = options[dataType];
    if (opts) {
      DataTable_FEC.defer($table, {
        autoWidth: false,
        path: opts.path,
        query: filterNull(pageContext.election),
        columns: opts.columns,
        order: opts.order,
        dom: simpleDOM,
        pagingType: 'simple',
        lengthChange: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        hideEmpty: true,
        useExport: true,
        singleEntityItemizedExport: true,
        hideEmptyOpts: {
          dataType: opts.title,
          name: 'this election',
          timePeriod: pageContext.timePeriod
        }
      });
    }
  });
}

function refreshTables(e, pageContext) {
  const $comparison = $('#comparison');
  const selected = $comparison
    .find('input[type="checkbox"]:checked')
    .map(function(_, input) {
      const $input = $(input);
      return {
        candidate_id: $input.attr('data-id'), // eslint-disable-line camelcase
        candidate_name: $input.attr('data-name') // eslint-disable-line camelcase
      };
    });

  if (selected.length > 0) {
    drawContributionsBySizeTable(selected, pageContext);
    drawContributionsByStateTable(selected, pageContext);
  }

  if (e) {
    $(e.target)
      .next('label')
      .addClass('is-loading');

    setTimeout(function() {
      $comparison
        .find('.is-loading')
        .removeClass('is-loading')
        .addClass('is-successful');
    }, LOADING_DELAY);

    setTimeout(function() {
      $comparison.find('.is-successful').removeClass('is-successful');
    }, SUCCESS_DELAY);
  }
}

export function drawComparison(results, pageContext) {
  let $comparison = $('#comparison');
  const context = { selected: results.slice(0, 10), options: results.slice(10) };
  $comparison.prepend(comparisonTemplate(context));
  new Dropdown($comparison.find('.js-dropdown'));
  $comparison.on('change', 'input[type="checkbox"]', function(e) {
    refreshTables(e, pageContext);
  });
  refreshTables(null, pageContext);
}

function mapSize(response, primary) {
  let groups = {};
  _each(response.results, function(result) {
    groups[result.candidate_id] = groups[result.candidate_id] || {};
    groups[result.candidate_id][result.size] = result.total;
  });
  return _map(_pairs(groups), function(pair) {
    return _extend(pair[1], {
      candidate_id: pair[0], // eslint-disable-line camelcase
      candidate_name: primary[pair[0]].candidate_name // eslint-disable-line camelcase
    });
  });
}

function mapState(response) {
  let groups = {};
  _each(response.results, function(result) {
    groups[result.state] = groups[result.state] || {};
    groups[result.state][result.candidate_id] = result.total;
    groups[result.state].state_full = result.state_full; // eslint-disable-line camelcase
  });
  return _map(_pairs(groups), function(pair) {
    return _extend(pair[1], { state: pair[0] });
  });
}

function destroyTable($table) {
  if ($.fn.dataTable.isDataTable($table)) {
    let api = $table.DataTable();
    api.clear();
    api.destroy();
    $table.data('max', null);
  }
}

const drawTableOpts = {
  autoWidth: false,
  destroy: true,
  searching: false,
  serverSide: false,
  lengthChange: true,
  useExport: true,
  singleEntityItemizedExport: true,
  dom: simpleDOM,
  language: {
    lengthMenu: 'Results per page: _MENU_'
  },
  pagingType: 'simple'
};

// For election profile page "Individual contributions to candidates"
function drawContributionsBySizeTable(selected, pageContext) {
  const $table = $('table[data-type="by-size"]');
  const primary = _object(
    _map(selected, function(result) {
      return [result.candidate_id, result];
    })
  );
  // There are 5 "size" categories. No per_page cap on endpoint
  const perPage = 5 * selected.length;
  const query = {
    cycle: pageContext.election.cycle,
    candidate_id: _pluck(selected, 'candidate_id'), // eslint-disable-line camelcase
    per_page: perPage, // eslint-disable-line camelcase
    election_full: true // eslint-disable-line camelcase
  };
  const url = buildUrl(
    ['schedules', 'schedule_a', 'by_size', 'by_candidate'],
    query
  );
  $.getJSON(url).done(function(response) {
    const data = mapSize(response, primary);
    destroyTable($table);
    $table.dataTable(
      _extend(
        {
          autoWidth: false,
          data: data,
          columns: sizeColumns(pageContext),
          order: [[1, 'desc']]
        },
        drawTableOpts
      )
    );

    barsAfterRender(null, $table.DataTable());
  });
}

// For election profile page "Individual contributions to candidates"
function drawContributionsByStateTable(selected, pageContext) {
  const $table = $('table[data-type="by-state"]');
  const primary = _object(
    _map(selected, function(result) {
      return [result.candidate_id, result];
    })
  );
  // There are 61 "state" options. No per_page cap on endpoint
  const perPage = 61;// * selected.length;
  const query = {
    cycle: pageContext.election.cycle,
    candidate_id: _pluck(selected, 'candidate_id'), // eslint-disable-line camelcase
    per_page: perPage, // eslint-disable-line camelcase
    election_full: true // eslint-disable-line camelcase
  };
  const url = buildUrl(
    ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
    query
  );
  $.getJSON(url).done(function(response) {
    const data = mapState(response, primary);
    // Populate headers with correct text
    const headerLabels = ['State'].concat(_pluck(selected, 'candidate_name'));
    destroyTable($table);
    $table
      .find('thead tr')
      .empty()
      .append(
        _map(headerLabels, function(label) {
          return $('<th>').text(label);
        })
      );
    $table.dataTable(
      _extend(
        {
          autoWidth: false,
          data: data,
          columns: stateColumns(selected, pageContext),
          order: [[1, 'desc']],
          drawCallback: function() {
            barsAfterRender(null, this.api());
          }
        },
        drawTableOpts
      )
    );
  });
}
