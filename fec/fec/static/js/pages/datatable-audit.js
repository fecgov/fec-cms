'use strict';

/**
* audit datatable page
* ---------------------
* inital show all audit case.
*
*/

var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');
var tablePanels = require('../modules/table-panels');
var auditCategorySubcCategory = require('../modules/audit-category-sub-category');
var auditTags = require('../modules/audit_tags');


$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Audit reports',
    path: ['audit-case'],
    columns: columns.audit,
    order: [1, 'desc'],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
 //     afterRender: tablePanels.renderauditPanel(false)
    }
  });
});
