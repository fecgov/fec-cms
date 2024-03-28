
var tables = require('../modules/tables');
var columns = require('../modules/columns');

var committeesTemplate = require('../templates/committees.hbs');

  var $table = $('#results');
  new tables.DataTable($table, {
$(function() {
    autoWidth: false,
    title: 'Committees',
    path: ['committees'],
    columns: columns.committees,
    useFilters: true,
    useExport: true,
    order: [[5, 'desc']],
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(committeesTemplate)
    }
  });
});
