'use strict';

/**
 * Debts datatable page
 * ---------------------
 * Schedule D shows debts
 * to/from the committee that are required to be disclosed.
 *
 */

var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');

var debtsTemplate = require('../templates/debts.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Debts',
    path: ['schedules', 'schedule_d'],
    columns: columns.debts,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(debtsTemplate)
    }
  });
});
