/**
 * Data and initialization for
 * {@link /data/candidates/house/}
 * {@link /data/candidates/president/}
 * {@link /data/candidates/senate/}
 */
import { getColumns } from '../modules/column-helpers.js';
import { candidateOffice as cols_candidateOffice } from '../modules/columns.js';
import { renderCandidatePanel } from '../modules/table-panels.js';
import { DataTable_FEC, modalRenderRow } from '../modules/tables.js';

var columnGroups = {
  president: getColumns(cols_candidateOffice, [
    'name',
    'party',
    'receipts',
    'disbursements',
    'trigger'
  ]),
  senate: getColumns(cols_candidateOffice, [
    'name',
    'party',
    'state',
    'receipts',
    'disbursements',
    'trigger'
  ]),
  house: getColumns(cols_candidateOffice, [
    'name',
    'party',
    'state',
    'district',
    'receipts',
    'disbursements',
    'trigger'
  ])
};

var defaultSort = {
  president: 2,
  senate: 3,
  house: 4
};

var officeTitleMap = {
  president: 'president',
  senate: 'Senate',
  house: 'House of Representatives'
};

$(function() {
  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Candidates for ' + officeTitleMap[window.context.office],
    path: ['candidates', 'totals'],
    query: { office: window.context.office.slice(0, 1).toUpperCase() },
    columns: columnGroups[window.context.office],
    order: [[defaultSort[window.context.office], 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    callbacks: {
      afterRender: renderCandidatePanel(true)
    }
  });
});
