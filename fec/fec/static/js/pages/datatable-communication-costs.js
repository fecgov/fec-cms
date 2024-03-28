
import { communicationCosts as col_commCosts } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';

import { default as electioneeringTemplate } from '../templates/communication-costs.hbs';

  new tables.DataTable($table, {
$(function() {
  const $table = $('#results');
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
