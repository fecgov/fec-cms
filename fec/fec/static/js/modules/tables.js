'use strict';

/* jshint camelcase: false */

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
var browseDOM = '<"panel__main"t>' + '<"results-info"lp>';

var DOWNLOAD_CAP = 500000;
var downloadCapFormatted = helpers.formatNumber(DOWNLOAD_CAP);
var MAX_DOWNLOADS = 5;
var DOWNLOAD_MESSAGES = {
  recordCap:
    'Use <a href="' +
    window.BASE_PATH +
    '/advanced?tab=bulk-data">' +
    'bulk data</a> to export more than ' +
    downloadCapFormatted +
    ' records.',
  downloadCap:
    'Each user is limited to ' +
    MAX_DOWNLOADS +
    ' exports at a time. This helps us keep things running smoothly.',
  empty: 'This table has no data to export.',
  comingSoon: 'Data exports for this page are coming soon.',
  pending: "You're already exporting this data set."
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
  // for audit data set, retrun real data result rows
  if (
    window.location.pathname === '/legal-resources/enforcement/audit-search/'
  ) {
    return response.pagination.count;
  }
  var pagination_count = response.pagination.count;

  if (response.pagination.count > 1000) {
    pagination_count = Math.round(response.pagination.count / 1000) * 1000;
  }

  return pagination_count;
}

function mapResponse(response) {
  var pagination_count = getCount(response);

  return {
    recordsTotal: pagination_count,
    recordsFiltered: pagination_count,
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

function updateOnChange($form, api) {
  function onChange(e) {
    e.preventDefault();
    hidePanel(api, $('#datatable-modal'));
    api.ajax.reload();

    updateChangedEl = e.target;
  }
  $form.on('change', 'input,select', _.debounce(onChange, 250));
}

function filterSuccessUpdates() {
  // on filter change update:
  // - loading/success status

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

    message = '<strong>' + filterAction + '</strong><br>' + filterResult;

    if ($filterMessage.length) {
      $filterMessage.fadeOut().remove();
      // if there is a message already, cancel existing message timeout
      // to avoid timing weirdness
      clearTimeout(messageTimer);
    }

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
      $('.is-successful').removeClass('is-successful');

      $('.filter__message').fadeOut(function() {
        $(this).remove();
      });

      $('.date-range-grid').fadeOut();
    }, helpers.SUCCESS_DELAY);
  }
}

function OffsetPaginator() {}

OffsetPaginator.prototype.mapQuery = function(data) {
  return {
    per_page: data.length,
    page: Math.floor(data.start / data.length) + 1
  };
};

OffsetPaginator.prototype.handleResponse = function() {};

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
    { per_page: data.length },
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
  dom: browseDOM
};

var defaultCallbacks = {
  afterRender: function() {}
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

DataTable.prototype.initFilters = function() {
  // Set `this.filterSet` before instantiating the nested `DataTable` so that
  // filters are available on fetching initial data
  if (this.opts.useFilters) {
    var tagList = new filterTags.TagList({
      resultType: 'results',
      showResultCount: true
    });
    this.$widgets.find('.js-filter-tags').prepend(tagList.$body);
    this.filterPanel = new FilterPanel();
    this.filterSet = this.filterPanel.filterSet;
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

DataTable.prototype.fetch = function(data, callback) {
  var self = this;
  self.ensureWidgets();
  if (self.filterSet && !self.filterSet.isValid) {
    return;
  } else if (self.filterSet && self.filterSet.isValid) {
    urls.updateQuery(self.filterSet.serialize(), self.filterSet.fields);
    self.filters = self.filterSet.serialize();
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
  var url = this.buildUrl(this.api.ajax.params(), false);
  download.download(url, false, true);
  this.disableExport({ message: DOWNLOAD_MESSAGES.pending });
};

DataTable.prototype.isPending = function() {
  var url = this.buildUrl(this.api.ajax.params(), false);
  return download.isPending(url);
};

DataTable.prototype.buildUrl = function(data, paginate) {
  var query = _.extend({ sort_hide_null: true }, this.filters || {});
  paginate = typeof paginate === 'undefined' ? true : paginate;
  query.sort = mapSort(data.order, this.opts.columns);

  if (paginate) {
    query = _.extend(query, this.paginator.mapQuery(data, query));
  }

  return helpers.buildUrl(
    this.opts.path,
    _.extend({}, query, this.opts.query || {})
  );
};

DataTable.prototype.fetchSuccess = function(resp) {
  this.paginator.handleResponse(this.fetchContext.data, resp);
  this.fetchContext.callback(mapResponse(resp));
  this.callbacks.afterRender(this.api, this.fetchContext.data, resp);
  this.refreshExport();

  filterSuccessUpdates();

  if (this.opts.hideEmpty) {
    this.hideEmpty(resp);
  }

  if (this.opts.hideColumns) {
    this.api.columns().visible(true);
    this.api.columns(this.opts.hideColumns).visible(false);
  }
};

DataTable.prototype.fetchError = function() {
  var self = this;
  var errorMessage =
    '<div class="filter__message filter__message--error">' +
    '<strong>We had trouble processing your request</strong><br>' +
    'Please try again. If you still have trouble, ' +
    '<button class="js-filter-feedback">let us know</button></div>';

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

function refreshTables(e, context) {
  var $comparison = $('#comparison');
  var selected = $comparison
    .find('input[type="checkbox"]:checked')
    .map(function(_, input) {
      var $input = $(input);
      return {
        candidate_id: $input.attr('data-id'),
        candidate_name: $input.attr('data-name')
      };
    });

  if (selected.length > 0) {
    drawSizeTable(selected, context);
    drawStateTable(selected, context);
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
      candidate_id: pair[0],
      candidate_name: primary[pair[0]].candidate_name
    });
  });
}

function mapState(response) {
  var groups = {};
  _.each(response.results, function(result) {
    groups[result.state] = groups[result.state] || {};
    groups[result.state][result.candidate_id] = result.total;
    groups[result.state].state_full = result.state_full;
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

function buildUrl(selected, context, path) {
  var query = {
    cycle: context.election.cycle,
    candidate_id: _.pluck(selected, 'candidate_id'),
    per_page: 0
  };

  return helpers.buildUrl(path, query);
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

function drawSizeTable(selected, context) {
  var $table = $('table[data-type="by-size"]');
  var primary = _.object(
    _.map(selected, function(result) {
      return [result.candidate_id, result];
    })
  );
  $.getJSON(
    buildUrl(selected, context, [
      'schedules',
      'schedule_a',
      'by_size',
      'by_candidate'
    ])
  ).done(function(response) {
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

function drawStateTable(selected, context) {
  var $table = $('table[data-type="by-state"]');
  var primary = _.object(
    _.map(selected, function(result) {
      return [result.candidate_id, result];
    })
  );
  $.getJSON(
    buildUrl(selected, context, [
      'schedules',
      'schedule_a',
      'by_state',
      'by_candidate'
    ])
  ).done(function(response) {
    var data = mapState(response, primary);
    // Populate headers with correct text
    var headerLabels = ['State'].concat(_.pluck(selected, 'candidate_name'));
    $table
      .find('thead tr')
      .empty()
      .append(
        _.map(headerLabels, function(label) {
          return $('<th>').text(label);
        })
      );
    destroyTable($table);
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
