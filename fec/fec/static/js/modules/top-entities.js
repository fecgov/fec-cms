import { default as URI } from 'urijs';

import { buildAppUrl, buildUrl, currency } from '../modules/helpers.js';
import { default as TOP_ROW } from '../templates/top-entity-row.hbs';

export function TopEntities(elm, type) {
  this.$elm = $(elm);
  this.type = type;
  this.office = this.$elm.data('office');
  this.election_year = this.$elm.data('election-year');
  this.per_page = this.$elm.data('perpage');

  this.$table = this.$elm.find('.js-top-table');

  this.$dates = this.$elm.find('.js-dates');
  this.$previous = this.$elm.find('.js-previous');
  this.$next = this.$elm.find('.js-next');
  this.$pageInfo = this.$elm.find('.js-page-info');
  this.init();

  this.$elm.find('.js-office').on('change', this.handleOfficeChange.bind(this));
  this.$elm
    .find('.js-previous')
    .on('click', this.handlePagination.bind(this, 'previous'));
  this.$elm
    .find('.js-next')
    .on('click', this.handlePagination.bind(this, 'next'));
  $('.js-chart-toggle').on('change', this.handleTypeChange.bind(this));
}

TopEntities.prototype.init = function() {
  $('.js-election-year')
    .off()
    .on('change', this.handleElectionYearChange.bind(this));

  this.basePath = ['candidates', 'totals'];

  const baseQuery = {
    sort: '-' + this.type,
    per_page: this.per_page || 10,
    sort_hide_null: true,
    election_year: this.election_year,
    election_full: true,
    office: this.office,
    is_active_candidate: true,
    page: 1
  };
  this.maxValue = Number(
    this.$table
      .find('.value-bar')
      .first()
      .data('value')
  );

  // Store the current query for use in pagination and more
  this.currentQuery = baseQuery;

  if (!this.currentQuery.page) {
    this.$previous.addClass('is-disabled');
  }

  this.updateElectionYearOptions(this.office);
  this.updateCoverageDateRange();

  this.loadData(this.currentQuery);
};

TopEntities.prototype.handleElectionYearChange = function(e) {
  e.preventDefault();
  this.election_year = e.target.value;
  this.currentQuery = Object.assign({}, this.currentQuery, {
    election_year: this.election_year,
    page: 1
  });

  this.loadData(this.currentQuery);
  this.updateCoverageDateRange();
  this.pushStateToURL({ election_year: this.election_year });
};

TopEntities.prototype.handleOfficeChange = function(e) {
  e.preventDefault();
  this.office = e.target.value;

  this.currentQuery = Object.assign({}, this.currentQuery, {
    office: this.office,
    page: 1
  });
  this.updateElectionYearOptions(this.office);
  this.updateCoverageDateRange();
  this.loadData(this.currentQuery);
  this.pushStateToURL({ office: this.office });
};

TopEntities.prototype.updateElectionYearOptions = function(office) {
  const now = new Date();
  const currentYear = now.getFullYear();
  let minFutureYear = currentYear;

  if (office == 'P') {
    // only show presential options
    $('#election-year option').each(function() {
      const optValue = parseInt($(this).val());
      // hide all of the non-presidential election years/disable for Safari
      if (optValue % 4 !== 0) {
        $(this)
          .hide()
          .prop('disabled', true);
      } else {
        // track the nearest future presidential election
        if (optValue > currentYear) {
          minFutureYear = optValue;
        }
      }
    });
    const currentOption = $(
      '#election-year option[value="' + this.election_year + '"]'
    );
    if (currentOption.css('display') == 'none') {
      $('#election-year')
        .val(minFutureYear)
        .trigger('change');
    }
  } else {
    // show all options/enable for Safari!
    $('#election-year option')
      .show()
      .prop('disabled', false);
  }
};

TopEntities.prototype.handlePagination = function(direction, e) {
  if ($(e.target).hasClass('is-disabled')) {
    return;
  }
  const currentPage = this.currentQuery.page || 1;
  if (direction === 'next') this.currentQuery.page = currentPage + 1;
  else if (direction === 'previous') this.currentQuery.page = currentPage - 1;

  this.loadData(this.currentQuery);
};

TopEntities.prototype.loadData = function(query) {
  const self = this;
  $.getJSON(buildUrl(this.basePath, query)).done(function(response) {
    self.populateTable(response);
  });
};

TopEntities.prototype.populateTable = function(response) {
  const self = this;
  self.$table.find('.js-top-row').remove();
  let index = 1;
  const rankBase = (response.pagination.page - 1) * 10; // So that page 2 starts at 11
  response.results.forEach(function(result) {
    const rank = self.per_page == 3 ? '' : rankBase + index + '.';
    const data = self.formatData(result, rank);
    self.$table.append(TOP_ROW(data));
    index++;
  });

  // Set max value if it's the first page
  if (response.pagination.page === 1) {
    if (response.results.length > 0) {
      self.maxValue =
        this.type == 'receipts'
          ? response.results[0].receipts
          : response.results[0].disbursements;
    }
    self.$previous.addClass('is-disabled');
  }
  self.updatePagination(response.pagination);
  self.drawBars();
};

TopEntities.prototype.formatData = function(result, rank) {
  const data = {
    name: result.name,
    amount: currency(result[this.type]),
    value: result[this.type],
    rank: rank,
    party: result.party,
    party_code:
      result.party === null ? '' : '[' + result.party.toUpperCase() + ']',
    url: buildAppUrl(['candidate', result.candidate_id], {
      cycle: this.election_year,
      election_full: true
    })
  };

  return data;
};

TopEntities.prototype.drawBars = function() {
  const maxValue = this.maxValue;
  this.$table.find('.value-bar').each(function() {
    const width = Number(this.getAttribute('data-value')) / maxValue || 0;
    this.style.width = String(width * 100) + '%';
  });
};

TopEntities.prototype.updateCoverageDateRange = function() {
  let coverage_start_date = null;
  const coverage_end_date = '12/31/' + this.election_year;
  if (this.office === 'P') {
    //For Presidential coverage start dates
    coverage_start_date = '01/01/' + String(this.election_year - 3);
  } else if (this.office === 'S') {
    // For Senate coverage start dates
    coverage_start_date = '01/01/' + String(this.election_year - 5);
  } else {
    // For House coverage start dates
    coverage_start_date = '01/01/' + String(this.election_year - 1);
  }

  this.$dates.html(coverage_start_date + '–' + coverage_end_date);
};

TopEntities.prototype.updatePagination = function(pagination) {
  const page = pagination.page;
  const per_page = pagination.per_page;
  const count = pagination.count.toLocaleString();
  const range_start = String(per_page * (page - 1) + 1);
  const range_end = String((page - 1) * 10 + per_page);
  const info = range_start + '-' + range_end + ' of ' + count;

  if (page === pagination.pages) {
    this.$next.addClass('is-disabled');
  } else {
    this.$next.removeClass('is-disabled');
  }

  if (page === 1) {
    this.$previous.addClass('is-disabled');
  } else {
    this.$previous.removeClass('is-disabled');
  }

  this.$pageInfo.html(info);
};

TopEntities.prototype.pushStateToURL = function(keyValPairsObj) {
  const query = Object.assign(
    URI.parseQuery(window.location.search),
    keyValPairsObj
  );
  const search = URI('')
    .query(query)
    .toString();
  window.history.pushState(query, search, search || window.location.pathname);
  // analytics.pageView();
};

TopEntities.prototype.handleTypeChange = function(e) {
  this.type = e.target.value;
  this.basePath = ['candidates', 'totals'];
  this.prefix = $(e.target).data('prefix');
  this.action = this.type == 'receipts' ? 'raised' : 'spent';

  const baseQuery = {
    sort: '-' + this.type,
    per_page: this.per_page,
    sort_hide_null: true,
    election_year: this.election_year,
    election_full: true,
    office: this.office,
    is_active_candidate: true
  };

  this.currentQuery = baseQuery;

  this.loadData(this.currentQuery);
  this.updateCoverageDateRange();

  $('a.js-browse')
    .attr({
      href: '/data/' + this.prefix + '-bythenumbers/'
    })
    .html('Browse top ' + this.prefix + ' candidates');

  $('.js-type-label span').html(this.action);
};
