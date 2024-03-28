
import { electioneeringCommunications as cols_elecComms } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';

import { default as electioneeringTemplate } from '../templates/electioneering-communications.hbs';

  var $table = $('#results');
  new tables.DataTable($table, {
$(function() {
    autoWidth: false,
    title: 'Electioneering communications',
    path: ['electioneering'],
    columns: cols_elecComms,
    rowCallback: modalRenderRow,
    useExport: true,
    order: [[4, 'desc']],
    useFilters: true,
    callbacks: {
      afterRender: modalRenderFactory(electioneeringTemplate)
    }
  });
});
