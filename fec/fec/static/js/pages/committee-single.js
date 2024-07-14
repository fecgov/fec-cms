/**
 * pagingType documentation: https://datatables.net/reference/option/pagingType
 */

import { default as _extend } from 'underscore/modules/extend.js';
import { default as URI } from 'urijs';

import { buildEntityLink, buildTotalLink, getColumns, getSizeParams, sizeInfo } from '../modules/column-helpers.js';
import { candidateColumn, currencyColumn, dateColumn, filings, supportOpposeColumn } from '../modules/columns.js';
import Dropdown from '../modules/dropdowns.js';
import initEvents from '../modules/events.js';
import { renderModal, renderRow } from '../modules/filings.js';
import { buildAppUrl, buildUrl, missingDataReason } from '../modules/helpers.js';
import { init as initMapsEvent } from '../modules/maps-event.js';
import { stateMap } from '../modules/maps.js';
import { barsAfterRender, DataTable_FEC, SeekPaginator, simpleDOM } from '../modules/tables.js';
const events = initEvents();

const tableOpts = {
  dom: simpleDOM,
  pagingType: 'simple',
  lengthChange: true,
  lengthMenu: [10, 50, 100],
  pageLength: 10,
  hideEmpty: true,
  aggregateExport: true
};

const sizeColumns = [
  {
    data: 'size',
    width: '50%',
    className: 'all',
    orderable: false,
    render: function(data) {
      return sizeInfo[data].label;
    }
  },
  {
    data: 'total',
    width: '50%',
    className: 'all',
    orderSequence: ['desc', 'asc'],
    orderable: false,
    render: buildTotalLink(
      ['receipts', 'individual-contributions'],
      function(data, type, row) {
        return getSizeParams(row.size);
      }
    )
  }
];

const stateColumns = [
  {
    data: 'state_full',
    width: '50%',
    className: 'all',
    render: function(data, type, row, meta) {
      const span = document.createElement('span');
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
    render: buildTotalLink(
      ['receipts', 'individual-contributions'],
      function(data, type, row) {
        return {
          contributor_state: row.state
        };
      }
    )
  }
];

const renderNullStringText = function(data, columnName) {
  if (data == 'NULL') {
    return data = '(COMMITTEE DID NOT PROVIDE ' + columnName + ')';
  } else {
    return data;
  }
};

const employerColumns = [
  {
    data: 'employer',
    className: 'all',
    orderable: false,
    render: function(data){
      return renderNullStringText(data, 'AN EMPLOYER');
    }
  },
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: buildTotalLink(
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

const occupationColumns = [
  {
    data: 'occupation',
    className: 'all',
    orderable: false,
    render: function(data){
      return renderNullStringText(data, 'AN OCCUPATION');
    }
  },
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: buildTotalLink(
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

const disbursementRecipientColumns = [
  {
    data: 'recipient_name',
    className: 'all',
    orderable: false,
    render: function(data){
      return renderNullStringText(data, 'A RECIPIENT');
    }
  },
  {
    data: 'recipient_disbursement_percent',
    className: 'all',
    orderable: false,
    render: function ( data ) {
      if(data) {
        return data + '%';
      } else{
        return 'Could not calculate';
      }
    }
  },
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: buildTotalLink(['disbursements'], function(
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

const disbursementRecipientIDColumns = [
  {
    data: 'recipient_name',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      return buildEntityLink(
        data,
        buildAppUrl(['committee', row.recipient_id]),
        'committee'
      );
    }
  },
  {
    data: 'total',
    className: 'all',
    orderable: false,
    orderSequence: ['desc', 'asc'],
    render: buildTotalLink(['disbursements'], function(
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

const expendituresColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: buildTotalLink(['independent-expenditures'], function(
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
  supportOpposeColumn,
  candidateColumn({
    data: 'candidate_name',
    className: 'all'
  })
];

const electioneeringColumns = [
  candidateColumn({
    data: 'candidate',
    className: 'all'
  }),
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: buildTotalLink(
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

const communicationCostColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: buildTotalLink(['communication-costs'], function(
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
  supportOpposeColumn,
  candidateColumn({
    data: 'candidate_name',
    className: 'all'
  })
];

const itemizedDisbursementColumns = [
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
  dateColumn({
    data: 'disbursement_date',
    className: 'min-tablet'
  }),
  currencyColumn({
    data: 'disbursement_amount',
    className: 'column--number t-mono'
  })
];

const ecItemizedDisbursementColumns = [
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
  dateColumn({
    data: 'disbursement_date',
    className: 'min-tablet'
  }),
  currencyColumn({
    data: 'disbursement_amount',
    className: 'column--number t-mono'
  }),
  {
    data: 'candidate_name',
    className: 'all',
    orderable: false
  }
];

const individualContributionsColumns = [
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
  dateColumn({
    data: 'contribution_receipt_date',
    className: 'min-tablet'
  }),
  currencyColumn({
    data: 'contribution_receipt_amount',
    className: 'column--number t-mono'
  })
];

const aggregateCallbacks = {
  afterRender: barsAfterRender.bind(undefined, undefined)
};

// Settings for filings tables
const rawFilingsColumns = getColumns(filings, [
  'document_type',
  'coverage_start_date',
  'coverage_end_date',
  'receipt_date',
  'beginning_image_number'
]);

const filingsColumns = getColumns(filings, [
  'document_type',
  'version',
  'receipt_date',
  'beginning_image_number',
  'pages'
]);

const filingsReportsColumns = getColumns(filings, [
  'document_type',
  'version',
  'coverage_start_date',
  'coverage_end_date',
  'receipt_date_unorderable',
  'beginning_image_number',
  'pages',
  'modal_trigger'
]);

$(function() {
  let $mapTable;
  // Reset time period to the fallback_cycle, which is the LAST_CYCLE_HAS_FINANCIAL.
  if (window.context.cycleOutOfRange == 'true') {
    const lastCycle = Number(window.context.lastCycleHasFinancial);
    const lastCycleOddYear = lastCycle - 1;
    window.context.timePeriod = lastCycleOddYear + '–' + lastCycle;
    window.context.cycle = lastCycle;
  }

  // Set up data tables
  $('.data-table').each(function(index, table) {
    const $table = $(table);
    const committeeId = $table.attr('data-committee');
    const query = {
      election_full: false
    };
    let path;
    let opts;
    let cycle;
    const filingsOpts = {
      autoWidth: false,
      rowCallback: renderRow,
      dom: '<"panel__main"t><"results-info"frlpi>',
      pagingType: 'simple',
      lengthMenu: [100, 10],
      drawCallback: function() {
        this.dropdowns = $table.find('.dropdown').map(function(idx, elm) {
          return new Dropdown($(elm), {
            checkboxes: false
          });
        });
      }
    };

    switch ($table.attr('data-type')) {
      case 'contribution-size':
        path = ['schedules', 'schedule_a', 'by_size'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer($table, {
          path: path,
          query: _extend(query, {
            committee_id: committeeId,
            cycle: cycle
          }),
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
            name: window.context.name,
            reason: missingDataReason('contributions'),
            timePeriod: window.context.timePeriod
          }
        });
        break;
      case 'receipts-by-state':
        path = ['schedules', 'schedule_a', 'by_state'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer($table, {
          path: path,
          query: _extend(query, {
            committee_id: committeeId,
            cycle: cycle,
            per_page: 99
          }),
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
        path = ['schedules', 'schedule_a', 'by_employer'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer(
          $table,
          _extend({}, tableOpts, {
            path: path,
            query: _extend(query, {
              committee_id: committeeId,
              cycle: cycle
            }),
            columns: employerColumns,
            callbacks: aggregateCallbacks,
            order: [[1, 'desc']],
            hideEmptyOpts: {
              dataType: 'individual contributions',
              name: window.context.name,
              timePeriod: window.context.timePeriod,
              reason: missingDataReason('contributions')
            }
          })
        );
        break;
      case 'receipts-by-occupation':
        path = ['schedules', 'schedule_a', 'by_occupation'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer(
          $table,
          _extend({}, tableOpts, {
            path: path,
            query: _extend(query, {
              committee_id: committeeId,
              cycle: cycle
            }),
            columns: occupationColumns,
            callbacks: aggregateCallbacks,
            order: [[1, 'desc']],
            hideEmptyOpts: {
              dataType: 'individual contributions',
              name: window.context.name,
              timePeriod: window.context.timePeriod,
              reason: missingDataReason('contributions')
            }
          })
        );
        break;
      case 'itemized-receipts':
        path = ['schedules', 'schedule_a'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer(
          $table,
          _extend({}, tableOpts, {
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
            paginator: SeekPaginator,
            hideEmptyOpts: {
              dataType: 'individual contributions',
              name: window.context.name,
              timePeriod: window.context.timePeriod,
              reason: missingDataReason('contributions')
            }
          })
        );
        break;
      case 'disbursements-by-recipient':
        path = ['schedules', 'schedule_b', 'by_recipient'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer(
          $table,
          _extend({}, tableOpts, {
            path: path,
            query: _extend(query, {
              committee_id: committeeId,
              cycle: cycle
            }),
            columns: disbursementRecipientColumns,
            callbacks: aggregateCallbacks,
            order: [[2, 'desc']],
            hideEmptyOpts: {
              dataType: 'disbursements',
              name: window.context.name,
              reason: missingDataReason('disbursements'),
              timePeriod: window.context.timePeriod
            }
          })
        );
        break;
      case 'itemized-disbursements':
        path = ['schedules', 'schedule_b'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer(
          $table,
          _extend({}, tableOpts, {
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
            paginator: SeekPaginator,
            hideEmptyOpts: {
              dataType: 'disbursements',
              name: window.context.name,
              reason: missingDataReason('disbursements'),
              timePeriod: window.context.timePeriod
            }
          })
        );
        break;
      case 'ec-itemized-disbursements':
        path = ['electioneering'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer(
          $table,
          _extend({}, tableOpts, {
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
            paginator: SeekPaginator,
            hideEmptyOpts: {
              dataType: 'disbursements',
              name: window.context.name,
              reason: missingDataReason('disbursements'),
              timePeriod: window.context.timePeriod
            }
          })
        );
        break;
      case 'disbursements-by-recipient-id':
        path = ['schedules', 'schedule_b', 'by_recipient_id'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer(
          $table,
          _extend({}, tableOpts, {
            path: path,
            query: _extend(query, {
              committee_id: committeeId,
              cycle: cycle
            }),
            columns: disbursementRecipientIDColumns,
            callbacks: aggregateCallbacks,
            order: [[1, 'desc']],
            hideEmptyOpts: {
              dataType: 'disbursements',
              name: window.context.name,
              reason: missingDataReason('disbursements'),
              timePeriod: window.context.timePeriod
            }
          })
        );
        break;
      case 'independent-expenditure-committee':
        path = ['schedules', 'schedule_e', 'by_candidate'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer($table, {
          path: path,
          query: _extend(query, {
            committee_id: committeeId,
            cycle: cycle
          }),
          columns: expendituresColumns,
          order: [[0, 'desc']],
          dom: simpleDOM,
          pagingType: 'simple',
          hideEmpty: true,
          hideEmptyOpts: {
            dataType: 'independent expenditures',
            name: window.context.name,
            reason: missingDataReason('ie-made'),
            timePeriod: window.context.timePeriod
          }
        });
        break;
      case 'electioneering-committee':
        path = ['electioneering', 'aggregates'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer($table, {
          path: path,
          query: _extend(query, {
            cycle: cycle,
            committee_id: committeeId
          }),
          columns: electioneeringColumns,
          order: [[1, 'desc']],
          dom: simpleDOM,
          pagingType: 'simple',
          hideEmpty: true,
          hideEmptyOpts: {
            dataType: 'electioneering communications',
            name: window.context.name,
            timePeriod: window.context.timePeriod
          }
        });
        break;
      case 'communication-cost-committee':
        path = ['communication_costs', 'aggregates'];
        // For raising/spending tabs, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        DataTable_FEC.defer($table, {
          path: path,
          query: _extend(query, {
            cycle: cycle,
            committee_id: committeeId
          }),
          columns: communicationCostColumns,
          order: [[0, 'desc']],
          dom: simpleDOM,
          pagingType: 'simple',
          hideEmpty: true,
          hideEmptyOpts: {
            dataType: 'communication costs',
            name: window.context.name,
            timePeriod: window.context.timePeriod
          }
        });
        break;
      case 'raw-filings':
        const min_date = $table.attr('data-min-date'); //eslint-disable-line no-case-declarations
        // For raw-filings, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        opts = _extend(
          {
            columns: rawFilingsColumns,
            order: [[1, 'desc']],
            path: ['efile', 'filings'],
            query: _extend(
              {
                cycle: cycle,
                committee_id: committeeId,
                min_receipt_date: min_date,
                sort: ['-receipt_date']
              },
              query
            ),
            callbacks: {
              afterRender: renderModal
            }
          },
          filingsOpts
        );
        DataTable_FEC.defer($table, opts);
        break;
      case 'filings-reports':
        // For filings-reports, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        opts = _extend(
          {
            columns: filingsReportsColumns,
            order: [],
            path: ['filings'],
            query: _extend(
              {
                cycle: cycle,
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
                  'report_type_full_original',
                  '-beginning_image_number'
                ],
                sort_hide_null: ['false']
              },
              query
            ),
            callbacks: {
              afterRender: renderModal
            }
          },
          filingsOpts
        );
        DataTable_FEC.defer($table, opts);
        break;
      case 'filings-notices':
        // For filings-notices, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        opts = _extend(
          {
            columns: filingsColumns,
            order: [[2, 'desc']],
            path: ['filings'],
            query: _extend(
              {
                cycle: cycle,
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
        DataTable_FEC.defer($table, opts);
        break;
      case 'filings-statements':
        // For filings-statements, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        opts = _extend(
          {
            columns: filingsColumns,
            order: [[2, 'desc']],
            path: ['filings'],
            query: _extend(
              {
                cycle: cycle,
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
        DataTable_FEC.defer($table, opts);
        break;
      case 'filings-other':
        // For filings-other, use previous cycle if provided
        cycle = window.context.cycle || $table.attr('data-cycle');
        opts = _extend(
          {
            columns: filingsColumns,
            order: [[2, 'desc']],
            path: ['filings'],
            query: _extend(
              {
                cycle: cycle,
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
        DataTable_FEC.defer($table, opts);
        break;
    }
  });

  // Set up state map
  const $map = $('.state-map');
  const mapUrl = buildUrl(['schedules', 'schedule_a', 'by_state'], {
    committee_id: $map.data('committee-id'),
    cycle: $map.data('cycle'),
    per_page: 99
  });

  const query = URI.parseQuery(window.location.search);

  // If we're on the raising tab, load the state map
  if (query.tab === 'raising') {
    $.getJSON(mapUrl).done(function(data) {
      stateMap($map, data, 400, 300, null, null, true, true);
    });
  } else {
    // Add an event listener that only fires once on showing the raising tab
    // in order to not make this API call unless its necessary
    events.once('tabs.show.raising', function() {
      $.getJSON(mapUrl).done(function(data) {
        stateMap($map, data, 400, 300, null, null, true, true);
      });
    });
  }

  initMapsEvent($map, $mapTable);
});
