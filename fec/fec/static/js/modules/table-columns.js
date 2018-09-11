'use strict';

var moment = require('moment');
var columns = require('./columns');
var columnHelpers = require('./column-helpers');
var helpers = require('./helpers');

var coverageEndDate = require('../templates/coverageEndDate.hbs');

var candidateInformationColumns = [
  {
    data: 'candidate_name',
    className: 'all column--large',
    render: function(data, type, row) {
      return columnHelpers.buildEntityLink(
        data,
        helpers.buildAppUrl(['candidate', row.candidate_id]),
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

      return columnHelpers.buildEntityLink(
        data,
        helpers.buildAppUrl(['committee', row.candidate_pcc_id]),
        'candidate_pcc_id'
      );
    }
  },
  columns.currencyColumn({
    data: 'total_receipts',
    className: 'column--number',
    orderSequence: ['desc', 'asc'],
    visible: false
  })
];

var communicationCostColumns = [
  columns.committeeColumn({ data: 'committee', className: 'all' }),
  columns.supportOpposeColumn,
  columns.candidateColumn({ data: 'candidate', className: 'all' }),
  {
    data: 'total',
    className: 'all column--number',
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
  }
];

function createElectionColumns(context) {
  return [
    {
      data: 'candidate_name',
      className: 'all column--large',
      render: function(data, type, row) {
        return columnHelpers.buildEntityLink(
          data,
          helpers.buildAppUrl(['candidate', row.candidate_id]),
          'candidate',
          { isIncumbent: row.incumbent_challenge_full === 'Incumbent' }
        );
      }
    },
    {
      data: 'party_full',
      className: 'all'
    },
    columns.currencyColumn({
      data: 'total_receipts',
      className: 'column--number',
      orderSequence: ['desc', 'asc']
    }),
    columns.currencyColumn({
      data: 'total_disbursements',
      className: 'column--number',
      orderSequence: ['desc', 'asc']
    }),
    columns.barCurrencyColumn({
      data: 'cash_on_hand_end_period',
      className: 'column--number'
    }),
    {
      render: function(data, type, row) {
        var urlBase;
        if (context.election.office === 'president') {
          urlBase = ['reports', 'presidential'];
        } else {
          urlBase = ['reports', 'house-senate'];
        }
        var url = helpers.buildAppUrl(urlBase, {
          committee_id: row.committee_ids,
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
      className: 'all',
      orderable: false
    }
  ];
}

var electioneeringColumns = [
  columns.committeeColumn({ data: 'committee', className: 'all' }),
  columns.candidateColumn({ data: 'candidate', className: 'all' }),
  {
    data: 'total',
    className: 'all column--number',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(
      ['electioneering-communications'],
      function(data, type, row) {
        return {
          candidate_id: row.candidate_id
        };
      }
    )
  }
];

var independentExpenditureColumns = [
  columns.committeeColumn({ data: 'committee', className: 'all' }),
  columns.supportOpposeColumn,
  columns.candidateColumn({ data: 'candidate', className: 'all' }),
  {
    data: 'total',
    className: 'all column--number',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['independent-expenditures'], function(
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

module.exports = {
  candidateInformationColumns: candidateInformationColumns,
  communicationCostColumns: communicationCostColumns,
  createElectionColumns: createElectionColumns,
  electioneeringColumns: electioneeringColumns,
  independentExpenditureColumns: independentExpenditureColumns
};
