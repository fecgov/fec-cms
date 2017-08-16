'use strict';

/* global require, document */

var $ = require('jquery');

var filings = require('../modules/filings');
var columnHelpers = require('../modules/column-helpers');
var columns = require('../modules/columns');
var tables = require('../modules/tables');
var TableSwitcher = require('../modules/table-switcher').TableSwitcher;
var dropdown = require('fec-style/js/dropdowns');

var columns = columnHelpers.getColumns(
  columns.filings,
  [
    'filer_name', 'document_type', 'version', 'receipt_date', 'beginning_image_number', 'modal_trigger'
  ]
);

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    tableSwitcher: true,
    title: 'Filings',
    path: ['filings'],
    columns: columns,
    rowCallback: filings.renderRow,
    order: [[3, 'desc']],
    hideColumns: '.hide-processed',
    useFilters: true,
    useExport: true,
    callbacks: {
      afterRender: filings.renderModal
    },
    drawCallback: function () {
      this.dropdowns = $table.find('.dropdown').map(function(idx, elm) {
        return new dropdown.Dropdown($(elm), {checkboxes: false});
      });
    }
  });

  $('.panel__navigation').hide();

  new TableSwitcher('.js-table-switcher', {
    efiling: {
      path: ['efile', 'filings'],
      dataType: 'efiling',
      hideColumns: '.hide-efiling'
    },
    processed: {
      path: ['filings'],
      dataType: 'processed',
      hideColumns: '.hide-processed'
    }
  }).init();
});
