/**
 * Data and initialization for {@link /data/receipts/}
 */
import { receipts as cols_receipts } from '../modules/columns.js';
import { lineNumberFilters } from '../modules/filters-event.js';
import TableSwitcher from '../modules/table-switcher.js';
import { DataTable_FEC, OffsetPaginator, SeekPaginator, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import { default as donationTemplate } from '../templates/receipts.hbs';

$(function() {
  const $table = $('#results');
  new DataTable_FEC($table, {
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

  const switcher = new TableSwitcher('.js-table-switcher', {
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
