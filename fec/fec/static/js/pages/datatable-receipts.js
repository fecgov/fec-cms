'use strict';

var $ = require('jquery');

var tables = require('../modules/tables');
var TableSwitcher = require('../modules/table-switcher').TableSwitcher;
var columns = require('../modules/columns');
var filtersEvent = require('../modules/filters-event');

var donationTemplate = require('../templates/receipts.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Receipts',
    path: ['schedules', 'schedule_a'],
    columns: columns.receipts,
    paginator: tables.SeekPaginator,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(donationTemplate)
    }
  });

  new TableSwitcher('.js-table-switcher', {
    efiling: {
      path: ['schedules', 'schedule_a', 'efile'],
      dataType: 'efiling',
      hideColumns: '.hide-efiling',
      paginator: tables.OffsetPaginator
    },
    processed: {
      path: ['schedules', 'schedule_a'],
      dataType: 'processed',
      hideColumns: '.hide-processed',
      paginator: tables.SeekPaginator
    }
  }).init();

  filtersEvent.lineNumberFilters();
});
