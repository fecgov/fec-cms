/**
 * Data and initialization for {@link /data/individual-contributions/}
 */
import { individualContributions as cols_indivContribs } from '../modules/columns.js';
import { DataTable_FEC, SeekPaginator, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import { default as donationTemplate } from '../templates/receipts.hbs';

$(function() {
  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Individual contributions',
    path: ['schedules', 'schedule_a'],
    query: { is_individual: true, sort_nulls_last: false },
    // Override only when committee_id and two_year_transaction_period are set.
    sortNullsLastForCommitteeTwoYearTransactionPeriod: true,
    columns: cols_indivContribs,
    paginator: SeekPaginator,
    order: [[4, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    error400Message:
      '<p><p>You&#39;re trying to search across multiple time periods. Filter by recipient name or ID, other contributor details, or image number.</p>',
    callbacks: {
      afterRender: modalRenderFactory(donationTemplate)
    }
  });
});
