import { individualContributions as cols_indivContribs } from '../modules/columns.js';
import { DataTable_FEC, SeekPaginator, modalRenderFactory, modalRenderRow } from '../modules/tables.js';

import { default as donationTemplate } from '../templates/receipts.hbs';

  var $table = $('#results');
  new tables.DataTable($table, {
$(function() {
    autoWidth: false,
    title: 'Individual contributions',
    path: ['schedules', 'schedule_a'],
    query: { is_individual: true, sort_nulls_last: false },
    columns: cols_indivContribs,
    paginator: SeekPaginator,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    error400Message:
      '<p>You&#39;re trying to search across multiple time periods. Filter by recipient name or ID, contributor details, or image number for results.</p>',
    callbacks: {
      afterRender: modalRenderFactory(donationTemplate)
    }
  });
});
