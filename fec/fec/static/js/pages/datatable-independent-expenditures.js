
import { amendmentVersion } from '../modules/helpers.js';
import { DataTable, OffsetPaginator, SeekPaginator, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
import { independentExpenditures } from '../modules/columns.js';
import TableSwitcher from '../modules/table-switcher.js';

import expenditureTemplate from '../templates/independent-expenditures.hbs';

var fetchReportDetails = function(row) {
  var amendment_version = Object.assign({}, row, {
    amendment_version: amendmentVersion(row.most_recent)
  });
  return amendment_version;
};

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Independent expenditures',
    path: ['schedules', 'schedule_e'],
    columns: independentExpenditures,
    paginator: SeekPaginator,
    rowCallback: modalRenderRow,
    useExport: true,
    order: [[5, 'desc']],
    useFilters: true,
    callbacks: {
      afterRender: modalRenderFactory(
        expenditureTemplate,
        fetchReportDetails
      )
    }
  });

  new TableSwitcher('.js-table-switcher', {
    efiling: {
      path: ['schedules', 'schedule_e', 'efile'],
      dataType: 'efiling',
      hideColumns: '.hide-efiling',
      paginator: OffsetPaginator
    },
    processed: {
      path: ['schedules', 'schedule_e'],
      dataType: 'processed',
      hideColumns: '.hide-processed',
      paginator: SeekPaginator
    }
  }).init();
});
