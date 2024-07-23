/**
 * National party account disbursements page
 *
 */
import { nationalPartyDisbursements as cols_natPartyAcctDisbursements } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import { default as natPartyDisburseTemplate } from '../templates/national-party-account-disbursements.hbs';

$(function() {
  var $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'National party account disbursements',
    path: ['national_party', 'schedule_b'],
    columns: cols_natPartyAcctDisbursements,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: modalRenderFactory(natPartyDisburseTemplate)
    }
  });
});
