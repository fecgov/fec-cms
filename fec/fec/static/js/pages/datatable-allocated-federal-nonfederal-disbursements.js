
import { allocatedFederalNonfederalDisbursements as cols_allocatedFederalNonfederalDisbursements } from '../modules/columns.js';
import { lineNumberFilters } from '../modules/filters-event.js';
import TableSwitcher from '../modules/table-switcher.js';
import { DataTable, OffsetPaginator, SeekPaginator, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import { default as allocatedFederalNonfederalDisbursementsTemplate } from '../templates/allocated-federal-nonfederal-disbursements.hbs';

  new DataTable($table, {
$(function() {
  const $table = $('#results');
    autoWidth: false,
    title: 'Allocated federal/nonfederal disbursements',
    path: ['schedules', 'schedule_h4'],
    columns: cols_allocatedFederalNonfederalDisbursements,
    query: { sort_nulls_last: true },
    paginator: SeekPaginator,
    order: [[6, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: modalRenderFactory(allocatedFederalNonfederalDisbursementsTemplate)
    }
  });

  new TableSwitcher('.js-table-switcher', {
    efiling: {
      path: ['schedules', 'schedule_h4', 'efile'],
      dataType: 'efiling',
      hideColumns: '.hide-efiling',
      paginator: OffsetPaginator
    },
    processed: {
      path: ['schedules', 'schedule_h4'],
      dataType: 'processed',
      hideColumns: '.hide-processed',
      paginator: SeekPaginator
    }
  }).init();

  lineNumberFilters();
});
