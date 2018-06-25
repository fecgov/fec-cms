'use strict';

var _ = require('underscore');

var columnHelpers = require('./column-helpers');
var tables = require('./tables');
var helpers = require('./helpers');
var decoders = require('./decoders');
var moment = require('moment');

var reportType = require('../templates/reports/reportType.hbs');

var dateColumn = columnHelpers.formattedColumn(helpers.datetime, {orderSequence: ['desc', 'asc']});
var currencyColumn = columnHelpers.formattedColumn(helpers.currency, {orderSequence: ['desc', 'asc']});
var barCurrencyColumn = columnHelpers.barColumn(helpers.currency);

var supportOpposeColumn = {
  data: 'support_oppose_indicator',
  render: function(data, type, row, meta) {
    return decoders.supportOppose[data] || 'Unknown';
  }
};

var versionColumn = {
  data: 'most_recent',
  className: 'hide-panel hide-efiling column--med min-desktop',
  orderable: false,
  render: function(data, type, row) {
    // RFAIs and FRQs should just show N/A because they can't be amended
    if (['RFAI', 'FRQ'].indexOf(row.form_type) >= 0) {
      return '<i class="icon-blank"></i>Not applicable';
    }
    var version = helpers.amendmentVersion(data);
    if (version === 'Version unknown') {
      return '<i class="icon-blank"></i>Version unknown<br>' +
             '<i class="icon-blank"></i>' + row.fec_file_id;
    }
    else {
      if (row.fec_file_id !== null) {
        version = version + '<br><i class="icon-blank"></i>' + row.fec_file_id;
      }
      return version;
    }
  }
};

var modalTriggerColumn = {
  className: 'all column--trigger',
  orderable: false,
  render: function(data, type, row, meta) {
    return tables.MODAL_TRIGGER_HTML;
  }
};

var receiptDateColumn = {
  data: 'receipt_date',
  className: 'min-tablet hide-panel column--small',
  orderable: true,
  render: function(data, type, row, meta) {
    var parsed;
    if (meta.settings.oInit.path.indexOf('efile') >= 0) {
      parsed = moment(row.receipt_date, 'YYYY-MM-DDTHH:mm:ss');
      return parsed.isValid() ? parsed.format('MM/DD/YYYY, h:mma') : 'Invalid date';
    } else {
      parsed = moment(row.receipt_date, 'YYYY-MM-DDTHH:mm:ss');
      return parsed.isValid() ? parsed.format('MM/DD/YYYY') : 'Invalid date';
    }
  }
};

var pagesColumn = {
  data: 'beginning_image_number',
  orderable: false,
  className: 'min-tablet hide-panel column--xs column--number',
  render: function(data, type, row) {
    // Image numbers in 2015 and later begin with YYYYMMDD,
    // which makes for a very big number.
    // This results in inaccurate subtraction
    // so instead we slice it after the first 8 digits
    // Earlier image numbers are only 11 digits, so we just leave those as-is
    var shorten = function(number) {
      if (number.toString().length === 18) {
        return Number(number.toString().slice(8));
      } else {
        return number;
      }
    };
    var pages = shorten(row.ending_image_number) - shorten(row.beginning_image_number) + 1;
    return pages.toLocaleString();
  }
};

var candidateColumn = columnHelpers.formattedColumn(function(data, type, row) {
  if (row) {
    return columnHelpers.buildEntityLink(row.candidate_name, helpers.buildAppUrl(['candidate', row.candidate_id]), 'candidate');
  } else {
    return '';
  }
});

var committeeColumn = columnHelpers.formattedColumn(function(data, type, row) {
  if (row) {
    return columnHelpers.buildEntityLink(row.committee_name, helpers.buildAppUrl(['committee', row.committee_id]), 'committee');
  } else {
    return '';
  }
});

var renderCandidateColumn = function(data, type, row, meta) {
  if (data) {
    return columnHelpers.buildEntityLink(
      data,
      helpers.buildAppUrl(['candidate', row.candidate_id]),
      'candidate');
  } else {
    return '';
  }
};

var renderCommitteeColumn = function(data, type, row, meta) {
  if (data) {
    return columnHelpers.buildEntityLink(
      data,
      helpers.buildAppUrl(['committee', row.committee_id]),
      'committee');
  } else {
    return '';
  }
};

var candidates = [
  {data: 'name', className: 'all', render: renderCandidateColumn},
  {data: 'office_full', className: 'min-tablet hide-panel-tablet'},
  {
    data: 'election_years',
    className: 'min-tablet hide-panel',
    render: function(data, type, row, meta) {
      return tables.yearRange(_.first(data), _.last(data));
    }
  },
  {data: 'party_full', className: 'min-tablet hide-panel'},
  {data: 'state', className: 'min-desktop hide-panel column--state'},
  {data: 'district', className: 'min-desktop hide-panel column--small'},
  {data: 'first_file_date', orderable: true, className: 'min-desktop hide-panel column--small'},
  modalTriggerColumn
];

var candidateOffice = {
  name:   {data: 'name', className: 'all', render: renderCandidateColumn},
  party: {data: 'party_full', className: 'min-desktop'},
  state: {data: 'state', className: 'min-tablet column--state hide-panel'},
  district: {data: 'district', className: 'min-desktop column--small hide-panel'},
  receipts: currencyColumn({data: 'receipts', className: 'min-tablet hide-panel column--number'}),
  disbursements: currencyColumn({data: 'disbursements', className: 'min-tablet hide-panel column--number'}),
  trigger: modalTriggerColumn
};

var committees = [
  {
    data: 'name',
    className: 'all',
    render: function(data, type, row, meta) {
      if (data) {
        return columnHelpers.buildEntityLink(
          data,
          helpers.buildAppUrl(['committee', row.committee_id], tables.getCycle(row.cycles, meta)),
          'committee');
      } else {
        return '';
      }
    }
  },
  {data: 'treasurer_name', className: 'min-desktop hide-panel'},
  {data: 'committee_type_full', className: 'min-tablet hide-panel'},
  {data: 'designation_full', className: 'min-tablet hide-panel'},
  {data: 'first_file_date', orderable: true, className: 'min-desktop hide-panel column--small'},
  modalTriggerColumn
];

var communicationCosts = [
  {
    data: 'committee_name',
    orderable: false,
    className: 'all',
    render: renderCommitteeColumn,
  },
  _.extend({}, supportOpposeColumn, {className: 'min-tablet hide-panel-tablet'}),
  {
    data: 'candidate_name',
    orderable: false,
    className: 'min-tablet hide-panel-tablet',
    render: renderCandidateColumn
  },
  currencyColumn({data: 'transaction_amount', className: 'min-tablet hide-panel column--number'}),
  dateColumn({data: 'transaction_date', className: 'min-tablet hide-panel column--small'}),
  modalTriggerColumn
];

var disbursements = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data, type, row, meta) {
      if (data) {
        return columnHelpers.buildEntityLink(
          data.name,
          helpers.buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  {
    data: 'recipient_name',
    orderable: false,
    className: 'all',
    render: function(data, type, row, meta) {
      var committee = row.recipient_committee;
      if (committee) {
        return columnHelpers.buildEntityLink(
          committee.name,
          helpers.buildAppUrl(['committee', committee.committee_id]),
          'committee'
        );
      } else {
        return data;
      }
    }
  },
  {data: 'recipient_state', orderable: false, className: 'min-desktop column--state hide-panel'},
  {data: 'disbursement_description', className: 'min-desktop hide-panel', orderable: false},
  dateColumn({data: 'disbursement_date', className: 'min-tablet hide-panel column--small'}),
  currencyColumn({data: 'disbursement_amount', className: 'min-tablet hide-panel column--number'}),
  modalTriggerColumn
];

var electioneeringCommunications = [
  {
    data: 'committee_name',
    orderable: false,
    className: 'all',
    render: renderCommitteeColumn
  },
  {
    data: 'candidate_name',
    orderable: false,
    className: 'min-desktop hide-panel-tablet',
    render: renderCandidateColumn
  },
  {
    data: 'number_of_candidates',
    className: 'min-desktop hide-panel column--small column--number',
  },
  currencyColumn({data: 'calculated_candidate_share', className: 'min-desktop hide-panel column--number'}),
  dateColumn({data: 'disbursement_date', className: 'min-tablet hide-panel column--small'}),
  currencyColumn({data: 'disbursement_amount', className: 'min-tablet hide-panel column--number'}),
  modalTriggerColumn
];

var filings = {
  filer_name: {
    data: 'committee_id',
    className: 'all',
    orderable: false,
    render: function(data, type, row, meta) {
      var cycle = tables.getCycle([row.cycle], meta);
      if (row.candidate_name) {
        return columnHelpers.buildEntityLink(
          row.candidate_name,
          helpers.buildAppUrl(['candidate', row.candidate_id], cycle),
          'candidate'
        );
      } else if (row.committee_name) {
        return columnHelpers.buildEntityLink(
          row.committee_name,
          helpers.buildAppUrl(['committee', row.committee_id], cycle),
          'committee'
        );
      } else {
        return '';
      }
    },
  },
  pdf_url: columnHelpers.urlColumn('pdf_url', {
    // This is just used by the committee pages because those tables
    // are too narrow to support the combo button
    data: 'document_description',
    className: 'all',
    orderable: false
  }),
  document_type: {
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
  pages: pagesColumn,
  version: versionColumn,
  receipt_date: receiptDateColumn,
  receipt_date_unorderable: {
    data: 'receipt_date',
    className: 'min-tablet hide-panel column--small',
    orderable: false,
    render: function(data, type, row) {
      var parsed = moment(row.receipt_date, 'YYYY-MM-DDTHH:mm:ss');
      return parsed.isValid() ? parsed.format('MM/DD/YYYY') : 'Invalid date';
    }
  },
  beginning_image_number: {
    data: 'beginning_image_number',
    orderable: false
  },
  coverage_start_date: dateColumn({data: 'coverage_start_date', className: 'min-tablet hide-panel column--small', orderable: false}),
  coverage_end_date: dateColumn({data: 'coverage_end_date', className: 'min-tablet hide-panel column--small', orderable: false}),
  total_receipts: currencyColumn({data: 'total_receipts', className: 'min-desktop hide-panel column--number'}),
  total_disbursements: currencyColumn({data: 'total_disbursements', className: 'min-desktop hide-panel column--number'}),
  total_independent_expenditures: currencyColumn({data: 'total_independent_expenditures', className: 'min-desktop hide-panel column--number'}),
  modal_trigger: {
    className: 'all column--trigger hide-efiling',
    orderable: false,
    render: function(data, type, row) {
      if (row.form_type && row.form_type.match(/^F[35][XP]?$/)) {
        return tables.MODAL_TRIGGER_HTML;
      } else {
        return '';
      }
    }
  }
};

var independentExpenditures = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data, type, row, meta) {
      if (data) {
        return columnHelpers.buildEntityLink(
          data.name,
          helpers.buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  _.extend({}, supportOpposeColumn, {className: 'min-tablet hide-panel-tablet'}),
  {
    data: 'candidate_name',
    orderable: false,
    className: 'min-tablet hide-panel-table',
    render: function(data, type, row, meta) {
      if (row.candidate_id) {
        return columnHelpers.buildEntityLink(
          data,
          helpers.buildAppUrl(['candidate', row.candidate_id], tables.getCycle(row, meta)),
          'candidate'
        );
      } else {
        return row.candidate_name;
      }
    }
  },
  columnHelpers.urlColumn('pdf_url', {data: 'expenditure_description', className: 'min-desktop hide-panel', orderable: false}),
  {
    data: 'payee_name',
    orderable: false,
    className: 'min-desktop hide-panel'
  },
  dateColumn({data: 'expenditure_date', className: 'min-tablet hide-panel column--small'}),
  currencyColumn({data: 'expenditure_amount', className: 'min-tablet hide-panel column--number'}),
  modalTriggerColumn
];

var individualContributions = [
  {
    data: 'contributor',
    orderable: false,
    className: 'all hide-panel-tablet',
    render: function(data, type, row, meta) {
        if(data &&  !(_.contains(helpers.globals.EARMARKED_CODES, row.receipt_type))){
        return columnHelpers.buildEntityLink(
          data.name,
          helpers.buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return row.contributor_name;
      }
    }
  },
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data, type, row, meta) {
      if (data) {
        return columnHelpers.buildEntityLink(
          data.name,
          helpers.buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  {data: 'contributor_state', orderable: false, className: 'min-desktop hide-panel column--state '},
  {data: 'contributor_employer', orderable: false, className: 'min-desktop hide-panel'},
  dateColumn({data: 'contribution_receipt_date', className: 'min-tablet hide-panel column--small'}),
  currencyColumn({data: 'contribution_receipt_amount', className: 'min-tablet hide-panel column--number'}),
  modalTriggerColumn
];

var partyCoordinatedExpenditures = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data, type, row) {
      if (data) {
        return columnHelpers.buildEntityLink(
          data.name,
          helpers.buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  {
    data: 'candidate_name',
    orderable: false,
    className: 'min-tablet hide-panel-tablet',
    render: function(data, type, row) {
      if (row.candidate_id) {
        return columnHelpers.buildEntityLink(
          data,
          helpers.buildAppUrl(['candidate', row.candidate_id]),
          'candidate'
        );
      } else {
        return row.candidate_name;
      }
    }
  },
  {
    data: 'payee_name',
    orderable: false,
    className: 'min-desktop hide-panel'
  },
  dateColumn({data: 'expenditure_date', className: 'min-tablet hide-panel column--small'}),
  currencyColumn({data: 'expenditure_amount', className: 'min-tablet hide-panel column--number'}),
  modalTriggerColumn
];

var receipts = [
  {
    data: 'contributor',
    orderable: false,
    className: 'all',
    render: function(data, type, row, meta) {
        if(data &&  !(_.contains(helpers.globals.EARMARKED_CODES, row.receipt_type))){
        return columnHelpers.buildEntityLink(
          data.name,
          helpers.buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
       }
      else {
        return row.contributor_name;
      }
    }
  },
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data, type, row, meta) {
      if (data) {
        return columnHelpers.buildEntityLink(
          data.name,
          helpers.buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  {
    data: 'fec_election_type_desc',
    orderable: false,
    className: 'min-desktop',
  },
  {data: 'contributor_state', orderable: false, className: 'min-desktop hide-panel column--state'},
  dateColumn({data: 'contribution_receipt_date', className: 'min-tablet hide-panel column--small'}),
  currencyColumn({data: 'contribution_receipt_amount', className: 'min-tablet hide-panel column--number'}),
  modalTriggerColumn
];

var reports = {
  committee:   {
    data: 'committee_name',
    orderable: false,
    className: 'all',
    render: renderCommitteeColumn
  },
  document_type: {
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

      return reportType({
        doc_description: doc_description,
        amendment_version: amendment_version,
        pdf_url: pdf_url,
        fec_url: fec_url,
        csv_url: csv_url,
        html_url: html_url
      });
    }
  },
  version: versionColumn,
  receipt_date: receiptDateColumn,
  coverage_start_date: dateColumn({
    data: 'coverage_start_date',
    className: 'min-tablet hide-panel column--small',
    orderable: true
  }),
  coverage_end_date: dateColumn({
    data: 'coverage_end_date',
    className: 'min-tablet hide-panel column--small',
    orderable: true
  }),
  receipts: currencyColumn({
    data: 'total_receipts_period',
    className: 'min-desktop hide-panel column--number'
  }),
  disbursements: currencyColumn({
    data: 'total_disbursements_period',
    className: 'min-desktop hide-panel column--number'
  }),
  independentExpenditures: currencyColumn({
    data: 'independent_expenditures_period',
    className: 'min-desktop hide-panel column--number'
  }),
  contributions: currencyColumn({
    data: 'independent_contributions_period',
    className: 'min-desktop hide-panel column--number'
  }),
  trigger: {
    className: 'all column--trigger',
    orderable: false,
    render: function() {
      return tables.MODAL_TRIGGER_HTML;
    }
  }
};

var loans = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function (data) {
      if (data) {
        return columnHelpers.buildEntityLink(
          data.name,
          helpers.buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  {
    data: 'loan_source_name',
    orderable: false,
    className: 'all',
  },
  dateColumn({data: 'incurred_date', orderable: true, className: 'min-tablet hide-panel column--small'}),
  currencyColumn({data: 'payment_to_date', className: 'min-desktop hide-panel column--number'}),
  currencyColumn({data: 'original_loan_amount', className: 'min-desktop hide-panel column--number'}),
  modalTriggerColumn
];

var audit = [
  columnHelpers.urlColumn
  ('link_to_report',
    {
      data: 'committee_name',
      className: 'all align-top',
      orderable: true
    }
  ),

  {
    data: 'cycle',
    className: 'all align-top',
    orderable: true
  },

  {
    data: 'far_release_date',
    className: 'min-tablet hide-panel column--small align-top',
    orderable: true,
    render: function(data, type, row) {
      var parsed;
      parsed = moment(row.far_release_date, 'YYYY-MM-DD');
      return parsed.isValid() ? parsed.format('MM/DD/YYYY') : 'Invalid date';
    }
  },

  {
    data: 'primary_category_list',
    className: 'all align-top',
    orderable: false,
    render: function (data){
      if (data) {
        var html = '<ol class="list--numbered">'
        for(var i in data){
          html += '<li>' + data[i]['primary_category_name'] + '<ol>'
          for(var j in data[i]['sub_category_list']){
            html += '<li>'+ data[i]['sub_category_list'][j]['sub_category_name'] + '</li>'
          }
          html += '</ol></li>'
        }
        return html + '</ol>'
      }
      else {
        return '';
      }
    }
  },

  {
    data: 'candidate_name',
    className: 'min-tablet hide-panel column--small align-top',
    orderable: true
  },
];

function makeCommitteeColumn(opts, context, factory) {
  return _.extend({}, {
    orderSequence: ['desc', 'asc'],
    className: 'column--number',
    render: columnHelpers.buildTotalLink(['receipts', 'individual-contributions'], function(data, type, row, meta) {
      row.cycle = context.election.cycle;
      var column = meta.settings.aoColumns[meta.col].data;
      return _.extend({
        committee_id: (context.candidates[row.candidate_id] || {}).committee_ids,
        two_year_transaction_period: row.cycle,
      }, factory(data, type, row, meta, column));
    })
  }, opts);
}

var makeSizeColumn = _.partial(makeCommitteeColumn, _, _, function(data, type, row, meta, column) {
  return columnHelpers.getSizeParams(column);
});

function sizeColumns(context) {
  return [
    {
      data: 'candidate_name',
      className: 'all',
      width: 'column--med',
      render: function(data, type, row, meta) {
        return columnHelpers.buildEntityLink(
          data,
          helpers.buildAppUrl(['candidate', row.candidate_id]),
          'candidate'
        );
      }
    },
    makeSizeColumn({data: '0'}, context),
    makeSizeColumn({data: '200'}, context),
    makeSizeColumn({data: '500'}, context),
    makeSizeColumn({data: '1000'}, context),
    makeSizeColumn({data: '2000'}, context)
  ];
}

function stateColumns(results, context) {
  var stateColumn = {'data': 'state'};
  var columns = _.map(results, function(result) {
    return makeCommitteeColumn(
      {data: result.candidate_id},
      context,
      function(data, type, row, meta, column) {
        return {
          contributor_state: row.state,
          committee_id: (context.candidates[column] || {}).committee_ids,
          is_individual: 'true'
        };
      }
    );
  });

  return [stateColumn].concat(columns);
}

module.exports = {
  candidateColumn: candidateColumn,
  committeeColumn: committeeColumn,
  dateColumn: dateColumn,
  currencyColumn: currencyColumn,
  barCurrencyColumn: barCurrencyColumn,
  supportOpposeColumn: supportOpposeColumn,
  candidates: candidates,
  candidateOffice: candidateOffice,
  committees: committees,
  communicationCosts: communicationCosts,
  disbursements: disbursements,
  electioneeringCommunications: electioneeringCommunications,
  independentExpenditures: independentExpenditures,
  individualContributions: individualContributions,
  partyCoordinatedExpenditures: partyCoordinatedExpenditures,
  filings: filings,
  receipts: receipts,
  reports: reports,
  loans: loans,
  audit: audit,
  sizeColumns: sizeColumns,
  stateColumns: stateColumns
};
