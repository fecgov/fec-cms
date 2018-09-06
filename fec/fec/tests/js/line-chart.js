'use strict';

/* global require */

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var $ = require('jquery');
var helpers = require('../../static/js/modules/helpers');

require('./setup')();

var mockResponse = {
  'results': [
    {
      'cycle': 2016,
      'end_date': '2015-01-31T00:00:00+00:00',
      'cumulative_candidate_receipts': 100,
      'cumulative_pac_receipts': 200,
      'cumulative_party_receipts': 300,
      'cumulative_candidate_disbursements': 50,
      'cumulative_pac_disbursements': 150,
      'cumulative_party_disbursements': 250
    },
    {
      'cycle': 2016,
      'end_date': '2015-02-28T00:00:00+00:00',
      'cumulative_candidate_receipts': 400,
      'cumulative_pac_receipts': 500,
      'cumulative_party_receipts': 600,
      'cumulative_candidate_disbursements': 350,
      'cumulative_pac_disbursements': 450,
      'cumulative_party_disbursements': 550
    },
  ]
};

var LineChart = require('../../static/js/modules/line-chart').LineChart;

  describe('LineChart', function() {
    before(function() {
      this.$fixture = $('<div id="fixtures"></div>');
      $('body').append(this.$fixture);
    });

    beforeEach(function() {
      this.$fixture.empty().append(
        '<div class="js-chart"></div>' +
        '<div class="snapshot js-snapshot">' +
          '<button class="js-snapshot-prev"></button>' +
          '<span class="js-min-date"></span><span class="js-max-date"></span>' +
          '<button class="js-snapshot-next"></button>' +
          '<span class="snapshot__item-number">' +
            '<span class="figure__decimals" aria-hidden="true"></span>' +
            '<span data-total-for="all"></span>' +
          '</span>' +
          '<span class="snapshot__item-number">' +
            '<span class="figure__decimals" aria-hidden="true"></span>' +
            '<span data-total-for="candidate"></span>' +
          '</span>' +
          '<span class="snapshot__item-number">' +
            '<span class="figure__decimals" aria-hidden="true"></span>' +
            '<span data-total-for="pac"></span>' +
          '</span>' +
          '<span class="snapshot__item-number">' +
            '<span class="figure__decimals" aria-hidden="true"></span>' +
            '<span data-total-for="party"></span>' +
          '</div>'
      );
      this.lineChart = new LineChart('.js-chart', '.js-snapshot', 'raised');
      this.fetch = sinon.stub(this.lineChart, 'fetch', function() {
        this.handleResponse(mockResponse);
      });
     });

    afterEach(function() {
      this.lineChart.fetch.restore();
    });

    it('locates dom elements', function() {
      expect($(this.lineChart.element[0]).is('#fixtures .js-chart')).to.be.true;
      expect(this.lineChart.$snapshot.is('#fixtures .js-snapshot')).to.be.true;
      expect(this.lineChart.$prev.is('#fixtures .js-snapshot-prev')).to.be.true;
      expect(this.lineChart.$next.is('#fixtures .js-snapshot-next')).to.be.true;
    });

    describe('handleResponse()', function() {
      before(function() {
        this.lastDatum = {
          'end_date': helpers.utcDate('2015-02-28T00:00:00+00:00'),
          'candidate': 400,
          'pac': 500,
          'party': 600,
        };
        this.groupDataByType = sinon.spy(this.lineChart, 'groupDataByType');
        this.drawChart = sinon.spy(this.lineChart, 'drawChart');
        this.moveCursor = sinon.spy(this.lineChart, 'moveCursor');
        this.setupSnapshot = sinon.spy(this.lineChart, 'setupSnapshot');
        this.lineChart.handleResponse(mockResponse);
      });

      after(function() {
        this.groupDataByType.restore();
        this.drawChart.restore();
        this.moveCursor.restore();
        this.setupSnapshot.restore();
      });

      it('calls groupDataByType()', function() {
        expect(this.groupDataByType).to.have.been.called;
      });

      it('calls drawChart()', function() {
        expect(this.drawChart).to.have.been.called;
      });

      it('calls moveCursor()', function() {
        expect(this.moveCursor).to.have.been.called;
      });

      it('calls setupSnapshot()', function() {
        expect(this.setupSnapshot).to.have.been.calledWith(2016);
      });
    });

    it('sets the beginning date of the snapshot to the first of the cycle', function() {
      this.lineChart.setupSnapshot(2014);
      // expect(this.lineChart.$snapshot.find('.js-min-date').html()).to.equal('Jan 1, 2013');
    });

    it('groups raised data', function() {
      this.lineChart.dataType = 'raised';
      this.lineChart.groupDataByType(mockResponse.results);
      expect(this.lineChart.chartData).to.deep.equal([
        {
          'date': helpers.utcDate('2015-01-31T00:00:00+00:00'),
          'candidate': 100,
          'pac': 200,
          'party': 300,
        }, {
          'date': helpers.utcDate('2015-02-28T00:00:00+00:00'),
          'candidate': 400,
          'pac': 500,
          'party': 600
        }
      ]);
    });

    it('groups spending data', function() {
      this.lineChart.dataType = 'spent';
      this.lineChart.groupDataByType(mockResponse.results);
      expect(this.lineChart.chartData).to.deep.equal([
        {
          'date': helpers.utcDate('2015-01-31T00:00:00+00:00'),
          'candidate': 50,
          'pac': 150,
          'party': 250,
        }, {
          'date': helpers.utcDate('2015-02-28T00:00:00+00:00'),
          'candidate': 350,
          'pac': 450,
          'party': 550
        }
      ]);
    });

    it('ignores data that is in the future', function() {
      var futureData = [{
        'cycle': 2016,
        'end_date': '2100-01-31T00:00:00+00:00', // Fake very far in future date
      }, {
        'cycle': 2016,
        'end_date': '2015-01-31T00:00:00+00:00',
      }];
      this.lineChart.groupDataByType(futureData);
      expect(this.lineChart.chartData.length).to.equal(1);
    });

    it('groups data by entity', function() {
      this.lineChart.groupDataByType(mockResponse.results);
      var entityTotals = this.lineChart.groupEntityTotals();
      // Just checking to see if the entityTotals object has the right keys
      // Then check one of them to make sure the data is right
      expect(Object.keys(entityTotals)).to.deep.equal(['candidate', 'party', 'pac']);
      expect(entityTotals.candidate[0]).to.deep.equal({
        amount: 100,
        date: helpers.utcDate('2015-01-31T00:00:00+00:00')
      });
    });

    it('sets the x-scale domain to the correct dates and width', function() {
      this.lineChart.setXScale();
      var minDate = new Date('01/01/2015');
      var maxDate = new Date('01/01/2017');
      expect(this.lineChart.x.domain()).to.deep.equal([minDate, maxDate]);
      expect(this.lineChart.x.range()).to.deep.equal([0, this.lineChart.width]);
    });

    it('sets the y-scale to the correct domain and range', function() {
      var y = this.lineChart.setYScale();
      expect(y.domain()).to.deep.equal([0, 4000000000]);
      expect(y.range()).to.deep.equal([this.lineChart.height, 0]);
    });

    it('appends an SVG', function() {
      this.lineChart.appendSVG();
      expect($('#fixtures svg').length).to.equal(1);
    });

    describe('drawChart()', function() {
      beforeEach(function() {
        this.drawCursor = sinon.spy(this.lineChart, 'drawCursor');
        this.appendSVG = sinon.spy(this.lineChart, 'appendSVG');
        this.lineChart.groupDataByType(mockResponse.results);
        this.lineChart.drawChart();
      });

      afterEach(function() {
        this.drawCursor.restore();
        this.appendSVG.restore();
      });

      it('calls appendSVG()', function() {
        expect(this.appendSVG).to.have.been.called;
      });

      it('calls drawCursor()', function() {
        expect(this.drawCursor).to.have.been.called;
      });

      it('draws two axes', function() {
        expect($('#fixtures svg .axis').length).to.equal(2);
      });

      it('draws three lines', function() {
        expect($('#fixtures svg .line--candidate').length).to.equal(1);
        expect($('#fixtures svg .line--party').length).to.equal(1);
        expect($('#fixtures svg .line--pac').length).to.equal(1);
      });

      it('draws 6 points', function() {
        expect($('#fixtures svg circle').length).to.equal(6);
      });
    });


    it('draws the cursor', function() {
      var svg = this.lineChart.appendSVG();
      this.lineChart.drawCursor(svg);
      expect($('#fixtures svg .cursor').length).to.equal(1);
    });

    describe('xAxisFormatter() for small screens', function() {
      before(function() {
        sinon.stub(helpers, 'isMediumScreen', function() { return false; });
        this.formatter = this.lineChart.xAxisFormatter();
      });

      after(function() {
        helpers.isMediumScreen.restore();
      });

      it('parses month and year on january', function() {
        var date = new Date('01/01/2015');
        expect(this.formatter(date)).to.equal('Jan 2015');
      });

      it('parses month for May but not July', function() {
        // We show only every 4th month on small screens
        var may = new Date('05/01/2015');
        var july = new Date('07/01/2015');
        expect(this.formatter(may)).to.equal('May');
        expect(this.formatter(july)).to.equal('');
      });
    });

    describe('xAxisFormatter() for medium and up screens', function() {
      before(function() {
        sinon.stub(helpers, 'isMediumScreen', function() { return true; });
        this.formatter = this.lineChart.xAxisFormatter();
      });

      after(function() {
        helpers.isMediumScreen.restore();
      });

      it('parses month and year on january', function() {
        var date = new Date('01/01/2015');
        expect(this.formatter(date)).to.equal('Jan 2015');
      });

      it('parses month for May but not April', function() {
        // We show only every other month on small screens
        var may = new Date('05/01/2015');
        var april = new Date('04/01/2015');
        expect(this.formatter(may)).to.equal('May');
        expect(this.formatter(april)).to.equal('');
      });
    });

    describe('moveCursor()', function() {
      beforeEach(function() {
        this.lineChart.groupDataByType(mockResponse.results);
        this.lineChart.drawChart();
        this.datum = this.lineChart.chartData[1];
        this.populateSnapshot = sinon.spy(this.lineChart, 'populateSnapshot');
        this.lineChart.moveCursor(this.datum);
      });

      afterEach(function() {
        this.populateSnapshot.restore();
      });

      it('positions the cursor line', function() {
        // Get the x-coordinate from the x axis
        var xCoordinate = this.lineChart.x(this.datum.date);
        expect(xCoordinate).to.above(70);
      });

      it('sets next and previous datums', function() {
        expect(this.lineChart.prevDatum).to.deep.equal(this.lineChart.chartData[0]);
        expect(this.lineChart.nextDatum).to.be.false;
      });

      it('calls populateSnapshot()', function() {
        expect(this.populateSnapshot).to.have.been.calledWith(this.datum);
      });
    });

    describe('populating the snapshot', function() {
      beforeEach(function() {
        this.zeroPad = sinon.spy(helpers, 'zeroPad');
        this.snapshotSubtotals = sinon.spy(this.lineChart, 'snapshotSubtotals');
        this.snapshotTotal = sinon.spy(this.lineChart, 'snapshotTotal');
        this.lineChart.groupDataByType(mockResponse.results);
        this.lineChart.populateSnapshot(this.lineChart.chartData[0]);
      });

      afterEach(function() {
        this.zeroPad.restore();
        this.snapshotTotal.restore();
        this.snapshotSubtotals.restore();
      });

      it('fills the max date', function() {
        expect(this.lineChart.$snapshot.find('.js-max-date').html()).to.equal('01/31/2015');
      });

      it('calls zeroPad()', function() {
        expect(this.zeroPad).to.have.been.called;
      });

      it('adds data each entity type', function() {
        var candidate = $('#fixtures [data-total-for="candidate"]').html();
        var pac = $('#fixtures [data-total-for="pac"]').html();
        var party = $('#fixtures [data-total-for="party"]').html();
        expect(candidate).to.equal('$100.00');
        expect(pac).to.equal('$200.00');
        expect(party).to.equal('$300.00');
      });

      it('computes the snapshot total', function() {
        var total = this.lineChart.$snapshot.find('[data-total-for="all"]').html();
        expect(total).to.equal('$600.00');
      });
    });

    describe('navigating between cycles', function() {
      beforeEach(function() {
        this.moveCursor = sinon.stub(this.lineChart, 'moveCursor');
        this.previousCycle = sinon.stub(this.lineChart, 'previousCycle');
        this.nextCycle = sinon.stub(this.lineChart, 'nextCycle');
      });

      afterEach(function() {
        this.moveCursor.restore();
        this.previousCycle.restore();
        this.nextCycle.restore();
      });

      it('goes to a previous month if there is one', function() {
        this.lineChart.prevDatum = {date: '01/01/2015', candidate: '100'};
        this.lineChart.goToPreviousMonth();
        expect(this.moveCursor).to.have.been.called;
      });

      it('goes to the previous cycle if not the min cycle', function() {
        this.lineChart.cycle = 2014;
        this.lineChart.prevDatum = false;
        this.lineChart.goToPreviousMonth();
        expect(this.moveCursor).to.have.not.been.called;
        expect(this.previousCycle).to.have.been.called;
      });

      it('does not go to previous cycle if it is the min cycle', function() {
        this.lineChart.cycle = 2008;
        this.lineChart.prevDatum = false;
        this.lineChart.goToPreviousMonth();
        expect(this.previousCycle).to.have.not.been.called;
      });

      it('goes to next month if there is one', function() {
        this.lineChart.nextDatum = {date: '02/28/2015', candidate: '100'};
        this.lineChart.goToNextMonth();
        expect(this.moveCursor).to.have.been.called;
      });

      it('goes to the next cycle if not the max cycle', function() {
        this.lineChart.cycle = 2014;
        this.lineChart.nextDatum = false;
        this.lineChart.goToNextMonth();
        expect(this.moveCursor).to.have.not.been.called;
        expect(this.nextCycle).to.have.been.called;
      });

      it('does not go to next cycle if it is the max cycle', function() {
        // Set the current cycle dynamically so it doesn't break in future
        var currentYear = new Date().getFullYear();
        this.lineChart.cycle = currentYear % 2 === 0 ? currentYear : currentYear + 1;
        this.lineChart.nextDatum = false;
        this.lineChart.goToNextMonth();
        expect(this.nextCycle).to.have.not.been.called;
      });
    });

    it('removes the SVG', function() {
      this.lineChart.appendSVG();
      this.lineChart.removeSVG();
      expect($(this.lineChart.element[0]).find('svg').length).to.equal(0);
    });

    describe('navigation between cycles', function() {
      var removeSVG;

      beforeEach(function() {
        removeSVG = sinon.spy(this.lineChart, 'removeSVG');
      });

      afterEach(function() {
        removeSVG.restore();
      });

      it('goes to the previous cycle', function() {
        this.lineChart.previousCycle();
        expect(this.fetch).to.be.calledWith(2014);
        expect(removeSVG).to.have.been.called;
      });

      it('goes to the next cycle', function() {
        this.lineChart.nextCycle();
        expect(this.fetch).to.be.calledWith(2018);
        expect(removeSVG).to.have.been.called;
      });
    });

  });
