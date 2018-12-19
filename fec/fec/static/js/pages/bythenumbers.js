'use strict';

/* global context, ga */

var $ = require('jquery');
var analytics = require('../modules/analytics');
var TopEntities = require('../modules/top-entities').TopEntities;
var maps = require('../modules/maps');
var mapsEvent = require('../modules/maps-event');
var tables = require('../modules/tables');
var helpers = require('../modules/helpers');
var columnHelpers = require('../modules/column-helpers');
var columns = require('../modules/columns');

var aggregateCallbacks = {
  afterRender: tables.barsAfterRender.bind(undefined, undefined)
};

new TopEntities('.js-top-entities', context.type);

// Initialize datatable for raising totals table
function initContributionTotalsTables() {
  var $totalsTable = $('table[data-type="contribution-totals"]');
  var cycle = 2018;

  new tables.DataTable($totalsTable, {
    path: ['schedules', 'schedule_a', 'by_state', 'totals'],
    query: {
      cycle: 2018,
      committee_type: 'ALL',
      sort_hide_null: false,
      per_page: 99
    },
    columns: [
      {
        data: 'state_full',
        width: '50%',
        className: 'all',
        render: function(data, type, row, meta) {
          var span = document.createElement('span');
          span.textContent = data;
          span.setAttribute('data-state', data);
          span.setAttribute('data-row', meta.row);
          return span.outerHTML;
        }
      },
      {
        data: 'total',
        width: '50%',
        className: 'all',
        orderSequence: ['desc', 'asc'],
        render: columnHelpers.buildTotalLink(
          ['receipts', 'individual-contributions'],
          function(data, type, row) {
            return {
              contributor_state: row.state
            };
          }
        )
      }
    ],
    callbacks: aggregateCallbacks,
    dom: 't',
    order: [[1, 'desc']],
    paging: false,
    scrollY: 400,
    scrollCollapse: true
  });

  // Set up state map
  var $map = $('.state-map');
  var mapUrl = helpers.buildUrl(
    ['schedules', 'schedule_a', 'by_state', 'totals'],
    {
      cycle: 2018,
      committee_type: 'ALL',
      per_page: 99
    }
  );
  $.getJSON(mapUrl).done(function(data) {
    maps.stateMap($map, data, 400, 300, null, null, true, true);
  });
  mapsEvent.init($map, $totalsTable);
}

$(document).ready(function() {
  initContributionTotalsTables();
});

$('.js-ga-event').each(function() {
  var eventName = $(this).data('ga-event');
  $(this).on('click', function() {
    if (analytics.trackerExists()) {
      var gaEventData = {
        eventCategory: 'Misc. events',
        eventAction: eventName,
        eventValue: 1
      };
      ga('nonDAP.send', 'event', gaEventData);
    }
  });
});
