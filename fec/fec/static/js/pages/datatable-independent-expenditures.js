'use strict';

var $ = require('jquery');

var helpers = require('../modules/helpers');
var tables = require('../modules/tables');
var columns = require('../modules/columns');
var TableSwitcher = require('../modules/table-switcher').TableSwitcher;

var expenditureTemplate = require('../templates/independent-expenditures.hbs');

var fetchReportDetails = function(row) {
  var amendment_version = Object.assign({}, row, {
    amendment_version: helpers.amendmentVersion(row.most_recent)
  });
  return amendment_version;
};

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Independent expenditures',
    path: ['schedules', 'schedule_e'],
    columns: columns.independentExpenditures,
    paginator: tables.SeekPaginator,
    rowCallback: tables.modalRenderRow,
    useExport: true,
    order: [[5, 'desc']],
    useFilters: true,
    callbacks: {
      afterRender: tables.modalRenderFactory(
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
      paginator: tables.OffsetPaginator
    },
    processed: {
      path: ['schedules', 'schedule_e'],
      dataType: 'processed',
      hideColumns: '.hide-processed',
      paginator: tables.SeekPaginator
    }
  }).init();
});
