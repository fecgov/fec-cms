import { default as moment } from 'moment';

import { barCurrencyColumn, candidateColumn, committeeColumn, currencyColumn, supportOpposeColumn } from './columns.js';
import { buildEntityLink, buildTotalLink } from './column-helpers.js';
import { buildAppUrl } from './helpers.js';
import { default as coverageEndDate } from '../templates/coverageEndDate.hbs';

export const candidateInformationColumns = [
  {
    data: 'candidate_name',
    className: 'all column--large',
    render: function(data, type, row) {
      return buildEntityLink(
        data,
        buildAppUrl(['candidate', row.candidate_id], {
          cycle: context.election.cycle,
          election_full: true
        }),
        'candidate',
        { isIncumbent: row.incumbent_challenge_full === 'Incumbent' }
      );
    }
  },
  {
    data: 'party_full',
    className: 'all column--large'
  },
  {
    data: 'candidate_pcc_name',
    className: 'all column--large',
    render: function(data, type, row) {
      if (!data) return 'No principal campaign committee identified';

      return buildEntityLink(
        data,
        buildAppUrl(['committee', row.candidate_pcc_id]),
        'candidate_pcc_id'
      );
    }
  },
  currencyColumn({
    data: 'total_receipts',
    className: 'column--number t-mono',
    orderSequence: ['desc', 'asc'],
    visible: false
  })
];

export const communicationCostColumns = [
  committeeColumn({ data: 'committee_name', className: 'all' }),
  supportOpposeColumn,
  candidateColumn({ data: 'candidate_name', className: 'all' }),
  {
    data: 'total',
    className: 'all column--number t-mono',
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
  }
];

export function createElectionColumns(context) {
  return [
    {
      data: 'candidate_name',
      className: 'all column--large',
      render: function(data, type, row) {
        return buildEntityLink(
          data,
          buildAppUrl(['candidate', row.candidate_id], {
            cycle: context.election.cycle,
            election_full: true
          }),
          'candidate',
          { isIncumbent: row.incumbent_challenge_full === 'Incumbent' }
        );
      }
    },
    {
      data: 'party_full',
      className: 'min-desktop'
    },
    currencyColumn({
      data: 'total_receipts',
      className: 'column--number t-mono all',
      orderSequence: ['desc', 'asc']
    }),
    currencyColumn({
      data: 'total_disbursements',
      className: 'column--number t-mono all',
      orderSequence: ['desc', 'asc']
    }),
    barCurrencyColumn({
      data: 'cash_on_hand_end_period',
      className: 'column--number t-mono all'
    }),
    {
      render: function(data, type, row) {
        var urlBase;
        if (context.election.office === 'president') {
          urlBase = ['reports', 'presidential'];
        } else {
          urlBase = ['reports', 'house-senate'];
        }
        var url = buildAppUrl(urlBase, {
          q_filer: row.committee_ids,
          cycle: context.election.cycle,
          is_amended: 'false'
        });
        var coverage_end_date = row.coverage_end_date
          ? moment(row.coverage_end_date).format('MM/DD/YYYY')
          : null;

        return coverageEndDate({
          coverage_end_date: coverage_end_date,
          url: url
        });
      },
      className: 'min-desktop',
      orderable: false
    }
  ];
}

export const electioneeringColumns = [
  committeeColumn({ data: 'committee_name', className: 'all' }),
  candidateColumn({ data: 'candidate_name', className: 'all' }),
  {
    data: 'total',
    className: 'all column--number t-mono',
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
  }
];

export const independentExpenditureColumns = [
  committeeColumn({ data: 'committee_name', className: 'all' }),
  supportOpposeColumn,
  candidateColumn({ data: 'candidate_name', className: 'all' }),
  {
    data: 'total',
    className: 'all column--number t-mono',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: buildTotalLink(['independent-expenditures'], function(
      data,
      type,
      row
    ) {
      return {
        data_type: 'processed',
        is_notice: 'false',
        support_oppose_indicator: row.support_oppose_indicator,
        candidate_id: row.candidate_id
      };
    })
  }
];
