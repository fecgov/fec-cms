
import { DataTable, OffsetPaginator, SeekPaginator, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import TableSwitcher from '../modules/table-switcher.js';
import { receipts as cols_receipts } from '../modules/columns.js';
import { lineNumberFilters } from '../modules/filters-event.js';
import { default as donationTemplate } from '../templates/receipts.hbs';

$(document).ready(function() {
  var $table = $('#results');
  new DataTable($table, {
    autoWidth: false,
    title: 'Receipts',
    path: ['schedules', 'schedule_a'],
    columns: cols_receipts,
    query: { sort_nulls_last: false },
    paginator: SeekPaginator,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    error400Message:
      '<p>You&#39;re trying to search across multiple time periods. Filter by recipient name or ID, source details, or image number for results.</p>',
    callbacks: {
      afterRender: modalRenderFactory(donationTemplate)
    }
  });

  var switcher = new TableSwitcher('.js-table-switcher', {
    efiling: {
      path: ['schedules', 'schedule_a', 'efile'],
      dataType: 'efiling',
      hideColumns: '.hide-efiling',
      paginator: OffsetPaginator
    },
    processed: {
      path: ['schedules', 'schedule_a'],
      dataType: 'processed',
      hideColumns: '.hide-processed',
      paginator: SeekPaginator
    }
  });

  switcher.init();

  lineNumberFilters();
});
