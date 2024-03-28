/**
 * Debts datatable page
 * ---------------------
 * Schedule D shows debts
 * to/from the committee that are required to be disclosed.
 *
 */
import { debts as cols_debts } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';

import { default as debtsTemplate } from '../templates/debts.hbs';

  var $table = $('#results');
  new tables.DataTable($table, {
$(function() {
    autoWidth: false,
    title: 'Debts',
    path: ['schedules', 'schedule_d'],
    columns: cols_debts,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: modalRenderFactory(debtsTemplate)
    }
  });
});
