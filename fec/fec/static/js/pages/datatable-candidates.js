/**
 * Data and initialization for {@link /data/candidates/}
 */
import { candidates as cols_candidates } from '../modules/columns.js';
import { renderCandidatePanel } from '../modules/table-panels.js';
import { DataTable_FEC, modalRenderRow } from '../modules/tables.js';

$(function() {
  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Candidates',
    path: ['candidates'],
    columns: cols_candidates,
    order: [[6, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: renderCandidatePanel(false)
    }
  });
});
