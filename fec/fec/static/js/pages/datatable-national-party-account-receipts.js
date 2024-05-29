/**
 * National party account receipts datatable page
 */

var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');

var detailsPanelTemplate = require('../templates/national-party-account-receipts.hbs');

$(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'National party account receipts',
    path: ['national_party', 'schedule_a'],
    columns: columns.nationalPartyReceipts,
    order: [[3, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(detailsPanelTemplate)
    }
  });
});
