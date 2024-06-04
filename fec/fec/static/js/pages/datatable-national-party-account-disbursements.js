/**
 * National party account disbursements page
 *
 */
var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');

var natPartyAcctDisTemplate = require('../templates/national-party-account-disbursements.hbs');

$(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'National party account disbursements',
    path: ['national_party', 'schedule_b'],
    columns: columns.nationalPartyDisbursements,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(natPartyAcctDisTemplate)
    }
  });
});
