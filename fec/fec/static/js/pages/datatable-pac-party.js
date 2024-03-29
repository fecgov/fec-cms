/**
 * PAC and party committee datatable page
 **/
import { pac_party as cols_pacParty} from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';

import { default as pacPartyTemplate } from '../templates/pac-party.hbs';

$(function() {
  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Political action and party committees',
    path: ['totals', 'pac-party'],
    columns: cols_pacParty,
    order: [[2, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: modalRenderFactory(pacPartyTemplate)
    }
  });
});
