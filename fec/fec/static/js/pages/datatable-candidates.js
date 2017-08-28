'use strict';

var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');
var tablePanels = require('../modules/table-panels');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Candidate',
    path: ['candidates'],
    columns: columns.candidates,
    order: [[6, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tablePanels.renderCandidatePanel(false)
    }
  });
});
