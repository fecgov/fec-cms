/**
 * Data and initialization for {@link /data/committees/}
 */
import { committees as cols_committees } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import { default as committeesTemplate } from '../templates/committees.hbs';

$(function() {
  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Committees',
    path: ['committees'],
    columns: cols_committees,
    useFilters: true,
    useExport: true,
    order: [[5, 'desc']],
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: modalRenderFactory(committeesTemplate)
    }
  });
});
