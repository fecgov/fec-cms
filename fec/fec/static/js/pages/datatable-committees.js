'use strict';

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

  // Call the /names/candidates/ endpoint to get the leadership PAC sponsor name based on the candidate ID.
  // Call is only made if the leadership_pac_sponsor_name exists for that row
  $('#datatable-modal').on('show', function() {
    var $candidateIds = $(this).find('.leadership_pac_sponsor_name');
    $candidateIds.each(function() {
      var $candidateIdSpan = $(this);
      var candidateIdSpan = $candidateIdSpan[0];
      var candidateId = candidateIdSpan.innerText;
      $.getJSON(
        `${window.API_LOCATION}/v1/names/candidates/?q=${candidateId}&api_key=${window.API_KEY_PUBLIC}`,
        function(data) {
          if (data.results.length >= 1) {
            var record = data.results[0];
            $candidateIdSpan.html(record.name);
          }
        }
      );
    });
  });
});
