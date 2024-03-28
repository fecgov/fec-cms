
import { getColumns } from '../modules/column-helpers';
import { reports as cols_reports } from '../modules/columns.js';
import Dropdown from '../modules/dropdowns.js';
import { fetchReportDetails } from '../modules/filings';
import TableSwitcher from '../modules/table-switcher.js';
import { DataTable, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import candidateTemplate from '../templates/reports/candidate.hbs';
import ieOnlyTemplate from '../templates/reports/ie-only.hbs';
import pacPartyTemplate from '../templates/reports/pac.hbs';

let pageTitle,
  pageTemplate,
  pageColumns,
  columnKeys = [
    'committee',
    'document_type',
    'version',
    'receipt_date',
    'coverage_end_date'
  ];

if (global.context.form_type === 'presidential') {
  pageTitle = 'Presidential committee reports';
  pageTemplate = candidateTemplate;
  columnKeys.push('receipts', 'disbursements', 'trigger');
} else if (global.context.form_type === 'house-senate') {
  pageTitle = 'House and Senate committee reports';
  pageTemplate = candidateTemplate;
  columnKeys.push('receipts', 'disbursements', 'trigger');
} else if (global.context.form_type === 'pac-party') {
  pageTitle = 'PAC and party committee reports';
  pageTemplate = pacPartyTemplate;
  columnKeys.push(
    'receipts',
    'disbursements',
    'independentExpenditures',
    'trigger'
  );
} else if (global.context.form_type === 'ie-only') {
  pageTitle = 'Independent expenditure only committee reports';
  pageTemplate = ieOnlyTemplate;
  columnKeys.push('contributions', 'independentExpenditures', 'trigger');
}

pageColumns = getColumns(cols_reports, columnKeys);

$(function() {
  const $table = $('#results');
  new DataTable($table, {
    autoWidth: false,
    tableSwitcher: true,
    title: pageTitle,
    path: ['reports', global.context.form_type],
    columns: pageColumns,
    rowCallback: modalRenderRow,
    // Order by coverage date descending
    order: [[3, 'desc']],
    useFilters: true,
    useExport: true,
    callbacks: {
      afterRender: modalRenderFactory(
        pageTemplate,
        fetchReportDetails
      )
    },
    drawCallback: function() {
      this.dropdowns = $table.find('.dropdown').map(function(idx, elm) {
        return new Dropdown($(elm), { checkboxes: false });
      });
    }
  });

  $('.panel__navigation').hide();

  new TableSwitcher('.js-table-switcher', {
    efiling: {
      dataType: 'efiling',
      path: ['efile', 'reports', global.context.form_type]
    },
    processed: {
      dataType: 'processed',
      path: ['reports', global.context.form_type]
    }
  }).init();
});
