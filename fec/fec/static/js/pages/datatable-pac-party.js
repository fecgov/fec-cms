'use strict';

/**
 * PAC and party committee datatable page
 **/

var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');

var pacPartyTemplate = require('../templates/pac-party.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Political action and party committees',
    path: ['totals', 'pac-party'],
    columns: columns.pac_party,
    order: [[2, 'desc']],
    useFilters: true,
    useExport: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(pacPartyTemplate)
    }
  });
});
