'use strict';

/**
 * Loans datatable page
 * ---------------------
 * Schedule C shows loans to
 * the committee that are required to be disclosed.
 *
 */

var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');

var loansTemplate = require('../templates/loans.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Loans',
    path: ['schedules', 'schedule_c'],
    columns: columns.loans,
    order: [[2, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(loansTemplate)
    }
  });
});
