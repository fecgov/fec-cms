'use strict';

var $ = require('jquery');

var tables = require('../modules/tables');
var columns = require('../modules/columns');

var electioneeringTemplate = require('../templates/electioneering-communications.hbs');

$(document).ready(function() {
  var $table = $('#results');
  new tables.DataTable($table, {
    autoWidth: false,
    title: 'Electioneering communications',
    path: ['electioneering'],
    columns: columns.electioneeringCommunications,
    rowCallback: tables.modalRenderRow,
    useExport: true,
    order: [[4, 'desc']],
    useFilters: true,
    callbacks: {
      afterRender: tables.modalRenderFactory(electioneeringTemplate)
    }
  });
});
