/**
 * Data and initialization for {@link /data/communication-costs/}
 */
import { communicationCosts as col_commCosts } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import { default as electioneeringTemplate } from '../templates/communication-costs.hbs';

$(function() {
  const $table = $('#results');
  new DataTable_FEC($table, {
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
