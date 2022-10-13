'use strict';

/**
 * pagingType documentation: https://datatables.net/reference/option/pagingType
 */

var $ = require('jquery');
var _ = require('underscore');

require('datatables.net');
require('datatables.net-responsive');

var accessibility = require('./accessibility');
var columnHelpers = require('./column-helpers');
var download = require('./download');
var dropdown = require('./dropdowns');
var helpers = require('./helpers');
var tabs = require('../vendor/tablist');
var urls = require('./urls');

// Widgets
var filterTags = require('../modules/filters/filter-tags');
var FilterPanel = require('../modules/filters/filter-panel').FilterPanel;

var comparisonTemplate = require('../templates/comparison.hbs');
var exportWidgetTemplate = require('../templates/tables/exportWidget.hbs');
var missingTemplate = require('../templates/tables/noData.hbs');

var simpleDOM = 't<"results-info"lpi>';
var browseDOM = '<"panel__main"t>' + '<"results-info"lpi>';
// Source documentation for these two ^ :
// https://datatables.net/reference/option/dom

// To change the number of items in the "Showing __ of __ entries" blocks.
// $.fn.DataTable.ext.pager.numbers_length = 5;
// Must be an odd number

var DOWNLOAD_CAP = 500000;
var downloadCapFormatted = helpers.formatNumber(DOWNLOAD_CAP);
var MAX_DOWNLOADS = 5;
var DOWNLOAD_MESSAGES = {
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

var DATA_WIDGETS = '.js-data-widgets';

// id for the last changed element on form for status update
var updateChangedEl;
var messageTimer;

// Only show table after draw
$(document.body).on('draw.dt', function() {
  $('.dataTable tbody').attr('role', 'rowgroup');
  $('.dataTable tbody td:first-child').attr('scope', 'row');
});

function yearRange(first, last) {
  if (first === last) {
    return first;
  } else {
    return first.toString() + ' - ' + last.toString();
  }
}

function getCycle(value, meta) {
  var dataTable = DataTable.registry[meta.settings.sTableId];
  var filters = dataTable && dataTable.filters;

  if (filters && filters.cycle) {
    var cycles = _.intersection(
      _.map(filters.cycle, function(cycle) {
        return parseInt(cycle);
      }),
      value
    );
    return cycles.length ? { cycle: _.max(cycles) } : {};
  } else {
    return {};
  }
}

function mapSort(order, column) {
  return _.map(order, function(item) {
    var name = column[item.column].data;
    if (item.dir === 'desc') {
      name = '-' + name;
    }
    return name;
  });
}

function getCount(response) {
  var pagination_count = response.pagination.count; // eslint-disable-line camelcase

  if (response.pagination.count > 500000) {
    pagination_count = Math.round(response.pagination.count / 1000) * 1000; // eslint-disable-line camelcase
  }

  return pagination_count; // eslint-disable-line camelcase
}

function mapResponse(response) {
  var pagination_count = getCount(response); // eslint-disable-line camelcase

  return {
    recordsTotal: pagination_count, // eslint-disable-line camelcase
    recordsFiltered: pagination_count, // eslint-disable-line camelcase
    data: response.results
  };
}

function identity(value) {
  return value;
}

var MODAL_TRIGGER_CLASS = 'js-panel-trigger';
var MODAL_TRIGGER_HTML =
  '<button class="js-panel-button button--panel">' +
  '<span class="u-visually-hidden">Toggle details</span>' +
  '</button>';

function modalRenderRow(row) {
  row.classList.add(MODAL_TRIGGER_CLASS, 'row--has-panel');
}

function modalRenderFactory(template, fetch) {
  var callback;
  fetch = fetch || identity;

  return function(api, data, response) {
    var $table = $(api.table().node());
    var $modal = $('#datatable-modal');
    var $main = $table.closest('.panel__main');
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
        var $row = $(e.currentTarget);
        var $target = $(e.target);
        if ($target.is('a')) {
          return true;
        }
        if (!$target.closest('td').hasClass('dataTables_empty')) {
          var index = api.row($row).index();
          $.when(fetch(response.results[index])).done(function(fetched) {
            $modal.find('.js-panel-content').html(template(fetched));
            $modal.attr('aria-hidden', 'false');
            $row.siblings().toggleClass('row-active', false);
            $row.toggleClass('row-active', true);
            $('body').toggleClass('panel-active', true);
            accessibility.restoreTabindex($modal);
            var hideColumns = api.columns('.hide-panel');
            hideColumns.visible(false);

            // Populate the pdf button if there is one
            if (fetched.pdf_url) {
              $modal.find('.js-pdf_url').attr('href', fetched.pdf_url);
            } else {
              $modal.find('.js-pdf_url').remove();
            }

            // Set focus on the close button
            $('.js-hide').focus();

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
  $('.row-active .js-panel-button').focus();
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

  accessibility.removeTabindex($modal);
}

function barsAfterRender(template, api) {
  var $table = $(api.table().node());
  var $cols = $table.find('div[data-value]');

  // Store the initial max value on the table element just once
  // Set widths of bars relative to the global max,
  // rather than the max of each draw
  if (!$table.data('max')) {
    var values = $cols.map(function(idx, each) {
      return parseFloat(each.getAttribute('data-value'));
    });
    var max = _.max(values);
    $table.data('max', max);
  }

  var tableMax = $table.data('max');
  $cols.after(function() {
    var value = $(this).attr('data-value');
    var width = (100 * parseFloat(value)) / tableMax;
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

/**
 * Adds a 'change' listener to `$form[0] input` and `$form[0] select`
 * @param {jQuery} $form - jQuery object of the selector for the div#[type]-filters.filters__content
 * @param {_Api} api - Object in the form of {context: Array(1), selector: {…}, tables: ƒ, table: ƒ, draw: ƒ,…}
 */
function updateOnChange($form, api) {
  /**
   * @param {jQuery.Event} e
   * @param {CustomEvent} e.originalEvent
   * @param {object} e.originalEvent.detail
   */
  function onChange(e) {
    e.preventDefault();
    hidePanel(api, $('#datatable-modal'));
    api.ajax.reload();

    updateChangedEl = e.target;
  }
  $form.on('change', 'input,select', _.debounce(onChange, 250));
}

/**
 * Called by @fetchSuccess
 * @param {*} changeCount -
 */
function filterSuccessUpdates(changeCount) {
  // on filter change update:
  // - loading/success status
  // - count change message

  // check if there is a changed form element
  if (updateChangedEl) {
    var $label;
    var $elm = $(updateChangedEl);
    var type = $elm.attr('type');
    var message = '';
    var filterAction = '';
    var filterResult = '';
    var $filterMessage = $('.filter__message');

    $('.is-successful').removeClass('is-successful');
    $('.is-unsuccessful').removeClass('is-unsuccessful');
    // Enable all restricted fields on success
    $(
      '.restricted-fields input, .restricted-fields button, .restricted-fields legend'
    )
      .removeClass('is-disabled-filter')
      .addClass('is-active-filter');

    // Reenable committee ID autosuggest input
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
      // autosuggest
      if ($elm.hasClass('as-input')) {
        // show message after generated checkbox (last item in list)
        $label = $('[data-filter="autosuggest"] li').last();
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
    }, helpers.SUCCESS_DELAY);
  }
}

function OffsetPaginator() {} //eslint-disable-line no-empty-function

OffsetPaginator.prototype.mapQuery = function(data) {
  return {
    per_page: data.length, // eslint-disable-line camelcase
    page: Math.floor(data.start / data.length) + 1
  };
};

OffsetPaginator.prototype.handleResponse = function() {}; //eslint-disable-line no-empty-function

function SeekPaginator() {
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
  if (!_.isEqual(query, this.query)) {
    this.query = _.clone(query);
    this.clearIndexes();
  }
  var indexes = this.getIndexes(data.length, data.start);
  return _.extend(
    { per_page: data.length }, // eslint-disable-line camelcase
    _.chain(Object.keys(indexes))
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

var defaultOpts = {
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

var defaultCallbacks = {
  afterRender: function() {} //eslint-disable-line no-empty-function
};

function DataTable(selector, opts) {
  opts = opts || {};
  this.$body = $(selector);
  this.opts = _.extend({}, defaultOpts, { ajax: this.fetch.bind(this) }, opts);
  this.callbacks = _.extend({}, defaultCallbacks, opts.callbacks);
  this.xhr = null;
  this.fetchContext = null;
  this.hasWidgets = null;
  this.filters = null;
  this.$widgets = $(DATA_WIDGETS);
  this.initFilters();

  var Paginator = this.opts.paginator || OffsetPaginator;
  this.paginator = new Paginator();

  if (!this.opts.tableSwitcher) {
    this.initTable();
  }

  if (this.opts.useExport) {
    $(document.body).on('download:countChanged', this.refreshExport.bind(this));
  }

  $(document.body).on('table:switch', this.handleSwitch.bind(this));
}

DataTable.prototype.initTable = function() {
  this.api = this.$body.DataTable(this.opts);
  DataTable.registry[this.$body.attr('id')] = this;

  if (!_.isEmpty(this.filterPanel)) {
    updateOnChange(this.filterSet.$body, this.api);
    urls.updateQuery(this.filterSet.serialize(), this.filterSet.fields);
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
DataTable.prototype.getVars = function () {

  var initialParams = window.location.search;
  return initialParams.toString();
};

// Parse querystring's parameters and return an object
DataTable.prototype.parseParams = function(querystring){
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

// Activate checkbox filter fields that filterSet.js cannot find to activate (see commitee_types.jinja)
DataTable.prototype.checkFromQuery = function(){
    // Create a variable representing the querysring key/vals as an object
    var queryFields = this.parseParams(this.getVars());
    // Create an array to hold checkbox html elements
      var queryBoxes = [];
    // Iterate the key/vals of queryFields
    $.each(queryFields, function(key, val){
      // Create a variable for matching checkbox
      let queryBox;
      // Handle val as array
      if ($.isArray(val)){
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
              $(box).prop('checked', true).change();
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
              $(box).prop('checked', true).change();
        }
       }
      }

  // Remove the loading label GIF on the filter panel
  $('button.is-loading, label.is-loading').removeClass('is-loading');
};

DataTable.prototype.initFilters = function() {
  // Set `this.filterSet` before instantiating the nested `DataTable` so that
  // filters are available on fetching initial data
  if (this.opts.useFilters) {
    var tagList = new filterTags.TagList({
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

DataTable.prototype.refreshExport = function() {
  if (this.opts.useExport && !this.opts.disableExport) {
    var numRows = this.api.context[0].fnRecordsTotal();
    if (numRows > DOWNLOAD_CAP) {
      this.disableExport({ message: DOWNLOAD_MESSAGES.recordCap });
    } else if (numRows === 0) {
      this.disableExport({ message: DOWNLOAD_MESSAGES.empty });
    } else if (this.isPending()) {
      this.disableExport({ message: DOWNLOAD_MESSAGES.pending });
    } else if (download.pendingCount() >= MAX_DOWNLOADS) {
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

DataTable.prototype.destroy = function() {
  this.api.destroy();
  delete DataTable.registry[this.$body.attr('id')];
};

DataTable.prototype.handlePopState = function() {
  this.filterSet.activateAll();
  var filters = this.filterSet.serialize();
  if (!_.isEqual(filters, this.filters)) {
    this.api.ajax.reload();
  }
};

DataTable.prototype.ensureWidgets = function() {
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

    if (!helpers.isLargeScreen() && this.filterPanel) {
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

DataTable.prototype.disableExport = function(opts) {
  this.$exportButton.addClass('is-disabled');
  this.$exportButton.off('click');

  if (this.$exportMessage) {
    this.$exportMessage.html(opts.message);
    this.$exportMessage.attr('aria-hidden', 'false');
  }
};

DataTable.prototype.enableExport = function() {
  this.$exportButton.off('click');
  this.$exportButton.removeClass('is-disabled');
  this.$exportButton.on('click', this.export.bind(this));
  if (this.$exportMessage) {
    this.$exportMessage.attr('aria-hidden', 'true');
  }
};

/**
 * @param {object} data - Object in the form of {draw: 1, columns: Array(7), order: Array(1), start: 0, length: 30,…}
 * @param {function} callback
 * @returns null if we hit the filter limit or !self.filterSet.isValid
 */
DataTable.prototype.fetch = function(data, callback) {
  var self = this;
  self.ensureWidgets();

  if (self.filterSet && !self.filterSet.isValid) {
    return;
  } else if (self.filterSet && self.filterSet.isValid) {
    urls.updateQuery(self.filterSet.serialize(), self.filterSet.fields);
    self.filters = self.filterSet.serialize();
    // Only limit for processed data in specific datatables
    // Individual contributions does not contain data_type and therefore has a separate check
    var limitOnPage =
      (self.filters.data_type == 'processed' &&
        ['Receipts', 'Disbursements', 'Independent expenditures'].indexOf(
          self.opts.title
        ) !== -1) ||
      self.opts.title === 'Individual contributions';

    // Number of allowed filters per field that is limited
    const MAX_FILTERS = 10;
    // Fields to limit
    var limitFields = {
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
    var hitFilterLimit = false;
    var limitFieldKeys = Object.keys(limitFields);
    // By default, remove all errors icons on labels
    $('ul.dropdown__selected li label').removeClass('is-unsuccessful');
    limitFieldKeys.forEach(function(limitFieldKey) {
      // Assign unique id to each field's error messages
      var error_id = 'exceeded_' + limitFieldKey + '_limit';
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
      var F3X_index = self.filters.filing_form.indexOf('F3X');
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

  var url = self.buildUrl(data);
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

DataTable.prototype.export = function() {
  var url = this.buildUrl(this.api.ajax.params(), false, true);
  download.download(url, false, true);
  this.disableExport({ message: DOWNLOAD_MESSAGES.pending });
};

DataTable.prototype.isPending = function() {
  var url = this.buildUrl(this.api.ajax.params(), false);
  return download.isPending(url);
};

DataTable.prototype.buildUrl = function(data, paginate, download) {
  var query = _.extend(
    { sort_hide_null: false, sort_nulls_last: true }, // eslint-disable-line camelcase
    this.filters || {}
  );
  paginate = typeof paginate === 'undefined' ? true : paginate;
  query.sort = mapSort(data.order, this.opts.columns);

  if (paginate) {
    query = _.extend(query, this.paginator.mapQuery(data, query));
  }
  if (download) {
    query = _.extend(query, {
      api_key: window.DOWNLOAD_API_KEY
    });
  }

  return helpers.buildUrl(
    this.opts.path,
    _.extend({}, query, this.opts.query || {})
  );
};

/**
 *
 * @param {object} resp - Object in the form of {api_version: '1.0', pagination: {…}, results: Array(30)}
 */
DataTable.prototype.fetchSuccess = function(resp) {
  this.paginator.handleResponse(this.fetchContext.data, resp);
  this.fetchContext.callback(mapResponse(resp));
  this.callbacks.afterRender(this.api, this.fetchContext.data, resp);
  this.newCount = getCount(resp);
  this.refreshExport();

  var changeCount = this.newCount - this.currentCount;

  var countHTML =
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

/**
 *
 * @param {jQuery.jqXHR} jqXHR -
 * @param {*} textStatus -
 */
DataTable.prototype.fetchError = function(jqXHR, textStatus) {
  var self = this;
  // Default error message that occurs most likely due to timeout
  var errorMessage =
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
    $(updateChangedEl).hasClass('as-input') === false
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
DataTable.prototype.hideEmpty = function(response) {
  if (!response.pagination.count) {
    this.destroy();
    this.$body.before(missingTemplate(this.opts.hideEmptyOpts));
    this.$body.remove();
  }
};

DataTable.registry = {};

DataTable.defer = function($table, opts) {
  tabs.onShow($table, function() {
    new DataTable($table, opts);
  });
};

DataTable.prototype.handleSwitch = function(e, opts) {
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

function initSpendingTables(className, context, options) {
  $(className).each(function(index, table) {
    var $table = $(table);
    var dataType = $table.attr('data-type');
    var opts = options[dataType];
    if (opts) {
      DataTable.defer($table, {
        autoWidth: false,
        path: opts.path,
        query: helpers.filterNull(context.election),
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
          timePeriod: context.timePeriod
        }
      });
    }
  });
}

/**
 * @param {*} e -
 * @param {*} context -
 */
function refreshTables(e, context) {
  var $comparison = $('#comparison');
  var selected = $comparison
    .find('input[type="checkbox"]:checked')
    .map(function(_, input) {
      var $input = $(input);
      return {
        candidate_id: $input.attr('data-id'), // eslint-disable-line camelcase
        candidate_name: $input.attr('data-name') // eslint-disable-line camelcase
      };
    });

  if (selected.length > 0) {
    drawContributionsBySizeTable(selected, context);
    drawContributionsByStateTable(selected, context);
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
    }, helpers.LOADING_DELAY);

    setTimeout(function() {
      $comparison.find('.is-successful').removeClass('is-successful');
    }, helpers.SUCCESS_DELAY);
  }
}

/**
 * Called from @see /fec/fec/static/js/pages/elections.js `$(document).ready() $.getJSON(url).done()`
 * Adds 'change' listener to input[type="checkbox"]
 * Calls refreshTables()
 * @param {*} results -
 * @param {*} pageContext -
 */
function drawComparison(results, pageContext) {
  var $comparison = $('#comparison');
  var context = { selected: results.slice(0, 10), options: results.slice(10) };
  $comparison.prepend(comparisonTemplate(context));
  new dropdown.Dropdown($comparison.find('.js-dropdown'));
  $comparison.on('change', 'input[type="checkbox"]', function(e) {
    refreshTables(e, pageContext);
  });
  refreshTables(null, pageContext);
}

function mapSize(response, primary) {
  var groups = {};
  _.each(response.results, function(result) {
    groups[result.candidate_id] = groups[result.candidate_id] || {};
    groups[result.candidate_id][result.size] = result.total;
  });
  return _.map(_.pairs(groups), function(pair) {
    return _.extend(pair[1], {
      candidate_id: pair[0], // eslint-disable-line camelcase
      candidate_name: primary[pair[0]].candidate_name // eslint-disable-line camelcase
    });
  });
}

function mapState(response) {
  var groups = {};
  _.each(response.results, function(result) {
    groups[result.state] = groups[result.state] || {};
    groups[result.state][result.candidate_id] = result.total;
    groups[result.state].state_full = result.state_full; // eslint-disable-line camelcase
  });
  return _.map(_.pairs(groups), function(pair) {
    return _.extend(pair[1], { state: pair[0] });
  });
}

function destroyTable($table) {
  if ($.fn.dataTable.isDataTable($table)) {
    var api = $table.DataTable();
    api.clear();
    api.destroy();
    $table.data('max', null);
  }
}

var drawTableOpts = {
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
function drawContributionsBySizeTable(selected, context) {
  var $table = $('table[data-type="by-size"]');
  var primary = _.object(
    _.map(selected, function(result) {
      return [result.candidate_id, result];
    })
  );
  // There are 5 "size" categories. No per_page cap on endpoint
  var perPage = 5 * selected.length;
  var query = {
    cycle: context.election.cycle,
    candidate_id: _.pluck(selected, 'candidate_id'), // eslint-disable-line camelcase
    per_page: perPage, // eslint-disable-line camelcase
    election_full: true // eslint-disable-line camelcase
  };
  var url = helpers.buildUrl(
    ['schedules', 'schedule_a', 'by_size', 'by_candidate'],
    query
  );
  $.getJSON(url).done(function(response) {
    var data = mapSize(response, primary);
    destroyTable($table);
    $table.dataTable(
      _.extend(
        {
          autoWidth: false,
          data: data,
          columns: columnHelpers.sizeColumns(context),
          order: [[1, 'desc']]
        },
        drawTableOpts
      )
    );

    barsAfterRender(null, $table.DataTable());
  });
}

// For election profile page "Individual contributions to candidates"
function drawContributionsByStateTable(selected, context) {
  var $table = $('table[data-type="by-state"]');
  var primary = _.object(
    _.map(selected, function(result) {
      return [result.candidate_id, result];
    })
  );
  // There are 61 "state" options. No per_page cap on endpoint
  var perPage = 61 * selected.length;
  var query = {
    cycle: context.election.cycle,
    candidate_id: _.pluck(selected, 'candidate_id'), // eslint-disable-line camelcase
    per_page: perPage, // eslint-disable-line camelcase
    election_full: true // eslint-disable-line camelcase
  };
  var url = helpers.buildUrl(
    ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
    query
  );
  $.getJSON(url).done(function(response) {
    var data = mapState(response, primary);
    // Populate headers with correct text
    var headerLabels = ['State'].concat(_.pluck(selected, 'candidate_name'));
    destroyTable($table);
    $table
      .find('thead tr')
      .empty()
      .append(
        _.map(headerLabels, function(label) {
          return $('<th>').text(label);
        })
      );
    $table.dataTable(
      _.extend(
        {
          autoWidth: false,
          data: data,
          columns: columnHelpers.stateColumns(selected, context),
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

module.exports = {
  simpleDOM: simpleDOM,
  browseDOM: browseDOM,
  yearRange: yearRange,
  getCycle: getCycle,
  barsAfterRender: barsAfterRender,
  modalRenderRow: modalRenderRow,
  modalRenderFactory: modalRenderFactory,
  MODAL_TRIGGER_CLASS: MODAL_TRIGGER_CLASS,
  MODAL_TRIGGER_HTML: MODAL_TRIGGER_HTML,
  mapSort: mapSort,
  mapResponse: mapResponse,
  DataTable: DataTable,
  OffsetPaginator: OffsetPaginator,
  SeekPaginator: SeekPaginator,
  drawComparison: drawComparison,
  initSpendingTables: initSpendingTables
};
