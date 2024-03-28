
import { communicationCosts as col_commCosts } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';

import { default as electioneeringTemplate } from '../templates/communication-costs.hbs';

  var $table = $('#results');
  new tables.DataTable($table, {
$(function() {
    autoWidth: false,
    title: 'Communication costs',
    path: ['communication_costs'],
    columns: col_commCosts,
    rowCallback: modalRenderRow,
    useExport: true,
    order: [[4, 'desc']],
    useFilters: true,
    callbacks: {
      afterRender: modalRenderFactory(electioneeringTemplate)
    }
  });
});
