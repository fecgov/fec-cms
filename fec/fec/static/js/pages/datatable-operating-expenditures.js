'use strict';

/* global document */

var $ = require('jquery');

var tables = require('../modules/tables');
var helpers = require('../modules/helpers');
var columns = require('../modules/columns');

var disbursementTemplate = require('../templates/disbursements.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    title: 'Operating expenditures',
    path: ['schedules', 'schedule_b'],
    // query: {filter for operating expenditures},
    columns: columns.disbursements,
    paginator: tables.SeekPaginator,
    order: [[3, 'desc']],
    useFilters: true,
    useExport: true,
    disableExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(disbursementTemplate)
    }
  });
});
