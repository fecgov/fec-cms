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
'<select class="js-office">' +
  '<option value="P">President</option>' +
  '<option value="S">Senate</option>' +
  '<option value="H">House</option>' +
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
  '<button class="js-previous is-disabled"></button>' +
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
        '<div class="js-top-entities" data-office="P" data-election-year="2016">' +
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

    it('tests updating the office type from presidential to senate', function() {
      expect(this.chart.office == 'P', 'office should be P').to.be.true;
      expect(this.chart.election_year == 2016, 'year should be 2016').to.be.true;
      this.chart.handleOfficeChange({target: {value: 'S'}, preventDefault: function(){}});
      expect(this.chart.office == 'S', 'office should now be S').to.be.true;
      expect(this.chart.election_year == 2016, 'year should still be 2016').to.be.true;
    });
  });

  describe('alternate initialization', function() {
    // This tests for initializing for Senate, disbursements and previous election years
    beforeEach(function() {
      this.$fixture.empty().append(
        '<div class="js-top-entities" data-office="S" data-election-year="2012">' +
          DOM +
        '</div>'
      );
      this.chart = new TopEntities('.js-top-entities', 'disbursements');
    });

    it('saves the correct current query', function() {
      expect(this.chart.currentQuery).to.deep.equal({
        sort: '-disbursements',
        per_page: 10,
        sort_hide_null: true,
        election_year: 2012,
        election_full: true,
        office: 'S',
        active_candidates: true,
        page: 1
      });
    });

    it('saves the correct base path', function(){
      expect(this.chart.basePath).to.deep.equal(['candidates', 'totals']);
    });
  });

  describe('chart methods', function() {
    beforeEach(function() {
      this.$fixture.empty().append(
        '<div class="js-top-entities" data-office="P" data-election-year="2016">' +
          DOM +
        '</div>'
      );
      this.chart = new TopEntities('.js-top-entities', 'receipts');
    });

    describe('init()', function() {
      it('sets the correct base path', function() {
        expect(this.chart.basePath).to.deep.equal(['candidates', 'totals']);
      });

      it('stores the correct current query', function() {
        expect(this.chart.currentQuery).to.deep.equal({
          sort: '-receipts',
          per_page: 10,
          sort_hide_null: true,
          election_year: 2016,
          election_full: true,
          office: 'P',
          active_candidates: true,
          page: 1
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
        sinon.spy(this.chart, 'updateCoverageDateRange');
      });

      afterEach(function() {
        this.chart.loadData.restore();
        this.chart.updateCoverageDateRange.restore();
      });

      it('handles election-year changes', function() {
        
        this.chart.handleElectionYearChange({target: {value: '2012'}, preventDefault: function(){}});
        expect(this.chart.currentQuery.election_year).to.equal('2012');
        expect(this.chart.loadData).to.have.been.called;
        expect(this.chart.updateCoverageDateRange).to.have.been.called;
      });

      it('handles office change to S', function() {
        this.chart.handleOfficeChange({target: {value: 'S'}, preventDefault: function(){}});
        expect(this.chart.basePath).to.deep.equal(['candidates', 'totals']);
        expect(this.chart.currentQuery.office).to.equal('S');
        expect(this.chart.loadData).to.have.been.called;
      });

      describe('handlePagination()', function() {
        it('goes to the next page', function() {
          this.chart.handlePagination('next', { target: this.chart.$next });
          expect(this.chart.currentQuery.page).to.equal(2);
          expect(this.chart.loadData).to.have.been.called;
        });

        it('goes to the previous page if possible', function() {
          this.chart.currentQuery.page = 2;
          this.chart.$previous.removeClass('is-disabled');
          this.chart.handlePagination('previous', {
            target: this.chart.$previous
          });
          expect(this.chart.currentQuery.page).to.equal(1);
        });

        it('prevents you from paging before page 1', function() {
          this.chart.currentQuery.page = 1;
          this.chart.handlePagination('previous', {
            target: this.chart.$previous
          });
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
                candidate_id: '1234'
              }
            ]
          };
        });

        afterEach(function() {
          this.chart.updatePagination.restore();
          this.chart.drawBars.restore();
        });

        it('populates the table with a response', function() {
          this.chart.populateTable(this.candidateResponse);
          expect(this.chart.maxValue).equals(2000);
          expect(this.chart.$previous.hasClass('is-disabled')).to.be.true;
          expect(this.chart.updatePagination).to.have.been.called;
          expect(this.chart.drawBars).to.have.been.called;
        });
      });

      it('draws bars correctly', function() {
        this.chart.drawBars();
        var fullWidth = this.chart.$elm.find('[data-value="1000"]').width();
        var halfWidth = this.chart.$elm.find('[data-value="500"]').width();
        expect(halfWidth).to.equal(fullWidth / 2);
      });

      it('updates the coverage dates for past years', function() {
        this.chart.election_year = 2012;
        this.chart.updateCoverageDateRange();
        expect(this.chart.$dates.html()).to.equal('01/01/2009–12/31/2012');
      });

      it('updates the coverage dates for the current year', function() {
        var today = new Date();
        var lastYear = today.getFullYear() - 3;
        var formattedToday = "12/31/" + today.getFullYear();
        this.chart.election_year = today.getFullYear();
        this.chart.updateCoverageDateRange();
        expect(this.chart.$dates.html()).to.equal('01/01/' + lastYear + '–' + formattedToday);
      });

      it('updates the page info', function() {
        this.chart.updatePagination({
          page: 2,
          per_page: 10,
          count: 1000
        });
        expect(this.chart.$pageInfo.html()).to.equal('11-20 of 1,000'); // I SUSPECT THIS WAS CHANGED BUT THE TESTS WEREN'T UPDATED
        expect(this.chart.$previous.hasClass('is-disabled')).to.be.false;
      });

      it('disables the next button on the last page', function() {
        this.chart.updatePagination({
          page: 20,
          pages: 20,
          per_page: 10,
          count: 200
        });
        expect(this.chart.$next.hasClass('is-disabled')).to.be.true;
      });
    });
  });
});
