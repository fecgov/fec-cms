'use strict';

var $ = require('jquery');

var tables = require('../modules/tables');
var TableSwitcher = require('../modules/table-switcher').TableSwitcher;
var columns = require('../modules/columns');
var filtersEvent = require('../modules/filters-event');

var allocatedFederalNonfederalDisbursementsTemplate = require('../templates/allocated-federal-nonfederal-disbursements.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Allocated federal/nonfederal disbursements',
    path: ['schedules', 'schedule_h4'],
    columns: columns.allocatedFederalNonfederalDisbursements,
    query: { sort_nulls_last: true },
    paginator: tables.SeekPaginator,
    order: [[6, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(allocatedFederalNonfederalDisbursementsTemplate)
    }
  });

  new TableSwitcher('.js-table-switcher', {
    efiling: {
      path: ['schedules', 'schedule_h4', 'efile'],
      dataType: 'efiling',
      hideColumns: '.hide-efiling',
      paginator: tables.OffsetPaginator
    },
    processed: {
      path: ['schedules', 'schedule_h4'],
      dataType: 'processed',
      hideColumns: '.hide-processed',
      paginator: tables.SeekPaginator
    }
  }).init();

  filtersEvent.lineNumberFilters();
});
