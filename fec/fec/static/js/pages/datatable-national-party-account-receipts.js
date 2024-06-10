/**
 * National party account receipts datatable page
 */
import { nationalPartyDisbursements as cols_natPartyAcctReceipts } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import { default as natPartyDisburseTemplate } from '../templates/national-party-account-receipts.hbs';

$(function() {
  var $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'National party account receipts',
    path: ['national_party', 'schedule_a'],
    columns: cols_natPartyAcctReceipts,
    order: [[3, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: modalRenderFactory(natPartyDisburseTemplate)
    }
  });
});
