'use strict';

var $ = require('jquery');

var maps = require('../modules/maps');
var events = require('fec-style/js/events');

function highlightRowAndState($map, $table, state, scroll) {
  var $scrollBody = $table.closest('.dataTables_scrollBody');
  var $row = $scrollBody.find('span[data-state="' + state + '"]');

  if ($row.length > 0) {
    maps.highlightState($('.state-map'), state);
    $scrollBody.find('.row-active').removeClass('row-active');
    $row.parents('tr').addClass('row-active');
    if (scroll) {
      $scrollBody.animate({
        scrollTop: $row.closest('tr').height() * parseInt($row.attr('data-row'))
      }, 500);
    }
  }
}

function init($map, $table) {
  $map.on('click', 'path[data-state]', function() {
    var state = $(this).attr('data-state');
    events.emit('state.map', {state: state});
  });

  $table.on('click', 'tr', function() {
    events.emit('state.table', {
      state: $(this).find('span[data-state]').attr('data-state')
    });
  });

  events.on('state.table', function(params) {
    highlightRowAndState($map, $('.data-table'), params.state, false);
  });

  events.on('state.map', function(params) {
    var $map = $('.state-map');
    highlightRowAndState($map, $table, params.state, true);
  });
}

module.exports = {
  highlightRowAndState: highlightRowAndState,
  init: init
};
