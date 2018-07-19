'use strict';

/* global require, document, context, WEBMANAGER_EMAIL */

var $ = require('jquery');
var URI = require('urijs');

var maps = require('../modules/maps');
var mapsEvent = require('../modules/maps-event');
var tables = require('../modules/tables');
var helpers = require('../modules/helpers');
var columnHelpers = require('../modules/column-helpers');
var columns = require('../modules/columns');
var events = require('../modules/events');
var OtherSpendingTotals = require('../modules/other-spending-totals');
var filings = require('../modules/filings');

var dropdown = require('../modules/dropdowns');
var reportType = require('../templates/reports/reportType.hbs');


var aggregateCallbacks = {
  afterRender: tables.barsAfterRender.bind(undefined, undefined),
};

// DOM element and URL for building the state map
var $map = $('.state-map');
var mapUrl = helpers.buildUrl(
  ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
  {
    candidate_id: $map.data('candidate-id'),
    cycle: $map.data('cycle'),
    per_page: 99
  }
);

var expenditureColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['independent-expenditures'], function(data, type, row) {
      return {
        support_oppose_indicator: row.support_oppose_indicator,
        candidate_id: row.candidate_id,
      };
    })
  },
  columns.committeeColumn({
    data: 'committee',
    className: 'all'
  }),
  columns.supportOpposeColumn
];

var communicationCostColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['communication-costs'], function(data, type, row) {
      return {
        support_oppose_indicator: row.support_oppose_indicator,
        candidate_id: row.candidate_id,
      };
    })
  },
  columns.committeeColumn({
    data: 'committee',
    className: 'all'
  }),
  columns.supportOpposeColumn
];

var electioneeringColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['electioneering-communications'],
      function(data, type, row) {
        return {
          candidate_id: row.candidate_id
        };
      })
  },
  columns.committeeColumn({
    data: 'committee',
    className: 'all'
  })
];

var otherDocumentsColumns = [
  columnHelpers.urlColumn('pdf_url', {
    data: 'document_description',
    className: 'all column--medium',
    orderable: false
  }),
  {
    data: 'most_recent',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      var version = helpers.amendmentVersion(data);
      if (version === 'Version unknown') {
        return '<i class="icon-blank"></i>Version unknown<br>' +
          '<i class="icon-blank"></i>' + row.fec_file_id;
      } else {
        if (row.fec_file_id !== null) {
          version = version + '<br><i class="icon-blank"></i>' + row.fec_file_id;
        }
        return version;
      }
    }
  },
  columns.dateColumn({
    data: 'receipt_date',
    className: 'min-tablet'
  })
];

var itemizedDisbursementColumns = [
  {
    data: 'committee_id',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      return columnHelpers.buildEntityLink(
        row.committee.name,
        helpers.buildAppUrl(['committee', row.committee_id]),
        'committee'
      );
    }
  },
  {
    data: 'recipient_name',
    className: 'all',
    orderable: false,
  },
  {
    data: 'recipient_state',
    className: 'min-tablet hide-panel',
    orderable: false,
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
    className: 'column--number'
  }),
];

var individualContributionsColumns = [
  {
    data: 'contributor_name',
    className: 'all',
    orderable: false,
  },
  {
    data: 'committee',
    className: 'all',
    orderable: false,
    paginator: tables.SeekPaginator,
    render: function(data, type, row) {
      return columnHelpers.buildEntityLink(
        row.committee.name,
        helpers.buildAppUrl(['committee', row.committee_id]),
        'committee'
      );
    }
  },
  columns.dateColumn({
    data: 'contribution_receipt_date',
    className: 'min-tablet'
  }),
  columns.currencyColumn({
    data: 'contribution_receipt_amount',
    className: 'column--number'
  }),
];

var statementsOfCandidacyColumns = [
  columnHelpers.urlColumn('pdf_url', {
    data: 'document_description',
    className: 'all column--medium',
    orderable: false
  }),
  {
    data: 'document_description',
    className: 'all column--doc-download',
    orderable: false,
    render: function(data, type, row) {
      var doc_description = row.document_description ? row.document_description : row.form_type;
      var amendment_version = helpers.amendmentVersionDescription(row);
      var pdf_url = row.pdf_url ? row.pdf_url : null;
      var csv_url = row.csv_url ? row.csv_url : null;
      var fec_url = row.fec_url ? row.fec_url : null;
      var html_url = row.html_url ? row.html_url : null;

      // If it's a Form 3L we should append that to the doc title
      if (row.form_type == 'F3L') {
        doc_description = doc_description + ' - Lobbyist Bundling Report';
      }

      return {
        doc_description: doc_description,
        amendment_version: amendment_version,
        fec_url: fec_url,
        pdf_url: pdf_url,
        csv_url: csv_url,
        html_url: html_url
      };
    }
  },
  {
    data: 'most_recent',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      var version = helpers.amendmentVersion(data);
      if (version === 'Version unknown') {
        return '<i class="icon-blank"></i>Version unknown<br>' +
          '<i class="icon-blank"></i>' + row.fec_file_id;
      } else {
        if (row.fec_file_id !== null) {
          version = version + '<br><i class="icon-blank"></i>' + row.fec_file_id;
        }
        return version;
      }
    }
  },
  columns.dateColumn({
    data: 'receipt_date',
    className: 'min-tablet'
  }),
  {
  data: 'beginning_image_number',
  orderable: false,
  className: 'min-tablet hide-panel column--xs column--number',
  render: function(data, type, row) {
        return row.beginning_image_number;
      }
  }

]

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
  var $table = $('table[data-type="other-documents"]');
  var candidateId = $table.data('candidate');
  var path = ['filings'];
  tables.DataTable.defer($table, {
    path: path,
    query: {
      candidate_id: candidateId,
      form_type: ['F99','RFAI'],
      /* Performing an include would only show RFAI form types. For this reason, excludes need to be
         used for request_type

      Exclude all request types except for:
      // RQ-5: RFAI referencing Statement of Candidacy */
      request_type: ['-1','-2','-3','-4','-6','-7','-8','-9'],
      sort_hide_null: ['false']
    },
    columns: otherDocumentsColumns,
    order: [[2, 'desc']],
    dom: tables.simpleDOM,
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
  'electioneering': {
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
    var displayCycle = helpers.formatCycleRange($table.data('cycle'), $table.data('duration'));
    if(displayCycle == null) {
      displayCycle = "unspecified cycle";
    }
    if (opts) {
      tables.DataTable.defer($table, {
        path: opts.path,
        query: query,
        columns: opts.columns,
        order: [[0, 'desc']],
        dom: tables.simpleDOM,
        pagingType: 'simple',
        lengthChange: true,
        pageLength: 10,
        lengthMenu: [10, 50, 100],
        hideEmpty: true,
        hideEmptyOpts: {
          dataType: opts.title,
          email: WEBMANAGER_EMAIL,
          name: context.name,
          timePeriod: displayCycle,
          reason: helpers.missingDataReason(dataType)
        }
      });
    }
  });
}

function initDisbursementsTable() {
  var $table = $('table[data-type="itemized-disbursements"]');
  var path = ['schedules', 'schedule_b'];
  var committeeIdData = $table.data('committee-id');
  var committeeIds = "";
  if(committeeIdData) {
    committeeIds = committeeIdData.split(',').filter(Boolean);
  }
  var opts = {
    // possibility of multiple committees, so split into array
    committee_id: committeeIds,
    title: 'itemized disbursements',
    name: $table.data('name'),
    cycle: $table.data('cycle')
  };
  var displayCycle = helpers.formatCycleRange($table.data('cycle'), $table.data('duration'));
  if(displayCycle == null) {
    displayCycle = "unspecified cycle";
  }
  tables.DataTable.defer($table, {
    path: path,
    query: {
      committee_id: opts.committee_id,
      two_year_transaction_period: opts.cycle
    },
    columns: itemizedDisbursementColumns,
    order: [[4, 'desc']],
    dom: tables.simpleDOM,
    paginator: tables.SeekPaginator,
    lengthMenu: [10, 50, 100],
    useFilters: true,
    useExport: true,
    singleEntityItemizedExport: true,
    hideEmpty: true,
    hideEmptyOpts: {
      email: WEBMANAGER_EMAIL,
      dataType: opts.title,
      name: opts.name,
      timePeriod: displayCycle,
      reason: helpers.missingDataReason('disbursements')
    }
  });
}

function initContributionsTables() {
  var $allTransactions = $('table[data-type="individual-contributions"]');
  var $contributionSize = $('table[data-type="contribution-size"]');
  var $contributorState = $('table[data-type="contributor-state"]');
  var displayCycle = helpers.formatCycleRange($allTransactions.data('cycle'), 2);
  var candidateName = $allTransactions.data('name');
  var committeeIdData = $allTransactions.data('committee-id');
  var committeeIds = "";
  if(committeeIdData) {
    committeeIds = committeeIdData.split(',').filter(Boolean);
  }
  var opts = {
    // possibility of multiple committees, so split into array
    // also, filter array to remove any blank values
    committee_id: committeeIds,
    candidate_id: $allTransactions.data('candidate-id'),
    title: 'individual contributions',
    name: candidateName,
    cycle: $allTransactions.data('cycle'),
  };

  var reason = helpers.missingDataReason('contributions');

  tables.DataTable.defer($allTransactions, {
    path: ['schedules', 'schedule_a'],
    query: {
      committee_id: opts.committee_id,
      is_individual: true,
      two_year_transaction_period: opts.cycle
    },
    columns: individualContributionsColumns,
    order: [[2, 'desc']],
    dom: tables.simpleDOM,
    paginator: tables.SeekPaginator,
    useFilters: true,
    useExport: true,
    singleEntityItemizedExport: true,
    hideEmpty: true,
    hideEmptyOpts: {
      dataType: 'individual contributions',
      email: WEBMANAGER_EMAIL,
      name: candidateName,
      timePeriod: displayCycle,
      reason: reason
    }
  });

  tables.DataTable.defer($contributorState, {
    path: ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
    query: {
      candidate_id: opts.candidate_id,
      cycle: opts.cycle,
      sort_hide_null: false,
      per_page: 99
    },
    columns: [{
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
        render: columnHelpers.buildTotalLink(['receipts', 'individual-contributions'],
          function(data, type, row) {
            return {
              contributor_state: row.state,
              committee_id: opts.committee_id
            };
          }
        )
      }],
    callbacks: aggregateCallbacks,
    dom: 't',
    order: [[1, 'desc']],
    paging: false,
    scrollY: 400,
    scrollCollapse: true
  });

  tables.DataTable.defer($contributionSize, {
    path: ['schedules', 'schedule_a', 'by_size', 'by_candidate'],
    query: {
      candidate_id: opts.candidate_id,
      cycle: opts.cycle,
      sort: 'size'
    },
    columns: [{
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
        render: columnHelpers.buildTotalLink(['receipts', 'individual-contributions'],
          function(data, type, row) {
            var params = columnHelpers.getSizeParams(row.size);
            params.committee_id = opts.committee_id;
            return params;
          }
        )
      }],
    callbacks: aggregateCallbacks,
    dom: 't',
    order: false,
    pagingType: 'simple',
    lengthChange: false,
    pageLength: 10,
    hideEmpty: true,
    hideEmptyOpts: {
      dataType: 'individual contributions',
      email: WEBMANAGER_EMAIL,
      name: candidateName,
      timePeriod: displayCycle,
      reason: reason,
    }
  });
  // Set up state map
    mapsEvent.init($map, $contributorState);
}
function initStatementsOfCandidacyTable() {
  var $table = $('table[data-type="statements-of-candidacy"]');
  var candidateId = $table.data('candidate');
  var path = ['filings'];
  tables.DataTable.defer($table, {
    path: path,
    query: {
      candidate_id: candidateId,
      form_type: ['F2'],
      /* Performing an include would only show RFAI form types. For this reason, excludes need to be
         used for request_type

      Exclude all request types except for:
      // RQ-5: RFAI referencing Statement of Candidacy */
      request_type: ['-1','-2','-3','-4','-6','-7','-8','-9'],
      sort_hide_null: ['false']
    },
    columns: statementsOfCandidacyColumns,
    order: [[2, 'desc']],
    dom: tables.simpleDOM,
    pagingType: 'simple',
    lengthMenu: [10, 30, 50],
    hideEmpty: false
  });
}



$(document).ready(function() {
  var query = URI.parseQuery(window.location.search);

  initOtherDocumentsTable();
  initSpendingTables();
  initDisbursementsTable();
  initContributionsTables();
  initStatementsOfCandidacyTable();

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
});
