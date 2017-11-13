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
var tablePanels = require('../modules/table-panels');


$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Audit reports',
    path: ['audit-case'],
    columns: columns.audit,
    order: [[1, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
 //     afterRender: tablePanels.renderauditPanel(false)
    }
  });
});
