'use strict';

var $ = require('jquery');
var _ = require('underscore');
var URI = require('urijs');

var maps = require('../modules/maps');
var mapsEvent = require('../modules/maps-event');
var tables = require('../modules/tables');
var filings = require('../modules/filings');
var helpers = require('../modules/helpers');
var columnHelpers = require('../modules/column-helpers');
var columns = require('../modules/columns');
var dropdown = require('../modules/dropdowns');
var events = require('../modules/events');

var tableOpts = {
  dom: tables.simpleDOM,
  pagingType: 'simple',
  lengthChange: true,
  lengthMenu: [10, 50, 100],
  pageLength: 10,
  hideEmpty: true,
  aggregateExport: true
};

var sizeColumns = [
  {
    data: 'size',
    width: '50%',
    className: 'all',
    orderable: false,
    render: function(data) {
      return columnHelpers.sizeInfo[data].label;
    }
  },
  {
    data: 'total',
    width: '50%',
    className: 'all',
    orderSequence: ['desc', 'asc'],
    orderable: false,
    render: columnHelpers.buildTotalLink(
      ['receipts', 'individual-contributions'],
      function(data, type, row) {
        return columnHelpers.getSizeParams(row.size);
      }
    )
  }
];

var stateColumns = [
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
];

var employerColumns = [
  {
    data: 'employer',
    className: 'all',
    orderable: false,
    defaultContent: 'NOT REPORTED'
  },
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(
      ['receipts', 'individual-contributions'],
      function(data, type, row) {
        if (row.employer) {
          return {
            contributor_employer: row.employer
          };
        } else {
          return null;
        }
      }
    )
  }
];

var occupationColumns = [
  {
    data: 'occupation',
    className: 'all',
    orderable: false,
    defaultContent: 'NOT REPORTED'
  },
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(
      ['receipts', 'individual-contributions'],
      function(data, type, row) {
        if (row.occupation) {
          return {
            contributor_occupation: row.occupation
          };
        } else {
          return null;
        }
      }
    )
  }
];

var disbursementRecipientColumns = [
  {
    data: 'recipient_name',
    className: 'all',
    orderable: false
  },
  {
    data: 'total',
    className: 'all',
    orderable: false,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['disbursements'], function(
      data,
      type,
      row
    ) {
      return {
        recipient_name: row.recipient_name
      };
    })
  }
];

var disbursementRecipientIDColumns = [
  {
    data: 'recipient_name',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      return columnHelpers.buildEntityLink(
        data,
        helpers.buildAppUrl(['committee', row.recipient_id]),
        'committee'
      );
    }
  },
  {
    data: 'total',
    className: 'all',
    orderable: false,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['disbursements'], function(
      data,
      type,
      row
    ) {
      return {
        recipient_name: row.recipient_id
      };
    })
  }
];

var expendituresColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['independent-expenditures'], function(
      data,
      type,
      row
    ) {
      return {
        support_oppose_indicator: row.support_oppose_indicator,
        candidate_id: row.candidate_id
        // is_notice: false,
      };
    })
  },
  columns.supportOpposeColumn,
  columns.candidateColumn({
    data: 'candidate',
    className: 'all'
  })
];

var electioneeringColumns = [
  columns.candidateColumn({
    data: 'candidate',
    className: 'all'
  }),
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(
      ['electioneering-communications'],
      function(data, type, row) {
        return {
          support_oppose_indicator: row.support_oppose_indicator,
          candidate_id: row.candidate_id
        };
      }
    )
  }
];

var communicationCostColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['communication-costs'], function(
      data,
      type,
      row
    ) {
      return {
        support_oppose_indicator: row.support_oppose_indicator,
        candidate_id: row.candidate_id
      };
    })
  },
  columns.supportOpposeColumn,
  columns.candidateColumn({
    data: 'candidate',
    className: 'all'
  })
];

var itemizedDisbursementColumns = [
  {
    data: 'recipient_name',
    className: 'all',
    orderable: false
  },
  {
    data: 'recipient_state',
    className: 'min-tablet hide-panel',
    orderable: false
  },
  {
    data: 'disbursement_description',
    className: 'all',
    orderable: false,
    defaultContent: 'NOT REPORTED'
  },
  columns.dateColumn({
    data: 'disbursement_date',
    className: 'min-tablet'
  }),
  columns.currencyColumn({
    data: 'disbursement_amount',
    className: 'column--number t-mono'
  })
];

var ecItemizedDisbursementColumns = [
  {
    data: 'payee_name',
    className: 'all',
    orderable: false
  },
  {
    data: 'payee_state',
    className: 'min-tablet hide-panel',
    orderable: false
  },
  {
    data: 'purpose_description',
    className: 'all',
    orderable: false,
    defaultContent: 'NOT REPORTED'
  },
  columns.dateColumn({
    data: 'disbursement_date',
    className: 'min-tablet'
  }),
  columns.currencyColumn({
    data: 'disbursement_amount',
    className: 'column--number t-mono'
  }),
  {
    data: 'candidate_name',
    className: 'all',
    orderable: false
  }
];

var individualContributionsColumns = [
  {
    data: 'contributor_name',
    className: 'all',
    orderable: false
  },
  {
    data: 'contributor_state',
    className: 'all',
    orderable: false
  },
  columns.dateColumn({
    data: 'contribution_receipt_date',
    className: 'min-tablet'
  }),
  columns.currencyColumn({
    data: 'contribution_receipt_amount',
    className: 'column--number t-mono'
  })
];

var aggregateCallbacks = {
  afterRender: tables.barsAfterRender.bind(undefined, undefined)
};

// Settings for filings tables
var rawFilingsColumns = columnHelpers.getColumns(columns.filings, [
  'document_type',
  'coverage_start_date',
  'coverage_end_date',
  'receipt_date',
  'beginning_image_number'
]);

var filingsColumns = columnHelpers.getColumns(columns.filings, [
  'document_type',
  'version',
  'receipt_date',
  'beginning_image_number',
  'pages'
]);

var filingsReportsColumns = columnHelpers.getColumns(columns.filings, [
  'document_type',
  'version',
  'coverage_start_date',
  'coverage_end_date',
  'receipt_date_unorderable',
  'beginning_image_number',
  'pages',
  'modal_trigger'
]);

$(document).ready(function() {
  var $mapTable;
  // on committee profile page, when cycles_has_activity more
  // options than cycles_has_financial, when click financial summary page,
  // reset timePeriod in the range of cycles_has_financial
  var cycle_out_of_range = context.cycle_out_of_range;
  if (cycle_out_of_range == 'true') {
    var last_cycle = Number(context.last_cycle_has_financial);
    var last_cycle_1 = last_cycle - 1;
    context.timePeriod = last_cycle_1 + '–' + last_cycle;
  }

  // Set up data tables
  $('.data-table').each(function(index, table) {
    var $table = $(table);
    var committeeId = $table.attr('data-committee');
    var cycle = $table.attr('data-cycle');
    var query = {
      cycle: cycle,
      election_full: false
    };
    var path;
    var opts;
    var filingsOpts = {
      autoWidth: false,
      rowCallback: filings.renderRow,
      dom: '<"panel__main"t><"results-info"frlpi>',
      pagingType: 'simple',
      lengthMenu: [100, 10],
      drawCallback: function() {
        this.dropdowns = $table.find('.dropdown').map(function(idx, elm) {
          return new dropdown.Dropdown($(elm), {
            checkboxes: false
          });
        });
      }
    };

    switch ($table.attr('data-type')) {
      case 'contribution-size':
        path = ['committee', committeeId, 'schedules', 'schedule_a', 'by_size'];
        tables.DataTable.defer($table, {
          path: path,
          query: query,
          columns: sizeColumns,
          callbacks: aggregateCallbacks,
          dom: 't',
          order: false,
          pagingType: 'simple',
          lengthChange: false,
          pageLength: 10,
          aggregateExport: true,
          hideEmpty: true,
          hideEmptyOpts: {
            dataType: 'individual contributions',
            name: context.name,
            reason: helpers.missingDataReason('contributions'),
            timePeriod: context.timePeriod
          }
        });
        break;
      case 'receipts-by-state':
        path = [
          'committee',
          committeeId,
          'schedules',
          'schedule_a',
          'by_state'
        ];
        query = _.extend(query, {
          per_page: 99
        });
        tables.DataTable.defer($table, {
          path: path,
          query: query,
          columns: stateColumns,
          callbacks: aggregateCallbacks,
          aggregateExport: true,
          dom: 't',
          order: [[1, 'desc']],
          paging: false,
          scrollY: 400,
          scrollCollapse: true
        });

        $mapTable = $table;

        break;
      case 'receipts-by-employer':
        path = [
          'committee',
          committeeId,
          'schedules',
          'schedule_a',
          'by_employer'
        ];
        tables.DataTable.defer(
          $table,
          _.extend({}, tableOpts, {
            path: path,
            query: query,
            columns: employerColumns,
            callbacks: aggregateCallbacks,
            order: [[1, 'desc']],
            hideEmptyOpts: {
              dataType: 'individual contributions',
              name: context.name,
              timePeriod: context.timePeriod,
              reason: helpers.missingDataReason('contributions')
            }
          })
        );
        break;
      case 'receipts-by-occupation':
        path = [
          'committee',
          committeeId,
          'schedules',
          'schedule_a',
          'by_occupation'
        ];
        tables.DataTable.defer(
          $table,
          _.extend({}, tableOpts, {
            path: path,
            query: query,
            columns: occupationColumns,
            callbacks: aggregateCallbacks,
            order: [[1, 'desc']],
            hideEmptyOpts: {
              dataType: 'individual contributions',
              name: context.name,
              timePeriod: context.timePeriod,
              reason: helpers.missingDataReason('contributions')
            }
          })
        );
        break;
      case 'itemized-receipts':
        path = ['schedules', 'schedule_a'];
        tables.DataTable.defer(
          $table,
          _.extend({}, tableOpts, {
            path: path,
            query: {
              committee_id: committeeId,
              two_year_transaction_period: cycle,
              is_individual: true
            },
            columns: individualContributionsColumns,
            callbacks: aggregateCallbacks,
            order: [[2, 'desc']],
            useExport: true,
            singleEntityItemizedExport: true,
            paginator: tables.SeekPaginator,
            hideEmptyOpts: {
              dataType: 'individual contributions',
              name: context.name,
              timePeriod: context.timePeriod,
              reason: helpers.missingDataReason('contributions')
            }
          })
        );
        break;
      case 'disbursements-by-recipient':
        path = [
          'committee',
          committeeId,
          'schedules',
          'schedule_b',
          'by_recipient'
        ];
        tables.DataTable.defer(
          $table,
          _.extend({}, tableOpts, {
            path: path,
            query: query,
            columns: disbursementRecipientColumns,
            callbacks: aggregateCallbacks,
            order: [[1, 'desc']],
            hideEmptyOpts: {
              dataType: 'disbursements',
              name: context.name,
              reason: helpers.missingDataReason('disbursements'),
              timePeriod: context.timePeriod
            }
          })
        );
        break;
      case 'itemized-disbursements':
        path = ['schedules', 'schedule_b'];
        tables.DataTable.defer(
          $table,
          _.extend({}, tableOpts, {
            path: path,
            query: {
              committee_id: committeeId,
              two_year_transaction_period: cycle
            },
            columns: itemizedDisbursementColumns,
            callbacks: aggregateCallbacks,
            order: [[3, 'desc']],
            useExport: true,
            singleEntityItemizedExport: true,
            paginator: tables.SeekPaginator,
            hideEmptyOpts: {
              dataType: 'disbursements',
              name: context.name,
              reason: helpers.missingDataReason('disbursements'),
              timePeriod: context.timePeriod
            }
          })
        );
        break;
      case 'ec-itemized-disbursements':
        path = ['electioneering'];
        tables.DataTable.defer(
          $table,
          _.extend({}, tableOpts, {
            path: path,
            query: {
              committee_id: committeeId,
              two_year_transaction_period: cycle
            },
            columns: ecItemizedDisbursementColumns,
            callbacks: aggregateCallbacks,
            order: [[3, 'desc']],
            useExport: true,
            singleEntityItemizedExport: true,
            paginator: tables.SeekPaginator,
            hideEmptyOpts: {
              dataType: 'disbursements',
              name: context.name,
              reason: helpers.missingDataReason('disbursements'),
              timePeriod: context.timePeriod
            }
          })
        );
        break;
      case 'disbursements-by-recipient-id':
        path = [
          'committee',
          committeeId,
          'schedules',
          'schedule_b',
          'by_recipient_id'
        ];
        tables.DataTable.defer(
          $table,
          _.extend({}, tableOpts, {
            path: path,
            query: query,
            columns: disbursementRecipientIDColumns,
            callbacks: aggregateCallbacks,
            order: [[1, 'desc']],
            hideEmptyOpts: {
              dataType: 'disbursements',
              name: context.name,
              reason: helpers.missingDataReason('disbursements'),
              timePeriod: context.timePeriod
            }
          })
        );
        break;
      case 'independent-expenditure-committee':
        path = [
          'committee',
          committeeId,
          'schedules',
          'schedule_e',
          'by_candidate'
        ];
        tables.DataTable.defer($table, {
          path: path,
          query: query,
          columns: expendituresColumns,
          order: [[0, 'desc']],
          dom: tables.simpleDOM,
          pagingType: 'simple',
          hideEmpty: true,
          hideEmptyOpts: {
            dataType: 'independent expenditures',
            name: context.name,
            reason: helpers.missingDataReason('ie-made'),
            timePeriod: context.timePeriod
          }
        });
        break;
      case 'electioneering-committee':
        path = ['committee', committeeId, 'electioneering', 'by_candidate'];
        tables.DataTable.defer($table, {
          path: path,
          query: query,
          columns: electioneeringColumns,
          order: [[1, 'desc']],
          dom: tables.simpleDOM,
          pagingType: 'simple',
          hideEmpty: true,
          hideEmptyOpts: {
            dataType: 'electioneering communications',
            name: context.name,
            timePeriod: context.timePeriod
          }
        });
        break;
      case 'communication-cost-committee':
        path = [
          'committee',
          committeeId,
          'communication_costs',
          'by_candidate'
        ];
        tables.DataTable.defer($table, {
          path: path,
          query: query,
          columns: communicationCostColumns,
          order: [[0, 'desc']],
          dom: tables.simpleDOM,
          pagingType: 'simple',
          hideEmpty: true,
          hideEmptyOpts: {
            dataType: 'communication costs',
            name: context.name,
            timePeriod: context.timePeriod
          }
        });
        break;
      case 'raw-filings':
        var min_date = $table.attr('data-min-date');
        opts = _.extend(
          {
            columns: rawFilingsColumns,
            order: [[1, 'desc']],
            path: ['efile', 'filings'],
            query: _.extend(
              {
                committee_id: committeeId,
                min_receipt_date: min_date,
                sort: ['-receipt_date']
              },
              query
            ),
            callbacks: {
              afterRender: filings.renderModal
            }
          },
          filingsOpts
        );
        tables.DataTable.defer($table, opts);
        break;
      case 'filings-reports':
        opts = _.extend(
          {
            columns: filingsReportsColumns,
            order: [],
            path: ['filings'],
            query: _.extend(
              {
                committee_id: committeeId,
                form_type: [
                  'F3',
                  'F3X',
                  'F3P',
                  'F3L',
                  'F4',
                  'F5',
                  'F7',
                  'F13',
                  'RFAI'
                ],
                report_type: ['-24', '-48'],
                /* Performing an include would only show RFAI form types.
                For this reason, excludes need to be used for request_type

                Exclude all request types except for:
                  - RQ-2: RFAI referencing Report of Receipts and Expenditures
                  - RQ-3: RFAI referencing second notice reports
                  - RQ-4: RFAI referencing Independent Expenditure filer
                  - RQ-7: RFAI referencing failure to file
                  - RQ-8: RFAI referencing public disclosure

                If this logic changes, update "Filter this data" button
                in entity-pages.jinja
                */
                request_type: ['-1', '-5', '-6', '-9'],
                sort: [
                  '-coverage_end_date',
                  'report_type_full',
                  '-beginning_image_number'
                ],
                sort_hide_null: ['false']
              },
              query
            ),
            callbacks: {
              afterRender: filings.renderModal
            }
          },
          filingsOpts
        );
        tables.DataTable.defer($table, opts);
        break;
      case 'filings-notices':
        opts = _.extend(
          {
            columns: filingsColumns,
            order: [[2, 'desc']],
            path: ['filings'],
            query: _.extend(
              {
                committee_id: committeeId,
                form_type: ['F5', 'F24', 'F6', 'F9', 'F10', 'F11', 'RFAI'],
                report_type: ['-Q1', '-Q2', '-Q3', '-YE'],
                /* Performing an include would only show RFAI form types.
                For this reason, excludes need to be used for request_type

                Exclude all request types except for:
                  - RQ-2: RFAI referencing Report of Receipts and Expenditures
                  - RQ-4: RFAI referencing Independent Expenditure filer

                Exclude quarterly report_types so F5 quarterlies don't appear

                If this logic changes, update "Filter this data" button
                in entity-pages.jinja
                */
                request_type: ['-1', '-3', '-5', '-6', '-7', '-8', '-9'],
                sort_hide_null: ['false']
              },
              query
            )
          },
          filingsOpts
        );
        tables.DataTable.defer($table, opts);
        break;
      case 'filings-statements':
        opts = _.extend(
          {
            columns: filingsColumns,
            order: [[2, 'desc']],
            path: ['filings'],
            query: _.extend(
              {
                committee_id: committeeId,
                form_type: ['F1', 'RFAI'],
                /* Performing an include would only show RFAI form types.
                For this reason, excludes need to be used for request_type

                Exclude all request types except for:
                  - RQ-1: RFAI referencing Statement of organization
                  - RQ-6: RFAI referencing 2nd notice State of organization

                If this logic changes, update "Filter this data" button
                in entity-pages.jinja
                */
                request_type: ['-2', '-3', '-4', '-5', '-7', '-8', '-9'],
                sort_hide_null: ['false']
              },
              query
            )
          },
          filingsOpts
        );
        tables.DataTable.defer($table, opts);
        break;
      case 'filings-other':
        opts = _.extend(
          {
            columns: filingsColumns,
            order: [[2, 'desc']],
            path: ['filings'],
            query: _.extend(
              {
                committee_id: committeeId,
                form_type: ['F1M', 'F8', 'F99', 'F12', 'RFAI'],
                /* Performing an include would only show RFAI form types.
                For this reason, excludes need to be used for request_type

                Exclude all request types except for:
                  - RQ-9: RFAI referencing Multicandidate status

                If this logic changes, update "Filter this data" button
                in entity-pages.jinja
                */
                request_type: ['-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8'],
                sort_hide_null: ['false']
              },
              query
            )
          },
          filingsOpts
        );
        tables.DataTable.defer($table, opts);
        break;
    }
  });

  // Set up state map
  var $map = $('.state-map');
  var mapUrl = helpers.buildUrl(
    [
      'committee',
      $map.data('committee-id'),
      'schedules',
      'schedule_a',
      'by_state'
    ],
    {
      cycle: $map.data('cycle'),
      per_page: 99
    }
  );

  var query = URI.parseQuery(window.location.search);

  // If we're on the raising tab, load the state map
  if (query.tab === 'raising') {
    $.getJSON(mapUrl).done(function(data) {
      maps.stateMap($map, data, 400, 300, null, null, true, true);
    });
  } else {
    // Add an event listener that only fires once on showing the raising tab
    // in order to not make this API call unless its necessary
    events.once('tabs.show.raising', function() {
      $.getJSON(mapUrl).done(function(data) {
        maps.stateMap($map, data, 400, 300, null, null, true, true);
      });
    });
  }

  mapsEvent.init($map, $mapTable);
});
