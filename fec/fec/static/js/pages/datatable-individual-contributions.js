
var tables = require('../modules/tables');
var columns = require('../modules/columns');

var donationTemplate = require('../templates/receipts.hbs');

  var $table = $('#results');
  new tables.DataTable($table, {
$(function() {
    autoWidth: false,
    title: 'Individual contributions',
    path: ['schedules', 'schedule_a'],
    query: { is_individual: true, sort_nulls_last: false },
    columns: columns.individualContributions,
    paginator: tables.SeekPaginator,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    error400Message:
      '<p>You&#39;re trying to search across multiple time periods. Filter by recipient name or ID, contributor details, or image number for results.</p>',
    callbacks: {
      afterRender: tables.modalRenderFactory(donationTemplate)
    }
  });
});
