import { default as moment } from 'moment';
import { default as _contains } from 'underscore/modules/contains.js';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as _first } from 'underscore/modules/first.js';
import { default as _last } from 'underscore/modules/last.js';

import { barColumn, buildEntityLink, formattedColumn, urlColumn } from './column-helpers.js';
import { supportOppose } from './decoders.js';
import { amendmentVersion, amendmentVersionDescription, buildAppUrl, currency, datetime, globals } from './helpers.js';
import { MODAL_TRIGGER_HTML, getCycle, yearRange } from './tables.js';
import { default as reportType } from '../templates/reports/reportType.hbs';

export const dateColumn = formattedColumn(datetime, {
  orderSequence: ['desc', 'asc']
});
export const currencyColumn = formattedColumn(currency, {
  orderSequence: ['desc', 'asc']
});
export const barCurrencyColumn = barColumn(currency);

export const supportOpposeColumn = {
  data: 'support_oppose_indicator',
  render: function(data) {
    return supportOppose[data] || 'Unknown';
  }
};

const versionColumn = {
  data: 'most_recent',
  className: 'hide-panel hide-efiling column--med min-desktop',
  orderable: false,
  render: function(data, type, row) {
    // RFAIs and FRQs should just show N/A because they can't be amended
    if (['RFAI', 'FRQ'].indexOf(row.form_type) >= 0) {
      return '<i class="icon-blank"></i>Not applicable';
    }
    let version = amendmentVersion(data);
    if (version === 'Version unknown') {
      return (
        '<i class="icon-blank"></i>Version unknown<br>' +
        '<i class="icon-blank"></i>' +
        row.fec_file_id
      );
    } else {
      if (row.fec_file_id !== null) {
        version = version + '<br><i class="icon-blank"></i>' + row.fec_file_id;
      }
      return version;
    }
  }
};

const modalTriggerColumn = {
  className: 'all column--trigger',
  orderable: false,
  render: function() {
    return MODAL_TRIGGER_HTML;
  }
};

const receiptDateColumn = {
  data: 'receipt_date',
  className: 'min-tablet hide-panel column--small',
  orderable: true,
  render: function(data, type, row, meta) {
    let parsed;
    if (meta.settings.oInit.path.indexOf('efile') >= 0) {
      parsed = moment(row.receipt_date, 'YYYY-MM-DDTHH:mm:ss');
      return parsed.isValid()
        ? parsed.format('MM/DD/YYYY, h:mma')
        : 'Invalid date';
    } else {
      parsed = moment(row.receipt_date, 'YYYY-MM-DDTHH:mm:ss');
      return parsed.isValid() ? parsed.format('MM/DD/YYYY') : 'Invalid date';
    }
  }
};

const pagesColumn = {
  data: 'beginning_image_number',
  orderable: false,
  className: 'min-tablet hide-panel column--xs column--number',
  render: function(data, type, row) {
    // Image numbers in 2015 and later begin with YYYYMMDD,
    // which makes for a very big number.
    // This results in inaccurate subtraction
    // so instead we slice it after the first 8 digits
    // Earlier image numbers are only 11 digits, so we just leave those as-is
    const shorten = function(number) {
      if (number.toString().length === 18) {
        return Number(number.toString().slice(8));
      } else {
        return number;
      }
    };
    const pages =
      shorten(row.ending_image_number) -
      shorten(row.beginning_image_number) +
      1;
    return pages.toLocaleString();
  }
};

export const candidateColumn = formattedColumn(function(data, type, row) {
  if (row) {
    return buildEntityLink(
      row.candidate_name,
      buildAppUrl(['candidate', row.candidate_id]),
      'candidate'
    );
  } else {
    return '';
  }
});

export const committeeColumn = formattedColumn(function(data, type, row) {
  if (row) {
    return buildEntityLink(
      row.committee_name,
      buildAppUrl(['committee', row.committee_id]),
      'committee'
    );
  } else {
    return '';
  }
});

const renderCandidateColumn = function(data, type, row) {
  if (data) {
    return buildEntityLink(
      data,
      buildAppUrl(['candidate', row.candidate_id]),
      'candidate'
    );
  } else {
    return '';
  }
};

const renderCandidateCycleColumn = function(data, type, row) {
  if (data) {
    const latest_year = row.election_years[row.election_years.length - 1];
    return buildEntityLink(
      data,
      buildAppUrl(['candidate', row.candidate_id], {
        cycle: latest_year % 2 === 0 ? latest_year : latest_year + 1,
        election_full: true
      }),
      'candidate'
    );
  } else {
    return '';
  }
};

const renderCommitteeColumn = function(data, type, row) {
  if (data) {
    return buildEntityLink(
      data,
      buildAppUrl(['committee', row.committee_id]),
      'committee'
    );
  } else {
    return '';
  }
};

export const candidates = [
  { data: 'name', className: 'all', render: renderCandidateCycleColumn },
  { data: 'office_full', className: 'min-tablet hide-panel-tablet' },
  {
    data: 'election_years',
    className: 'min-tablet hide-panel',
    render: function(data) {
      return yearRange(_first(data), _last(data));
    }
  },
  { data: 'party_full', className: 'min-tablet hide-panel' },
  { data: 'state', className: 'min-desktop hide-panel column--state' },
  { data: 'district', className: 'min-desktop hide-panel column--small' },
  {
    data: 'first_file_date',
    orderable: true,
    className: 'min-desktop hide-panel column--small'
  },
  modalTriggerColumn
];

export const candidateOffice = {
  name: { data: 'name', className: 'all', render: renderCandidateColumn },
  party: { data: 'party_full', className: 'min-desktop' },
  state: { data: 'state', className: 'min-tablet column--state hide-panel' },
  district: {
    data: 'district',
    className: 'min-desktop column--small hide-panel'
  },
  receipts: currencyColumn({
    data: 'receipts',
    className: 'min-tablet hide-panel column--number t-mono'
  }),
  disbursements: currencyColumn({
    data: 'disbursements',
    className: 'min-tablet hide-panel column--number t-mono'
  }),
  trigger: modalTriggerColumn
};

export const committees = [
  {
    data: 'name',
    className: 'all',
    render: function(data, type, row, meta) {
      if (data) {
        return buildEntityLink(
          data,
          buildAppUrl(
            ['committee', row.committee_id],
            getCycle(row.cycles, meta)
          ),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  { data: 'committee_id', orderable: false, className: 'all' },
  { data: 'treasurer_name', className: 'min-desktop hide-panel' },
  { data: 'committee_type_full', className: 'min-tablet hide-panel' },
  { data: 'designation_full', className: 'min-tablet hide-panel' },
  {
    data: 'first_f1_date',
    orderable: true,
    className: 'min-desktop hide-panel column--small'
  },
  modalTriggerColumn
];

export const communicationCosts = [
  {
    data: 'committee_name',
    orderable: false,
    className: 'all',
    render: renderCommitteeColumn
  },
  _extend({}, supportOpposeColumn, {
    className: 'min-tablet hide-panel-tablet'
  }),
  {
    data: 'candidate_name',
    orderable: false,
    className: 'min-tablet hide-panel-tablet',
    render: renderCandidateColumn
  },
  currencyColumn({
    data: 'transaction_amount',
    className: 'min-tablet hide-panel column--number t-mono'
  }),
  dateColumn({
    data: 'transaction_date',
    className: 'min-tablet hide-panel column--small'
  }),
  modalTriggerColumn
];

export const disbursements = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data) {
      if (data) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id]),
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
    render: function(data, type, row) {
      const committee = row.recipient_committee;
      if (committee) {
        return buildEntityLink(
          committee.name,
          buildAppUrl(['committee', committee.committee_id]),
          'committee'
        );
      } else {
        return data;
      }
    }
  },
  {
    data: 'recipient_state',
    orderable: false,
    className: 'min-desktop column--state hide-panel'
  },
  {
    data: 'disbursement_description',
    className: 'min-desktop hide-panel',
    orderable: false
  },
  dateColumn({
    data: 'disbursement_date',
    className: 'min-tablet hide-panel column--small'
  }),
  currencyColumn({
    data: 'disbursement_amount',
    className: 'min-tablet hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const allocatedFederalNonfederalDisbursements = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data) {
      if (data) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id])
        );
      } else {
        return data.name;
      }
    }
  },
  {
    data: 'payee_name',
    orderable: false,
    className: 'all',
    render: function(data, type, row) {
      const committee = row.recipient_committee;
      if (committee) {
        return buildEntityLink(
          committee.name,
          buildAppUrl(['committee', committee.committee_id]),
          'committee'
        );
      } else {
        return data;
      }
    }
  },
  {
    data: 'disbursement_purpose',
    className: 'min-desktop hide-panel',
    orderable: false
  },
  currencyColumn({
    data: 'federal_share',
    className: 'min-tablet hide-panel column--number t-mono',
    orderable: true
  }),
  currencyColumn({
    data: 'nonfederal_share',
    className: 'min-tablet hide-panel column--number t-mono',
    orderable: true
  }),
  currencyColumn({
    data: 'disbursement_amount',
    className: 'min-tablet hide-panel column--number t-mono',
    orderable: true
  }),
  dateColumn({
    data: 'event_purpose_date',
    className: 'min-tablet hide-panel column--small',
    orderable: true
  }),
  modalTriggerColumn
];

export const electioneeringCommunications = [
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
    className: 'min-desktop hide-panel column--small column--number t-mono'
  },
  currencyColumn({
    data: 'calculated_candidate_share',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  dateColumn({
    data: 'disbursement_date',
    className: 'min-tablet hide-panel column--small'
  }),
  currencyColumn({
    data: 'disbursement_amount',
    className: 'min-tablet hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const filings = {
  filer_name: {
    data: 'committee_id',
    className: 'all',
    orderable: false,
    render: function(data, type, row, meta) {
      const cycle = getCycle([row.cycle], meta);
      if (row.candidate_name) {
        return buildEntityLink(
          row.candidate_name,
          buildAppUrl(['candidate', row.candidate_id], cycle),
          'candidate'
        );
        // If committee ID is actually a candidate ID, use 'candidate' in URI
      } else if (row.committee_id.match(/^[H, S, P]+\w+$/)) {
        return buildEntityLink(
          row.committee_name,
          buildAppUrl(['candidate', row.committee_id], cycle),
          'committee'
        );
      } else if (row.committee_name) {
        return buildEntityLink(
          row.committee_name,
          buildAppUrl(['committee', row.committee_id], cycle),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  pdf_url: urlColumn('pdf_url', {
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
      let doc_description = row.document_description
        ? row.document_description
        : row.form_type;
      const amendment_version = amendmentVersionDescription(row);
      const pdf_url = row.pdf_url ? row.pdf_url : null;
      const csv_url = row.csv_url ? row.csv_url : null;
      const fec_url = row.fec_url ? row.fec_url : null;
      const html_url = row.html_url ? row.html_url : null;

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
      const parsed = moment(row.receipt_date, 'YYYY-MM-DDTHH:mm:ss');
      return parsed.isValid() ? parsed.format('MM/DD/YYYY') : 'Invalid date';
    }
  },
  beginning_image_number: {
    data: 'beginning_image_number',
    orderable: false
  },
  coverage_start_date: dateColumn({
    data: 'coverage_start_date',
    className: 'min-tablet hide-panel column--small',
    orderable: false
  }),
  coverage_end_date: dateColumn({
    data: 'coverage_end_date',
    className: 'min-tablet hide-panel column--small',
    orderable: false
  }),
  total_receipts: currencyColumn({
    data: 'total_receipts',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  total_disbursements: currencyColumn({
    data: 'total_disbursements',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  total_independent_expenditures: currencyColumn({
    data: 'total_independent_expenditures',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  modal_trigger: {
    className: 'all column--trigger hide-efiling',
    orderable: false,
    render: function(data, type, row) {
      if (row.form_type && row.form_type.match(/^F[35][XP]?$/)) {
        return MODAL_TRIGGER_HTML;
      } else {
        return '';
      }
    }
  }
};

export const independentExpenditures = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data) {
      if (data) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  _extend({}, supportOpposeColumn, {
    className: 'min-tablet hide-panel-tablet'
  }),
  {
    data: 'candidate_name',
    orderable: false,
    className: 'min-tablet hide-panel-table',
    render: function(data, type, row, meta) {
      if (row.candidate_id) {
        return buildEntityLink(
          data,
          buildAppUrl(
            ['candidate', row.candidate_id],
            getCycle(row, meta)
          ),
          'candidate'
        );
      } else {
        return row.candidate_name;
      }
    }
  },
  urlColumn('pdf_url', {
    data: 'expenditure_description',
    className: 'min-desktop hide-panel',
    orderable: false
  }),
  {
    data: 'payee_name',
    orderable: false,
    className: 'min-desktop hide-panel'
  },
  dateColumn({
    data: 'expenditure_date',
    className: 'min-tablet hide-panel column--small'
  }),
  currencyColumn({
    data: 'expenditure_amount',
    className: 'min-tablet hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const individualContributions = [
  {
    data: 'contributor',
    orderable: false,
    className: 'all hide-panel-tablet',
    render: function(data, type, row) {
      if (
        data &&
        !_contains(globals.EARMARKED_CODES, row.receipt_type)
      ) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id]),
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
    render: function(data) {
      if (data) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  {
    data: 'contributor_state',
    orderable: false,
    className: 'min-desktop hide-panel column--state '
  },
  {
    data: 'contributor_employer',
    orderable: false,
    className: 'min-desktop hide-panel'
  },
  dateColumn({
    data: 'contribution_receipt_date',
    className: 'min-tablet hide-panel column--small'
  }),
  currencyColumn({
    data: 'contribution_receipt_amount',
    className: 'min-tablet hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const partyCoordinatedExpenditures = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data) {
      if (data) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id]),
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
        return buildEntityLink(
          data,
          buildAppUrl(['candidate', row.candidate_id]),
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
  dateColumn({
    data: 'expenditure_date',
    className: 'min-tablet hide-panel column--small'
  }),
  currencyColumn({
    data: 'expenditure_amount',
    className: 'min-tablet hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const receipts = [
  {
    data: 'contributor',
    orderable: false,
    className: 'all',
    render: function(data, type, row) {
      if (
        data &&
        !_contains(globals.EARMARKED_CODES, row.receipt_type)
      ) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id]),
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
    render: function(data) {
      if (data) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id]),
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
    className: 'min-desktop'
  },
  {
    data: 'contributor_state',
    orderable: false,
    className: 'min-desktop hide-panel column--state'
  },
  dateColumn({
    data: 'contribution_receipt_date',
    className: 'min-tablet hide-panel column--small'
  }),
  currencyColumn({
    data: 'contribution_receipt_amount',
    className: 'min-tablet hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const reports = {
  committee: {
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
      const doc_description = row.document_description
        ? row.document_description
        : row.form_type;
      const amendment_version = amendmentVersionDescription(row);
      const pdf_url = row.pdf_url ? row.pdf_url : null;
      const csv_url = row.csv_url ? row.csv_url : null;
      const fec_url = row.fec_url ? row.fec_url : null;
      const html_url = row.html_url ? row.html_url : null;

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
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  disbursements: currencyColumn({
    data: 'total_disbursements_period',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  independentExpenditures: currencyColumn({
    data: 'independent_expenditures_period',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  contributions: currencyColumn({
    data: 'independent_contributions_period',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  trigger: {
    className: 'all column--trigger',
    orderable: false,
    render: function() {
      return MODAL_TRIGGER_HTML;
    }
  }
};

export const loans = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data) {
      if (data) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id]),
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
    className: 'all'
  },
  dateColumn({
    data: 'incurred_date',
    orderable: true,
    className: 'min-tablet hide-panel column--small'
  }),
  currencyColumn({
    data: 'payment_to_date',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  currencyColumn({
    data: 'original_loan_amount',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const debts = [
  {
    data: 'committee',
    orderable: false,
    className: 'all',
    render: function(data) {
      if (data) {
        return buildEntityLink(
          data.name,
          buildAppUrl(['committee', data.committee_id]),
          'committee'
        );
      } else {
        return '';
      }
    }
  },
  {
    data: 'creditor_debtor_name',
    className: 'all'
  },
  currencyColumn({
    data: 'outstanding_balance_beginning_of_period',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  currencyColumn({
    data: 'outstanding_balance_close_of_period',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  dateColumn({
    data: 'coverage_end_date',
    className: 'min-tablet hide-panel column--small'
  }),
  modalTriggerColumn
];

export const pac_party = [
  {
    data: 'committee_name',
    orderable: true,
    className: 'all',
    render: function(data, type, row) {
      if (data) {
        return buildEntityLink(
          data,
          buildAppUrl(['committee', row.committee_id])
        );
      } else {
        return '';
      }
    }
  },
  {
    data: 'committee_type_full',
    className: 'all'
  },
  currencyColumn({
    data: 'receipts',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  currencyColumn({
    data: 'disbursements',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  currencyColumn({
    data: 'last_cash_on_hand_end_period',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const audit = [
  urlColumn('link_to_report', {
    data: 'committee_name',
    className: 'all align-top',
    orderable: true
  }),

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
      let parsed;
      parsed = moment(row.far_release_date, 'YYYY-MM-DD');
      return parsed.isValid() ? parsed.format('MM/DD/YYYY') : 'Invalid date';
    }
  },

  {
    data: 'primary_category_list',
    className: 'all align-top',
    orderable: false,
    render: function(data) {
      if (data) {
        let html = '<ol class="list--numbered">';
        for (let i in data) {
          html += '<li>' + data[i]['primary_category_name'] + '<ol>';
          for (let j in data[i]['sub_category_list']) {
            html +=
              '<li>' +
              data[i]['sub_category_list'][j]['sub_category_name'] +
              '</li>';
          }
          html += '</ol></li>';
        }
        return html + '</ol>';
      } else {
        return '';
      }
    }
  },

  {
    data: 'candidate_name',
    className: 'min-tablet hide-panel column--small align-top',
    orderable: true
  }
];

export const nationalPartyReceipts = [
  {
    data: 'committee_name',
    className: 'all',
    orderable: false,
    render: renderCommitteeColumn
  },
  {
    data: 'contributor_name',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      // We want to link the committee ID,
      // but only if there's a contributor_id AND entity_type isn't an individual
      if (data) {
        if (!row.contributor_id || row.entity_type == 'IND') return row.contributor_name;
        else {
          return buildEntityLink(
            data,
            buildAppUrl(
              ['committee', row.contributor_id]
            ),
            'committee'
          );
        }
      }
    }
  },
  {
    data: 'party_account_type',
    className: 'all',
    orderable: false
  },
  dateColumn({
    data: 'contribution_receipt_date',
    className: 'min-tablet hide-panel column--small'
  }),
  currencyColumn({
    data: 'contribution_receipt_amount',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const nationalPartyDisbursements = [
  {
    data: 'committee_name',
    className: 'all',
    orderable: false,
    render: renderCommitteeColumn
  },
  {
    data: 'recipient_name',
    className: 'all align-top',
    orderable: false,
    render: function(data, type, row) {
      // We want to link the recipient name column to the committee if it is a committee
      if (data) {
        if (!row.recipient_committee_id) return row.recipient_name;
        else {
          return buildEntityLink(
            data,
            buildAppUrl(
              ['committee', row.recipient_committee_id]
            ),
            'committee'
          );
        }
      }
    }
  },
  {
    data: 'party_account',
    className: 'all',
    orderable: false
  },
  {
    data: 'disbursement_description',
    className: 'all',
    orderable: false
  },
  dateColumn({
    data: 'disbursement_date',
    className: 'min-tablet hide-panel column--small'
  }),
  currencyColumn({
    data: 'disbursement_amount',
    className: 'min-desktop hide-panel column--number t-mono'
  }),
  modalTriggerColumn
];

export const rulemakings = [
  {
    data: 'rm_no',
    className: 'all align-top t-bold',
    orderable: true,
    render: function(data, type, row) {
      return row.rm_number;
    }
  },
  {
    data: null,
    className: 'all column--rulemaking-docs align-top',
    orderable: false,
    render: function (data, type, row) {
      let html = `<p><b>${row.rm_name}</b>`;

      if (row.key_documents && row.key_documents.length ) {
        html += `<br><span class="icon icon--inline--left i-document"></span>`;
        html +=
          buildEntityLink(
            row.key_documents[0].doc_type_label, row.key_documents[0].url, row.key_documents[0].doc_type_label);
            if (row.key_documents[0].doc_date !== null) {
                const doc_date = moment(row.key_documents[0].doc_date).format('MM/DD/YYYY');
                html += ` | ${doc_date}`;
            }
      }
        html += `</p>`;
        html += `<ul>`;
      if (row.documents && row.documents.length && get_doc_ids().length ) {
        for (let id of get_doc_ids()) {
          for (let doc of row.documents) {
            if (doc.doc_category_id == id) {

                html += `<li class="document-container">
                          <div class="document-details">`;

                html += `<div class="post--icon">
                        <span class="icon icon--inline--left i-document"></span>`;
                html +=
                buildEntityLink(
                    doc.doc_type_label, doc.url, doc.doc_type_label);
                    html += `</div>`;
                    let parsed;
                    parsed = moment(doc.doc_date, 'YYYY-MM-DD');
                    const doc_date = parsed.isValid() ? parsed.format('MM/DD/YYYY') : 'Invalid date';
                    html += `<div class="tag tag--primary">${doc.doc_category_label}</div>
                            </div>
                            <div class="document-date">
                            ${doc_date}
                            </div>
                            </li>`;
            }

            if (doc.level_2_labels && doc.level_2_labels.length) {

              for (let label of doc.level_2_labels) {

                for (let i of label.level_2_docs) {

                  if (i.doc_category_id == id) {

                    html += `<li class="document-container">
                            <div class="document-details">`;

                    html += `<div class="post--icon">
                            <span class="icon icon--inline--left i-document"></span>`;
                    html +=
                    buildEntityLink(
                        i.doc_type_label, i.url, i.doc_type_label);
                        html += `</div>`;
                        let parsed;
                        parsed = moment(i.doc_date, 'YYYY-MM-DD');
                        const doc_date = parsed.isValid() ? parsed.format('MM/DD/YYYY') : 'Invalid date';
                        html += `<div class="tag tag--primary">${i.doc_category_label}</div>
                                </div>
                                <div class="document-date">
                                ${doc_date}
                                </div>
                                </li>`;

                  }
                }
              }
            }
          }
        }
      }
      // TODO: Ask to check with OGC if no_tier documents should be included in doc type filter results
      if (row.no_tier_documents && row.no_tier_documents.length) {
        for (let id of get_doc_ids()) {
          for (let doc of row.no_tier_documents ) {
            if (doc.doc_category_id == id) {

                html += `<li class="document-container">
                          <div class="document-details">`;

                html += `<div class="post--icon">
                        <span class="icon icon--inline--left i-document"></span>`;
                html +=
                buildEntityLink(
                    doc.doc_type_label, doc.url, doc.doc_type_label);
                    html += `</div>`;
                    let parsed;
                    parsed = moment(doc.doc_date, 'YYYY-MM-DD');
                    const doc_date = parsed.isValid() ? parsed.format('MM/DD/YYYY') : 'Invalid date';
                    html += `<div class="tag tag--primary">${doc.doc_category_label}</div>
                            </div>
                            <div class="document-date">
                            ${doc_date}
                            </div>
                           </li>`;
            }
          }
        }
      }
      // /END TODO re... no_tier docs
      html += `</ul>`;
      return html;
    }
  },
  {
    data: 'is_open_for_comment',
    className: 'all align-top',
    orderable: true,
    render: function (data, type, row) {
      if (row.is_open_for_comment == false) {
      return 'Not currently open for comment';
      }
      else {
        const comment_deadline = moment(row.comment_close_date).format('MMMM D YYYY');
        return `<p><b>${row.description}</b><br>Comment deadline: ${comment_deadline}<br><a class="button--cta" href="">Submit a comment</a></p>`;
      }
    }
  }
];
// TODO: SEE: const queryParams = URI.parseQuery(window.location.search);
const get_doc_ids = function() {
const params = new URLSearchParams(window.location.search);
let docs = params.getAll('doc_category_id') || [];
return docs;
};

export const murs = [
    {
    data: 'no',
    sort_alias: 'case_no',
    className: 'cell--25 hide-panel all align-top t-bold',
    orderable: true,
    render: function(data, type, row) {
      let archived  = row.mur_type == 'archived' ? `<div class="legal-mur__archive"><span class="legal-mur__archive-icon"><span class="u-visually-hidden">Icon representing an archived case</span></span>Archived case</div>` : '';
      return `MUR #${row.no}${archived}`;
    }
  },
  {
    data: 'name',
    className: 'cell--25 align-top',
    orderable: false,
    render: function(data, type, row) {
      // name = row.name || row.mur_name
      // return name.toUpperCase()
      if (row.mur_type == 'current') {
                return `<a title="${row.name}" href="/data/legal/matter-under-review/${row.no}/">
                ${row.name.toUpperCase()}</a>`
      } else if (row.no == '3620' && row.mur_type == 'archived') {
                return `<a title="${row.mur_name }" href="/data/legal/matter-under-review/${row.no}/?mur_type=archived">
                  ${row.mur_name.toUpperCase()}</a>`
      } else {
              return `<a title="${row.mur_name}" href="/data/legal/matter-under-review/${row.no}/">
                  ${row.mur_name.toUpperCase()}</a>`
      }
    }
  },




  {
    data: null,
    className: 'cell--50 column--legal-docs align-top',
    orderable: false,
    render: function (data, type, row) {
      let document_content = `<p>`;
        if (row.subjects) {
          for (let subject of row.subjects) {
            document_content += `${subject.subject}, `
          }
        } else if (row.subject) {
            for (let subject of row.subject) {
              document_content += `${subject.text}, `
            }
        }
      
      document_content += `</p>`;
      //   const filters = this.filterSet.serialize();
const filters = new URLSearchParams(window.location.search);
//   const filters_category_type = 'ao_doc_category_id' in filters;
const filters_category_type = filters.has('case_doc_category_id')
//   const filters_keyword = 'search' in filters;
const filters_keyword = filters.has('q')
//   const filters_proximity = 'q_proximity' in filters && filters.q_proximity.length == 2;
const filters_proximity = filters.has('q_proximity') && filters.getAll('q_proximity').length == 2;
//   const proximity_only = filters_proximity && !filters_keyword;
const proximity_only = filters_proximity && !filters_keyword;

const current_doc_ids = filters.getAll('case_doc_category_id') || []
console.log('current_doc_ids: ', current_doc_ids)

//    // Opening div tags are lined up with their closing divs below
     if (row.document_highlights || row.source || filters_category_type) {
       document_content += 
      `<div class="legal-search-result__hit u-margin--top">`;
//     if ((filters_category_type || filters_keyword) && !proximity_only) {
       if ((filters_category_type || filters_keyword) && !proximity_only) {
           let category_shown = '';                                                                                                            
//         for (const [index, document] of ao.documents.entries()) { 
           for (const [index, document] of row.documents.entries()) {
//           /*This will show documents in all 3 scenarios:
//             - When there is a keyword query and selected document categories
//             - When there are selected document categories and no keyword query
//             - When there is a keyword query and no selected document categories */

//           let category_match = !filters_category_type || filters.ao_doc_category_id.includes(document.ao_doc_category_id) ? true : false;
let category_match = !filters_category_type || current_doc_ids.includes(`${document.doc_order_id}`) ? true : false;
             console.log('category_match: ', category_match )
//           let text_match = index in ao.document_highlights || !filters_keyword ? true : false;
let text_match = index in row.document_highlights || !filters_keyword ? true : false;
//           let show_document = category_match && text_match;
let show_document = category_match && text_match; 
             if (show_document) {
              console.log('GOT HERE')
               let top_border_class = '';
               let show_category = '';
//             let current_category = document.ao_doc_category_id;
let current_category = document.doc_order_id;
               if (category_shown != current_category) {
                     top_border_class = "u-border-top-nuetral";
//                   show_category = document.category;
show_category = document.category;
                     category_shown = current_category;
                 }
                 else {
                   show_category = '';
                 }
            document_content += `
                  <div class="document-container">
                    <div class="document-category ${top_border_class}">${show_category}</div>
                    <div class="document_details u-border-top-nuetral">
                      <div class="post--icon">
                        <span class="icon icon--inline--left i-document"></span>
                        <a href="${document.url}">
                          ${document.description}
                        </a>
                      </div>`;       
            if (row.document_highlights[index]) {
              if (row.document_highlights[index].length) {
                  document_content += `
                      <ul>
                        <li class="post--icon t-serif t-italic u-padding--top--med">&#8230;${row.document_highlights[index][0]}&#8230;
                        </li>
                      </ul>`;
              }
              if (row.document_highlights[index].length > 1) {
                  document_content += `
                      <div class="js-accordion u-margin--top" data-content-prefix="additional-result-${row.no}-${index}">
                        <button type="button" class="js-accordion-trigger accordion-trigger-on accordion__button results__button" aria-controls="additional-result-${row.no}-${index}" aria-expanded="false">
                          ${row.document_highlights[index].length > 2 ? row.document_highlights[index].length -1 + " more keyword matches" : "1 more keyword match"}
                        </button>
                        <div class="accordion__content results__content" aria-hidden="true">
                          <ul>`;
                          for (let i = 1; i <= row.document_highlights[index].length -1; i++) {
                            document_content += `<li class="t-serif t-italic">&#8230;${row.document_highlights[index][i]}&#8230;</li>`;
                          }
                            document_content += `
                          </ul>
                        </div>
                      </div>`;       
              }
            }
            document_content += `
                    </div> 
                  </div>`;
          } 
        } 
      } else if (proximity_only) {
          let category_shown = '';
          for (const document of row.source) {
                let top_border_class = '';
                let show_category = '';
                let current_category = document.doc;
                  if (category_shown != current_category) {
                      top_border_class = "u-border-top-nuetral";
                      show_category = document.category;
                      category_shown = current_category;
                  }
                  else {
                    show_category = '';
                  }
                    document_content += `
                      <div class="document-container">
                        <div class="document-category ${top_border_class}">${show_category}</div>
                        <div class="document_details u-border-top-nuetral">
                          <div class="post--icon">
                            <span class="icon icon--inline--left i-document"></span>
                            <a href="${document.url}">
                              ${document.description}
                            </a>
                          </div>
                        </div>
                      </div>`;
          }
       }
       document_content += `
        </div>`;
     }

    return document_content;
    } // end render
  }
]


///////////// NEW FOR MUR DOCS ////////////////////////////////////////

//NOT USING THIS NOW
  const showDocuments = function() {
    console.log('RAN')
  const filters = new URLSearchParams(window.location.search);
  console.log(filters.entries())
  const docs = filters.getAll('case_doc_category_id') || [];
  if (filters.has('case_doc_category_id')){
    console.log('filters.case_doc_category_id: ',filters.getAll('case_doc_category_id') || [])
  }
  return filters;
};
