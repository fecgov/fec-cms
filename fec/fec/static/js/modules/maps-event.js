import { highlightState } from '../modules/maps.js';
import initEvents from './events.js';
let events = initEvents();

export function highlightRowAndState($map, $table, state, scroll) {
  const $scrollBody = $table.closest('.dataTables_scrollBody');
  const $row = $scrollBody.find('span[data-state="' + state + '"]');

  if ($row.length > 0) {
    highlightState($('.state-map'), state);
    $scrollBody.find('.row-active').removeClass('row-active');
    $row.parents('tr').addClass('row-active');
    if (scroll) {
      let i = 6;
      $scrollBody.animate(
        {
          scrollTop:
            $row.closest('tr').height() * parseInt($row.attr('data-row'))
        },
        500
      );
    }
  }
}

export function init($map, $table) {
  if ($map) {
    $map.on('click', 'path[data-state]', function() {
      const state = $(this).attr('data-state');
      events.emit('state.map', { state: state });
    });
  }

  if ($table) {
    $table.on('click', 'tr', function() {
      events.emit('state.table', {
        state: $(this)
          .find('span[data-state]')
          .attr('data-state')
      });
    });
  }

  events.on('state.table', function(params) {
    highlightRowAndState($map, $('.data-table'), params.state, false);
  });

  events.on('state.map', function(params) {
    const $map = $('.state-map');
    highlightRowAndState($map, $table, params.state, true);
  });
}
