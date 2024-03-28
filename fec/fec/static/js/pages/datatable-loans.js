/**
 * Loans datatable page
 * ---------------------
 * Schedule C shows loans to
 * the committee that are required to be disclosed.
 *
 */
import { loans as cols_loans } from '../modules/columns.js';
import { DataTable_FEC, modalRenderFactory, modalRenderRow } from '../modules/tables.js';

import { default as loansTemplate } from '../templates/loans.hbs';

  var $table = $('#results');
  new tables.DataTable($table, {
$(function() {
    autoWidth: false,
    title: 'Loans',
    path: ['schedules', 'schedule_c'],
    columns: cols_loans,
    order: [[2, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: modalRenderFactory(loansTemplate)
    }
  });
});
