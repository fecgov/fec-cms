import { contains as _contains, extend as _extend, first as _first, last as _last } from 'underscore';

import { barColumn, buildEntityLink, formattedColumn, urlColumn } from './column-helpers.js';
import { getCycle, MODAL_TRIGGER_HTML, yearRange } from './tables.js';
import { amendmentVersion, amendmentVersionDescription, buildAppUrl, currency, datetime, globals } from './helpers.js';
import { supportOppose } from './decoders.js';
import { default as moment } from 'moment';

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
