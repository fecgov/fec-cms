/**
 * pagingType documentation: https://datatables.net/reference/option/pagingType
 */

import { default as URI } from 'urijs';

import {
  buildEntityLink, buildTotalLink, getColumns, getSizeParams, sizeInfo, urlColumn
} from '../modules/column-helpers.js';
import { committeeColumn, currencyColumn, dateColumn, filings, supportOpposeColumn } from '../modules/columns.js';
import Dropdown from '../modules/dropdowns.js';
import initEvents from '../modules/events.js';
import { renderModal } from '../modules/filings.js';
import {
  amendmentVersion, amendmentVersionDescription, buildAppUrl, buildUrl, formatCycleRange, missingDataReason
} from '../modules/helpers.js';
import { init as initMapsEvent } from '../modules/maps-event.js';
import { stateMap } from '../modules/maps.js';
import OtherSpendingTotals from '../modules/other-spending-totals.js';
import { barsAfterRender, DataTable_FEC, SeekPaginator, simpleDOM } from '../modules/tables.js';
import { default as reportType } from '../templates/reports/reportType.hbs';

const events = initEvents();

const aggregateCallbacks = {
  afterRender: barsAfterRender.bind(undefined, undefined)
};

// DOM element and URL for building the state map
var $map = $('.state-map');
var mapUrl = buildUrl(
  ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
  {
    candidate_id: $map.data('candidate-id'),
    cycle: $map.data('cycle'),
    election_full: false,
    per_page: 99
  }
);

const expenditureColumns = [
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
      };
    })
  },
  committeeColumn({
    data: 'committee_name',
    className: 'all'
  }),
  supportOpposeColumn
];

var communicationCostColumns = [
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
  committeeColumn({
    data: 'committee_name',
    className: 'all'
  }),
  supportOpposeColumn
];

var electioneeringColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: buildTotalLink(
      ['electioneering-communications'],
      function(data, type, row) {
        return {
          candidate_id: row.candidate_id
        };
      }
    )
  },
  committeeColumn({
    data: 'committee_name',
    className: 'all'
  })
];

var otherDocumentsColumns = [
  urlColumn('pdf_url', {
    data: 'document_description',
    className: 'all column--medium',
    orderable: false
  }),
  {
    data: 'most_recent',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      var version = amendmentVersion(data);
      if (row.fec_file_id !== null) {
          version = version + '<br><i class="icon-blank"></i>' + row.fec_file_id;
      }
      return version;
    }
  },
  dateColumn({
    data: 'receipt_date',
    className: 'min-tablet'
  })
];

var rawFilingsColumns = getColumns(filings, [
  'document_type',
  'receipt_date',
  'beginning_image_number'
]);

var itemizedDisbursementColumns = [
  {
    data: 'committee_id',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      return buildEntityLink(
        row.committee.name,
        buildAppUrl(['committee', row.committee_id]),
        'committee'
      );
    }
  },
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

var individualContributionsColumns = [
  {
    data: 'contributor_name',
    className: 'all',
    orderable: false
  },
  {
    data: 'committee',
    className: 'all',
    orderable: false,
    paginator: SeekPaginator,
    render: function(data, type, row) {
      return buildEntityLink(
        row.committee.name,
        buildAppUrl(['committee', row.committee_id]),
        'committee'
      );
    }
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

var statementsOfCandidacyColumns = [
  {
    data: 'document_description',
    className: 'all column--doc-download',
    orderable: false,
    render: function(data, type, row) {
      var doc_description = row.document_description
        ? row.document_description
        : row.form_type;
      var amendment_version = amendmentVersionDescription(row);
      var pdf_url = row.pdf_url ? row.pdf_url : null;
      var csv_url = row.csv_url ? row.csv_url : null;
      var fec_url = row.fec_url ? row.fec_url : null;
      var html_url = row.html_url ? row.html_url : null;

      // If it's a Form 3L we should append that to the doc title
      if (row.form_type == 'F3L') {
        doc_description = doc_description + ' - Lobbyist Bundling Report';
      }

      return reportType({
        doc_description: doc_description,
        amendment_version: amendment_version,
        fec_url: fec_url,
        pdf_url: pdf_url,
        csv_url: csv_url,
        html_url: html_url
      });
    }
  },
  {
    data: 'most_recent',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      var version = amendmentVersion(data);
      if (version === 'Version unknown') {
        return (
          '<i class="icon-blank"></i>Version unknown<br>'
        );
      } else {
        if (row.fec_file_id !== null) {
          version =
            version + '<br><i class="icon-blank"></i>' + row.fec_file_id;
        }
        return version;
      }
    }
  },
  dateColumn({
    data: 'receipt_date',
    className: 'min-tablet'
  }),
  {
    data: 'beginning_image_number',
    orderable: false,
    className: 'min-desktop',
    render: function(data, type, row) {
      return row.beginning_image_number;
    }
  },
  {
    data: 'beginning_image_number',
    orderable: false,
    className: 'min-desktop',
    render: function(data, type, row) {
      // Image numbers in 2015 and later begin with YYYYMMDD,
      // which makes for a very big number.
      // This results in inaccurate subtraction
      // so instead we slice it after the first 8 digits.
      // Earlier image numbers are only 11 digits, so we just leave those as-is
      var shorten = function(number) {
        if (number.toString().length === 18) {
          return Number(number.toString().slice(8));
        } else {
          return number;
        }
      };
      var pages =
        shorten(row.ending_image_number) -
        shorten(row.beginning_image_number) +
        1;
      return pages.toLocaleString();
    }
  }
];

// Begin datatable functions in order of tab appearance
// - Financial summary:
//   * Candidate filing years
// - About this candidate:
//   * Other documents filed
// - Spending by others to support/oppose:
//   * Independent expenditures,
//   * Communication costs,
//   * Electioneering communications
// - Itemized disbursements:
//   * Disbursements by transaction
// - Individual contributions:
//   * Contributor state, size, all transactions
// - Statements of Candidacy:
//   * tbd

function initOtherDocumentsTable() {
  const $table = $('table[data-type="other-documents"]');
  const candidateId = $table.data('candidate');
  const path = ['filings'];
  DataTable_FEC.defer($table, {
    path: path,
    query: {
      candidate_id: candidateId,
      form_type: ['F99', 'RFAI'],
      /* Performing an include would only show RFAI form types.
      For this reason, excludes need to be used for request_type

      Exclude all request types except for:
        - RQ-5: RFAI referencing Statement of Candidacy

      If this logic changes, update "Filter this data" button in filings-tab.jinja
      */
      request_type: ['-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9'],
      sort_hide_null: ['false']
    },
    columns: otherDocumentsColumns,
    order: [[2, 'desc']],
    dom: simpleDOM,
    pagingType: 'simple',
    lengthMenu: [10, 30, 50],
    hideEmpty: false
  });
}

var tableOpts = {
  'independent-expenditures': {
    path: ['schedules', 'schedule_e', 'by_candidate'],
    columns: expenditureColumns,
    title: 'independent expenditures'
  },
  'communication-costs': {
    path: ['communication_costs', 'by_candidate'],
    columns: communicationCostColumns,
    title: 'communication costs'
  },
  electioneering: {
    path: ['electioneering', 'by_candidate'],
    columns: electioneeringColumns,
    title: 'electioneering communications'
  }
};

function initSpendingTables() {
  $('.data-table').each(function(index, table) {
    var $table = $(table);
    var dataType = $table.data('type');
    var opts = tableOpts[dataType];
    var query = {
      candidate_id: $table.data('candidate'),
      cycle: $table.data('cycle'),
      election_full: $table.data('election-full')
    };
    var displayCycle = formatCycleRange(
      $table.data('cycle'),
      $table.data('duration')
    );
    if (displayCycle == null) {
      displayCycle = 'unspecified cycle';
    }
    if (opts) {
      DataTable_FEC.defer($table, {
        path: opts.path,
        query: query,
        columns: opts.columns,
        order: [[0, 'desc']],
        dom: simpleDOM,
        pagingType: 'simple',
        lengthChange: true,
        pageLength: 10,
        lengthMenu: [10, 50, 100],
        hideEmpty: true,
        hideEmptyOpts: {
          dataType: opts.title,
          email: window.WEBMANAGER_EMAIL,
          name: window.context.name,
          timePeriod: displayCycle,
          reason: missingDataReason(dataType)
        }
      });
    }
  });
}

function initDisbursementsTable() {
  const $table = $('table[data-type="itemized-disbursements"]');
  var path = ['schedules', 'schedule_b'];
  var committeeIdData = $table.data('committee-id');
  var committeeIds = '';
  if (committeeIdData) {
    committeeIds = committeeIdData.split(',').filter(Boolean);
  }
  var opts = {
    // possibility of multiple committees, so split into array
    committee_id: committeeIds,
    title: 'itemized disbursements',
    name: $table.data('name'),
    cycle: $table.data('cycle')
  };
  var displayCycle = formatCycleRange(
    $table.data('cycle'),
    $table.data('duration')
  );
  if (displayCycle == null) {
    displayCycle = 'unspecified cycle';
  }
  DataTable_FEC.defer($table, {
    path: path,
    query: {
      committee_id: opts.committee_id,
      two_year_transaction_period: opts.cycle
    },
    columns: itemizedDisbursementColumns,
    order: [[4, 'desc']],
    dom: simpleDOM,
    paginator: SeekPaginator,
    lengthMenu: [10, 50, 100],
    useFilters: true,
    useExport: true,
    singleEntityItemizedExport: true,
    hideEmpty: true,
    hideEmptyOpts: {
      email: window.WEBMANAGER_EMAIL,
      dataType: opts.title,
      name: opts.name,
      timePeriod: displayCycle,
      reason: missingDataReason('disbursements')
    }
  });
}

function initContributionsTables() {
  var $allTransactions = $('table[data-type="individual-contributions"]');
  var $contributionSize = $('table[data-type="contribution-size"]');
  var $contributorState = $('table[data-type="contributor-state"]');
  var displayCycle = formatCycleRange(
    $allTransactions.data('cycle'),
    2
  );
  var candidateName = $allTransactions.data('name');
  var committeeIdData = $allTransactions.data('committee-id');
  var committeeIds = '';
  if (committeeIdData) {
    committeeIds = committeeIdData.split(',').filter(Boolean);
  }
  var opts = {
    // possibility of multiple committees, so split into array
    // also, filter array to remove any blank values
    committee_id: committeeIds,
    candidate_id: $allTransactions.data('candidate-id'),
    title: 'individual contributions',
    name: candidateName,
    cycle: $allTransactions.data('cycle')
  };

  var reason = missingDataReason('contributions');

  DataTable_FEC.defer($allTransactions, {
    path: ['schedules', 'schedule_a'],
    query: {
      committee_id: opts.committee_id,
      is_individual: true,
      two_year_transaction_period: opts.cycle
    },
    columns: individualContributionsColumns,
    order: [[2, 'desc']],
    dom: simpleDOM,
    paginator: SeekPaginator,
    useFilters: true,
    useExport: true,
    singleEntityItemizedExport: true,
    hideEmpty: true,
    hideEmptyOpts: {
      dataType: 'individual contributions',
      email: window.WEBMANAGER_EMAIL,
      name: candidateName,
      timePeriod: displayCycle,
      reason: reason
    }
  });

  DataTable_FEC.defer($contributorState, {
    path: ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
    query: {
      candidate_id: opts.candidate_id,
      cycle: opts.cycle,
      election_full: false,
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
        render: buildTotalLink(
          ['receipts', 'individual-contributions'],
          function(data, type, row) {
            return {
              contributor_state: row.state,
              committee_id: opts.committee_id
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

  DataTable_FEC.defer($contributionSize, {
    path: ['schedules', 'schedule_a', 'by_size', 'by_candidate'],
    query: {
      candidate_id: opts.candidate_id,
      cycle: opts.cycle,
      election_full: false,
      sort: 'size'
    },
    columns: [
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
            var params = getSizeParams(row.size);
            params.committee_id = opts.committee_id;
            return params;
          }
        )
      }
    ],
    callbacks: aggregateCallbacks,
    dom: 't',
    order: false,
    pagingType: 'simple',
    lengthChange: false,
    pageLength: 10,
    hideEmpty: true,
    hideEmptyOpts: {
      dataType: 'individual contributions',
      email: window.WEBMANAGER_EMAIL,
      name: candidateName,
      timePeriod: displayCycle,
      reason: reason
    }
  });
  // Set up state map
  initMapsEvent($map, $contributorState);
}
function initStatementsOfCandidacyTable() {
  var $table = $('table[data-type="statements-of-candidacy"]');
  var candidateId = $table.data('candidate-id');
  var path = ['filings'];
  var opts = {
    cycle: $table.data('cycle')
  };
  DataTable_FEC.defer($table, {
    path: path,
    query: {
      candidate_id: candidateId,
      form_type: ['F2', 'RFAI'],
      request_type: ['-1', '-2', '-3', '-4', '-6', '-7', '-8', '-9'],
      cycle: opts.cycle,
      sort_hide_null: ['false']
    },
    columns: statementsOfCandidacyColumns,
    order: [[2, 'desc']],
    dom: simpleDOM,
    pagingType: 'simple',
    lengthMenu: [10, 30, 50],
    hideEmpty: false,
    useExport: true,
    callbacks: {
      afterRender: renderModal
    },
    drawCallback: function() {
      this.dropdowns = $table.find('.dropdown').map(function(idx, elm) {
        return new Dropdown($(elm), { checkboxes: false });
      });
    }
  });
}

function initRawFilingsTable() {
  var $table = $('table[data-type="raw-filings"]');
  var candidateId = $table.attr('data-committee');
  var min_date = $table.attr('data-min-date');
  var path = ['efile', 'filings'];
  DataTable_FEC.defer($table, {
    path: path,
    query: {
      committee_id: candidateId,
      min_receipt_date: min_date,
      sort: ['-receipt_date']
    },
    columns: rawFilingsColumns,
    order: [[2, 'desc']],
    dom: simpleDOM,
    pagingType: 'simple',
    lengthMenu: [10, 30, 50],
    hideEmpty: false,
    useExport: true,
    callbacks: {
      afterRender: renderModal
    },
    drawCallback: function() {
      this.dropdowns = $table.find('.dropdown').map(function(idx, elm) {
        return new Dropdown($(elm), { checkboxes: false });
      });
    }
  });
}

$(function() {
  const query = URI.parseQuery(window.location.search);

  initOtherDocumentsTable();
  initSpendingTables();
  initDisbursementsTable();
  initContributionsTables();
  initStatementsOfCandidacyTable();
  initRawFilingsTable();

  // If on the other spending tab, init the totals
  // Otherwise add an event listener to build them on showing the tab
  if (query.tab === 'other-spending') {
    new OtherSpendingTotals('independentExpenditures');
    new OtherSpendingTotals('electioneering');
    new OtherSpendingTotals('communicationCosts');
  } else {
    events.once('tabs.show.other-spending', function() {
      new OtherSpendingTotals('independentExpenditures');
      new OtherSpendingTotals('electioneering');
      new OtherSpendingTotals('communicationCosts');
    });
  }

  // If we're on the raising tab, load the state map
  if (query.tab === 'raising') {
    $.getJSON(mapUrl).done(function(data) {
      stateMap($map, data, 400, 300, null, null, true, true);
    });
  } else {
    // Add an event listener that only fires once on showing the raising tab
    // in order to not make this API call unless it's necessary
    events.once('tabs.show.raising', function() {
      $.getJSON(mapUrl).done(function(data) {
        stateMap($map, data, 400, 300, null, null, true, true);
      });
    });
  }
});
