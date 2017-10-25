'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
var moment = require('moment');

chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var TopEntities = require('../../static/js/modules/top-entities').TopEntities;

var DOM =
'<select class="js-category">' +
  '<option value="P">President</option>' +
  '<option value="S">Senate</option>' +
  '<option value="H">House</option>' +
  '<option value="pac">PACs</option>' +
  '<option value="party">Party</option>' +
'</select>' +
'<span class="js-dates"></span>' +
'<div class="js-top-table">' +
  '<div class="js-top-row">' +
    '<div class="value-bar" data-value="1000"></div>' +
  '</div>' +
  '<div class="js-top-row">' +
    '<div class="value-bar" data-value="500"></div>' +
  '</div>' +
'</div>' +
'<button class="js-previous"></button>' +
'<button class="js-next"></button>' +
'<span class="js-page-info"></button>';

describe('Top entities breakdown', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  describe('candidate initialization', function() {
    beforeEach(function() {
      this.$fixture.empty().append(
        '<div class="js-top-entities" data-category="P" data-cycle="2016">' +
          DOM +
        '</div>'
      );
      this.chart = new TopEntities('.js-top-entities', 'receipts');
    });

    it('locates DOM elements', function() {
      expect(this.chart.$elm.is('#fixtures .js-top-entities')).to.be.true;
      expect(this.chart.$table.is('#fixtures .js-top-table')).to.be.true;
      expect(this.chart.$dates.is('#fixtures .js-dates')).to.be.true;
      expect(this.chart.$previous.is('#fixtures .js-previous')).to.be.true;
      expect(this.chart.$next.is('#fixtures .js-next')).to.be.true;
      expect(this.chart.$pageInfo.is('#fixtures .js-page-info')).to.be.true;
    });

    it('sets the correct properties', function () {
      expect(this.chart.category).to.equal('candidates');
      expect(this.chart.type).to.equal('receipts');
      expect(this.chart.cycle).to.equal(2016);
    });
  });

  describe('alternate initialization', function() {
    // This tests for initializing for PACs, disbursements and previous cycles
    beforeEach(function() {
      this.$fixture.empty().append(
        '<div class="js-top-entities" data-category="pac" data-cycle="2012">' +
          DOM +
        '</div>'
      );
      this.chart = new TopEntities('.js-top-entities', 'disbursements');
    });

    it('sets the correct properties', function() {
      expect(this.chart.category).to.equal('pac');
      expect(this.chart.type).to.equal('disbursements');
      expect(this.chart.cycle).to.equal(2012);
    });

    it('saves the correct baseQuery', function() {
      expect(this.chart.baseQuery).to.deep.equal({
        sort: '-disbursements',
        per_page: 10,
        sort_hide_null: true,
        cycle: 2012
      });
    });

    it('saves the correct base path', function(){
      expect(this.chart.basePath).to.deep.equal(['totals', 'pac']);
    });
  });

  describe('chart methods', function() {
    beforeEach(function() {
      this.$fixture.empty().append(
        '<div class="js-top-entities" data-category="P" data-cycle="2016">' +
          DOM +
        '</div>'
      );
      this.chart = new TopEntities('.js-top-entities', 'receipts');
    });

    describe('init()', function() {
      it('sets the correct base path', function() {
        expect(this.chart.basePath).to.deep.equal(['candidates', 'totals']);
      });

      it('stores the correct base query', function() {
        expect(this.chart.baseQuery).to.deep.equal({
          sort: '-receipts',
          per_page: 10,
          sort_hide_null: true,
          cycle: 2016,
          office: 'P'
        });
      });

      it('finds the correct maxValue from server-side data', function() {
        expect(this.chart.maxValue).to.equal(1000);
      });

      it('disables the previous button', function() {
        expect(this.chart.$previous.hasClass('is-disabled')).to.be.true;
      });
    });

    describe('event handling', function() {
      beforeEach(function() {
        sinon.spy(this.chart, 'loadData');
        sinon.spy(this.chart, 'updateDates');
      });

      afterEach(function() {
        this.chart.loadData.restore();
        this.chart.updateDates.restore();
      });

      it('handles cycle changes', function() {
        this.chart.handleCycleChange({target: {value: '2012'}, preventDefault: function(){}});
        expect(this.chart.currentQuery.cycle).to.equal('2012');
        expect(this.chart.currentQuery.office).to.equal('P');
        expect(this.chart.currentQuery.page).to.equal(1);
        expect(this.chart.loadData).to.have.been.called;
        expect(this.chart.updateDates).to.have.been.called;
      });

      it('handles category change to non-candidates', function() {
        this.chart.handleCategoryChange({target: {value: 'pac'}, preventDefault: function(){}});
        expect(this.chart.basePath).to.deep.equal(['totals', 'pac']);
        expect(this.chart.category).to.equal('pac');
        expect(this.chart.currentQuery.page).to.equal(1);
        expect(this.chart.loadData).to.have.been.called;
      });

      it('handles category change to candidates', function() {
        this.chart.handleCategoryChange({target: {value: 'S'}, preventDefault: function(){}});
        expect(this.chart.basePath).to.deep.equal(['candidates', 'totals']);
        expect(this.chart.category).to.equal('candidates');
        expect(this.chart.currentQuery.office).to.equal('S');
        expect(this.chart.currentQuery.page).to.equal(1);
        expect(this.chart.loadData).to.have.been.called;
      });

      describe('handlePagination()', function() {
        it('goes to the next page', function() {
          this.chart.handlePagination('next', {target: this.chart.$next});
          expect(this.chart.currentQuery.page).to.equal(2);
          expect(this.chart.loadData).to.have.been.called;
        });

        it('goes to the previous page if possible', function() {
          this.chart.currentQuery.page = 2;
          this.chart.$previous.removeClass('is-disabled');
          this.chart.handlePagination('previous', {target: this.chart.$previous});
          expect(this.chart.currentQuery.page).to.equal(1);
        });

        it('prevents you from paging before page 1', function() {
          this.chart.currentQuery.page = 1;
          this.chart.handlePagination('previous', {target: this.chart.$previous});
          expect(this.chart.loadData).to.have.not.been.called;
        });
      });
    });

    describe('DOM updates', function() {
      describe('loading data', function() {
        beforeEach(function() {
          sinon.spy(this.chart, 'updatePagination');
          sinon.spy(this.chart, 'drawBars');
          this.candidateResponse = {
            pagination: {
              page: 1,
              per_page: 10,
              count: 10
            },
            results: [
              {
                name: 'Thing A',
                receipts: 2000,
                party: 'dem',
                candidate_id: '1234',
              }
            ]
          };
          this.pacResponse = {
            pagination: {
              page: 1,
              per_page: 10,
              count: 10
            },
            results: [
              {
                committee_name: 'Thing B',
                receipts: 1000,
                committee_id: '1234'
              }
            ]
          };
        });

        afterEach(function() {
          this.chart.updatePagination.restore();
          this.chart.drawBars.restore();
        });

        it('formats a candidate response', function() {
          this.chart.category = 'candidates';
          var data = this.chart.formatData(this.candidateResponse.results[0], 1);
          expect(data).to.deep.equal({
            name: 'Thing A',
            amount: '$2,000.00',
            value: 2000,
            rank: 1,
            party: 'dem',
            party_code: '[D]',
            url: '//candidate/1234/?cycle=2016&election_full=false'
          });
        });

        it('formats a pac response', function() {
          this.chart.category = 'pac';
          var data = this.chart.formatData(this.pacResponse.results[0], 1);
          expect(data).to.deep.equal({
            name: 'Thing B',
            amount: '$1,000.00',
            rank: 1,
            value: 1000,
            url: '//committee/1234/?cycle=2016'
          });

        });

        it ('populates the table with a response', function() {
          this.chart.populateTable(this.candidateResponse);
          expect(this.chart.maxValue).equals(2000);
          expect(this.chart.$previous.hasClass('is-disabled')).to.be.true;
          expect(this.chart.updatePagination).to.have.been.called;
          expect(this.chart.drawBars).to.have.been.called;
        });
      });

      it('draws bars correctly', function () {
        this.chart.drawBars();
        var fullWidth = this.chart.$elm.find('[data-value="1000"]').width();
        var halfWidth = this.chart.$elm.find('[data-value="500"]').width();
        expect(halfWidth).to.equal(fullWidth / 2);
      });

      it('updates the coverage dates for past years', function() {
        this.chart.cycle = 2012;
        this.chart.updateDates();
        expect(this.chart.$dates.html()).to.equal('01/01/2011–12/31/2012');
      });

      it('updates the coverage dates for the current year', function() {
        var today = new Date();
        var lastYear = today.getFullYear() - 1;
        var formattedToday = moment(today).format('MM/DD/YYYY');
        console.log("today:" + formattedToday);
        this.chart.cycle = today.getFullYear();
        this.chart.updateDates();
        expect(this.chart.$dates.html()).to.equal('01/01/' + lastYear + '–' + formattedToday);
      });

      it('updates the page info', function() {
        this.chart.updatePagination({
          page: 2,
          per_page: 10,
          count: 1000,
        });
        expect(this.chart.$pageInfo.html()).to.equal('11-20 of 1000');
        expect(this.chart.$previous.hasClass('is-disabled')).to.be.false;
      });

      it('disables the next button on the last page', function() {
        this.chart.updatePagination({
          page: 20,
          pages: 20,
          per_page: 10,
          count: 200,
        });
        expect(this.chart.$next.hasClass('is-disabled')).to.be.true;
      });
    });
  });
});
