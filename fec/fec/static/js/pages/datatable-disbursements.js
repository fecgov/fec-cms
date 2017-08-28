'use strict';

/* global document */

var $ = require('jquery');

var tables = require('../modules/tables');
var TableSwitcher = require('../modules/table-switcher').TableSwitcher;
var columns = require('../modules/columns');
var filtersEvent = require('../modules/filters-event');

var disbursementTemplate = require('../templates/disbursements.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Disbursements',
    path: ['schedules', 'schedule_b'],
    columns: columns.disbursements,
    paginator: tables.SeekPaginator,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(disbursementTemplate)
    }
  });

  new TableSwitcher('.js-table-switcher', {
    efiling: {
      path: ['schedules', 'schedule_b', 'efile'],
      dataType: 'efiling',
      hideColumns: '.hide-efiling',
      paginator: tables.OffsetPaginator
    },
    processed: {
      path: ['schedules', 'schedule_b'],
      dataType: 'processed',
      hideColumns: '.hide-processed',
      paginator: tables.SeekPaginator
    }
  }).init();

  filtersEvent.lineNumberFilters();
});
