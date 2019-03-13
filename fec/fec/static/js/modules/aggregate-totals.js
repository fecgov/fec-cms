'use strict';

const $ = require('jquery');
// const URI = require('urijs');
const helpers = require('./helpers');

// var TOP_ROW = require('../templates/top-entity-row.hbs');

function AggregateTotals() {
  this.scriptNode = document.currentScript;
  this.election_year = 2020;
  this.office = 'P';
  this.value = 0;
  this.valueField;
  this.descriptionField;
  this.value;

  // this.$elm = $(elm);
  // this.type = type;
  // this.office = this.$elm.data('office');
  // this.election_year = this.$elm.data('election-year');

  // this.$table = this.$elm.find('.js-top-table');
  // this.$dates = this.$elm.find('.js-dates');
  // this.$previous = this.$elm.find('.js-previous');
  // this.$next = this.$elm.find('.js-next');
  // this.$pageInfo = this.$elm.find('.js-page-info');
  this.init();

  // this.$elm.find('.js-office').on('change', this.handleOfficeChange.bind(this));
  // this.$elm
  //   .find('.js-previous')
  //   .on('click', this.handlePagination.bind(this, 'previous'));
  // this.$elm
  //   .find('.js-next')
  //   .on('click', this.handlePagination.bind(this, 'next'));
}
AggregateTotals.prototype.buildElement = function(
  passedTotal,
  passedOffice,
  passedYear
) {
  this.value = passedTotal;
  this.office = passedOffice; // (just in case it's changed)
  this.year = passedYear;

  let stepCount = Math.ceil(Math.random() * 5) + 1;
  let stepAmount = Math.random() * 10;
  let startingValue = this.value - stepAmount * stepCount;

  for (let stepCurrent = 0; stepCurrent <= stepCount; stepCurrent++) {
    let tempVal = startingValue + stepCurrent * stepAmount;
    let delay = stepCurrent * 500;
    let instance = this;
    setTimeout(function() {
      let valString =
        '$' + tempVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
      instance.valueField.innerHTML = valString;
    }, delay);
  }

  this.descriptionField.innerHTML = `Total raised by all ${
    this.office
  } candidates running in ${this.year}`;
};

AggregateTotals.prototype.init = function() {
  this.valueField = document.querySelector(
    String(this.scriptNode.dataset.target) + ' .value'
  );
  this.descriptionField = document.querySelector(
    String(this.scriptNode.dataset.target) + ' .description'
  );

  // $('.js-election-year')
  //   .off()
  //   .on('change', this.handleElectionYearChange.bind(this));

  this.basePath = ['candidates', 'totals', 'by_office'];

  let baseQuery = {
    office: this.office,
    per_page: 20,
    active_candidates: false,
    sort_null_only: false,
    sort_hide_null: false,
    sort_nulls_last: false,
    page: 1,
    election_year: this.election_year
  };
  // this.maxValue = Number(
  //   this.$table
  //     .find('.value-bar')
  //     .first()
  //     .data('value')
  // );

  // // Store the current query for use in pagination and more
  this.currentQuery = baseQuery;

  // if (!this.currentQuery.page) {
  //   this.$previous.addClass('is-disabled');
  // }

  // this.updateElectionYearOptions(this.office);
  // this.updateCoverageDateRange();

  this.loadData(this.currentQuery);
};

// TopEntities.prototype.handleElectionYearChange = function(e) {
//   e.preventDefault();
//   this.election_year = e.target.value;
//   this.currentQuery = Object.assign({}, this.currentQuery, {
//     election_year: this.election_year,
//     page: 1
//   });

//   this.loadData(this.currentQuery);
//   this.updateCoverageDateRange();
//   this.pushStateToURL({ election_year: this.election_year });
// };

// TopEntities.prototype.handleOfficeChange = function(e) {
//   e.preventDefault();
//   this.office = e.target.value;

//   this.currentQuery = Object.assign({}, this.currentQuery, {
//     office: this.office
//   });
//   this.updateElectionYearOptions(this.office);
//   this.updateCoverageDateRange();
//   this.loadData(this.currentQuery);
//   this.pushStateToURL({ office: this.office });
// };

// TopEntities.prototype.updateElectionYearOptions = function(office) {
//   var now = new Date();
//   var currentYear = now.getFullYear();
//   var minFutureYear = currentYear;

//   if (office == 'P') {
//     // only show presential options
//     $('#election-year option').each(function() {
//       var optValue = parseInt($(this).val());
//       // hide all of the non-presidential election years
//       if (optValue % 4 !== 0) {
//         $(this).hide();
//       } else {
//         // track the nearest future presidential election
//         if (optValue > currentYear) {
//           minFutureYear = optValue;
//         }
//       }
//     });
//     var currentOption = $(
//       '#election-year option[value="' + this.election_year + '"]'
//     );
//     if (currentOption.css('display') == 'none') {
//       $('#election-year')
//         .val(minFutureYear)
//         .change();
//     }
//   } else {
//     // show all options!
//     $('#election-year option').show();
//   }
// };

// TopEntities.prototype.handlePagination = function(direction, e) {
//   if ($(e.target).hasClass('is-disabled')) {
//     return;
//   }
//   var currentPage = this.currentQuery.page || 1;
//   if (direction === 'next') {
//     this.currentQuery.page = currentPage + 1;
//   } else if (direction === 'previous') {
//     this.currentQuery.page = currentPage - 1;
//   }

//   this.loadData(this.currentQuery);
// };

AggregateTotals.prototype.loadData = function(query) {
  let self = this;
  $.getJSON(helpers.buildUrl(this.basePath, query)).done(function(response) {
    let theTotal = response.results[0].total_disbursement;
    let theOffice = response.results[0].office;
    let theYear = response.results[0].election_year;

    self.buildElement(theTotal, theOffice, theYear);
  });
};

// TopEntities.prototype.populateTable = function(response) {
//   var self = this;
//   self.$table.find('.js-top-row').remove();
//   var index = 1;
//   var rankBase = (response.pagination.page - 1) * 10; // So that page 2 starts at 11
//   response.results.forEach(function(result) {
//     var rank = rankBase + index;
//     var data = self.formatData(result, rank);
//     self.$table.append(TOP_ROW(data));
//     index++;
//   });

//   // Set max value if it's the first page
//   if (response.pagination.page === 1) {
//     if (response.results.length > 0) {
//       self.maxValue = response.results[0].receipts;
//     }
//     self.$previous.addClass('is-disabled');
//   }
//   self.updatePagination(response.pagination);
//   self.drawBars();
// };

// TopEntities.prototype.formatData = function(result, rank) {
//   var data = {
//     name: result.name,
//     amount: helpers.currency(result[this.type]),
//     value: result[this.type],
//     rank: rank,
//     party: result.party,
//     party_code:
//       result.party === null ? '' : '[' + result.party.toUpperCase() + ']',
//     url: helpers.buildAppUrl(['candidate', result.candidate_id], {
//       cycle: this.election_year,
//       election_full: true
//     })
//   };

//   return data;
// };

// TopEntities.prototype.drawBars = function() {
//   var maxValue = this.maxValue;
//   this.$table.find('.value-bar').each(function() {
//     var width = Number(this.getAttribute('data-value')) / maxValue;
//     this.style.width = String(width * 100) + '%';
//   });
// };

// TopEntities.prototype.updateCoverageDateRange = function() {
//   var coverage_start_date = null;
//   var coverage_end_date = '12/31/' + this.election_year;
//   if (this.office === 'P') {
//     //For Presidential coverage start dates
//     coverage_start_date = '01/01/' + String(this.election_year - 3);
//   } else if (this.office === 'S') {
//     // For Senate coverage start dates
//     coverage_start_date = '01/01/' + String(this.election_year - 5);
//   } else {
//     // For House coverage start dates
//     coverage_start_date = '01/01/' + String(this.election_year - 1);
//   }

//   this.$dates.html(coverage_start_date + '–' + coverage_end_date);
// };

// TopEntities.prototype.updatePagination = function(pagination) {
//   var page = pagination.page;
//   var per_page = pagination.per_page;
//   var count = pagination.count.toLocaleString();
//   var range_start = String(per_page * (page - 1) + 1);
//   var range_end = String((page - 1) * 10 + per_page);
//   var info = range_start + '-' + range_end + ' of ' + count;

//   if (page === pagination.pages) {
//     this.$next.addClass('is-disabled');
//   } else {
//     this.$next.removeClass('is-disabled');
//   }

//   if (page === 1) {
//     this.$previous.addClass('is-disabled');
//   } else {
//     this.$previous.removeClass('is-disabled');
//   }

//   this.$pageInfo.html(info);
// };

// TopEntities.prototype.pushStateToURL = function(keyValPairsObj) {
//   var query = Object.assign(
//     URI.parseQuery(window.location.search),
//     keyValPairsObj
//   );
//   var search = URI('')
//     .query(query)
//     .toString();
//   window.history.pushState(query, search, search || window.location.pathname);
//   // analytics.pageView();
// };

// module.exports = { AggregateTotals };

new AggregateTotals();
