/**
 * Party Coordinated Expenditures datatable page
 * ---------------------
 * Schedule F shows all special expenditures a national or state party committee
 * makes in connection with the general election campaigns of federal candidates.
 *
 */
import { partyCoordinatedExpenditures as cols_partyCoordExpen } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import { default as partyCoordinatedExpendituresTemplate } from '../templates/party-coordinated-expenditures.hbs';

$(function() {
  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Party coordinated expenditures',
    path: ['schedules', 'schedule_f'],
    columns: cols_partyCoordExpen,
    useExport: true,
    order: [[3, 'desc']],
    useFilters: true,
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: modalRenderFactory(
        partyCoordinatedExpendituresTemplate
      )
    }
  });
});
