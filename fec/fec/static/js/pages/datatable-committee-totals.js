'use strict';

/* jslint camelcase: false */
/* jslint maxlen: false */

var $ = require('jquery');
var tables = require('../modules/tables');
var columns = require('../modules/columns');
var committeeTotalsTemplate = require('../templates/committee-totals.hbs');

var tableColumns = {
  'pacs': [
    {
      data: 'committee_id',
      className: 'all',
    },
    columns.currencyColumn({data: 'receipts', className: 'all column--number'}),
    columns.currencyColumn({data: 'disbursements', className: 'min-tablet column--number'}),
    columns.currencyColumn({data: 'last_cash_on_hand_end_period', className: 'min-tablet hide-panel column--number'}),
    columns.dateColumn({data: 'coverage_end_date', className: 'min-tablet hide-panel column--small'}),
    columns.modalTriggerColumn
  ],
  'party': [
    {
      data: 'committee_id',
      className: 'all',
    },
    {
      data: 'party_full',
      className: 'min-tablet',
    },
    columns.currencyColumn({data: 'receipts', className: 'all column--number'}),
    columns.currencyColumn({data: 'disbursements', className: 'min-tablet column--number'}),
    columns.currencyColumn({data: 'last_cash_on_hand_end_period', className: 'min-tablet hide-panel column--number'}),
    columns.dateColumn({data: 'coverage_end_date', className: 'min-tablet hide-panel column--small'}),
    columns.modalTriggerColumn
  ]
};

// Sort by receipts on pacs and parties.
var sortColumn = context.committee_type === 'pacs' ? 1 : 2;

var titles = {
  'pacs': 'Political action committees',
  'party': 'Political party committees'
};

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: titles[context.committee_type],
    path: ['totals', context.committee_type],
    columns: tableColumns[context.committee_type],
    useFilters: true,
    useExport: true,
    disableExport: true,
    order: [[sortColumn, 'desc']],
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(committeeTotalsTemplate)
    }
  });
});
