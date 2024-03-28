
import { committees as cols_committees } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';

import { default as committeesTemplate } from '../templates/committees.hbs';

  var $table = $('#results');
  new tables.DataTable($table, {
$(function() {
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
