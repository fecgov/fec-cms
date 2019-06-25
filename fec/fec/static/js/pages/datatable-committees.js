'use strict';

/* global document */

var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');

var committeesTemplate = require('../templates/committees.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Committees',
    path: ['committees'],
    columns: columns.committees,
    useFilters: true,
    useExport: true,
    order: [[4, 'desc']],
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(committeesTemplate)
    }
  });
});
