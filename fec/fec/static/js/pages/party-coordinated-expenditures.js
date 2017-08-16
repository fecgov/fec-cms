'use strict';

/**
* Party Coordinated Expenditures datatable page
* ---------------------
* Schedule F shows all special expenditures a national or state party committee
* makes in connection with the general election campaigns of federal candidates.
*
*/

var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');

var partyCoordinatedExpendituresTemplate = require('../templates/party-coordinated-expenditures.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Party coordinated expenditures',
    path: ['schedules', 'schedule_f'],
    columns: columns.partyCoordinatedExpenditures,
    useExport: true,
    order: [[3, 'desc']],
    useFilters: true,
    rowCallback: tables.modalRenderRow,
    callbacks: {
      afterRender: tables.modalRenderFactory(partyCoordinatedExpendituresTemplate)
    }
  });
});
