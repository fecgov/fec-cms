'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
var moment = require('moment');

chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var DateFilter = require('../../static/js/modules/filters/date-filter').DateFilter;

describe('date filter', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
    '<div id="date-filter" class="js-filter" data-filter="date" data-name="date" data-validate="true">' +
      '<fieldset>' +
      '<div class="range range--date js-date-range">' +
        '<div class="range__input range__input--min" data-filter="range">' +
          '<label for="min_date">Beginning</label>' +
          '<input type="text" id="min_date" name="min_date" data-range="min"'+
            ' class="js-min-date" data-prefix="Beginning">' +
        '</div>' +
        '<div class="range__hyphen">-</div>' +
        '<div class="range__input range__input--max" data-filter="range">' +
          '<label for="max_date">Ending</label>' +
          '<input type="text" id="max_date" name="max_date" data-range="max"' +
          ' class="js-max-date" data-prefix="Ending">' +
        '</div>' +
        '<button class="button--go button--standard" type="button">' +
          '<span class="u-visually-hidden">Search</span>' +
        '</button>' +
      '</div>' +
      '<div class="date-range__grid js-date-grid">' +
        '<div class="date-range__row">' +
          '<div class="date-range__year">' +
          '2015' +
          '</div>' +
          '<ul data-year="2015" class="date-range__months">' +
            '<li data-month="01"><div>Jan</div></li>' +
            '<li data-month="02"><div>Feb</div></li>' +
            '<li data-month="03"><div>Mar</div></li>' +
            '<li data-month="04"><div>Apr</div></li>' +
            '<li data-month="05"><div>May</div></li>' +
            '<li data-month="06"><div>Jun</div></li>' +
            '<li data-month="07"><div>Jul</div></li>' +
            '<li data-month="08"><div>Aug</div></li>' +
            '<li data-month="09"><div>Sep</div></li>' +
            '<li data-month="10"><div>Oct</div></li>' +
            '<li data-month="11"><div>Nov</div></li>' +
            '<li data-month="12"><div>Dec</div></li>' +
          '</ul>' +
        '</div>' +
        '<div class="date-range__row">' +
          '<div class="date-range__year">' +
            '2016' +
          '</div>' +
          '<ul data-year="2016" class="date-range__months">' +
            '<li data-month="01"><div>Jan</div></li>' +
            '<li data-month="02"><div>Feb</div></li>' +
            '<li data-month="03"><div>Mar</div></li>' +
            '<li data-month="04"><div>Apr</div></li>' +
            '<li data-month="05"><div>May</div></li>' +
            '<li data-month="06"><div>Jun</div></li>' +
            '<li data-month="07"><div>Jul</div></li>' +
            '<li data-month="08"><div>Aug</div></li>' +
            '<li data-month="09"><div>Sep</div></li>' +
            '<li data-month="10"><div>Oct</div></li>' +
            '<li data-month="11"><div>Nov</div></li>' +
            '<li data-month="12"><div>Dec</div></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</fieldset>' +
  '</div>'

    );
    this.filter = new DateFilter(this.$fixture.find('.js-filter'));
  });

  it('sets its initial state', function() {
    expect(this.filter.name).to.equal('date');
    expect(this.filter.fields).to.deep.equal(['min_date', 'max_date']);
    expect(this.filter.validateInput).to.be.true;
  });

  it('locates DOM elements', function() {
    expect(this.filter.$range.is('#fixtures .js-date-range')).to.be.true;
    expect(this.filter.$grid.is('#fixtures .js-date-grid')).to.be.true;
    expect(this.filter.$minDate.is('#fixtures .js-min-date')).to.be.true;
    expect(this.filter.$maxDate.is('#fixtures .js-max-date')).to.be.true;
    expect(this.filter.$submit.is('#fixtures button')).to.be.true;
  });

  it('pulls values from query', function() {
    this.filter.fromQuery({
      min_date: '01/01/2015',
      max_date: '01/31/2016'
    });
    expect(this.filter.$elm.find('[name="min_date"]').val()).to.equal('01/01/2015');
    expect(this.filter.$elm.find('[name="max_date"]').val()).to.equal('01/31/2016');
  });

  describe('handleInputChange()', function() {
    beforeEach(function() {
      this.trigger = sinon.spy($.prototype, 'trigger');
    });

    afterEach(function() {
      $.prototype.trigger.restore();
    });

    it('triggers an add event with all the right properties', function(){
      this.filter.$minDate.val('01/01/2015').change();
      expect(this.trigger).to.have.been.calledWith('filter:added', [{
        key: 'min_date',
        value: '<span class="prefix">Beginning </span>01/01/2015',
        loadedOnce: false,
        range: 'min',
        rangeName: 'date',
        name: 'date',
        nonremovable: true,
        removeOnSwitch: true
      }]);
    });

    it('triggers a remove event if the field has no value', function() {
      this.filter.$minDate.val('01/01/2015');
      this.filter.$minDate.val('').change();
      expect(this.trigger).to.have.been.calledWith('filter:removed');
    });

    it('triggers a rename event if the field had a value', function() {
      this.filter.$minDate.val('01/01/2015');
      this.filter.$minDate.data('had-value', true);
      this.filter.$minDate.val('02/01/2015').change();
      expect(this.trigger).to.have.been.calledWith('filter:renamed');
      expect(this.filter.$minDate.data('loaded-once')).to.be.true;
    });

    it('sets up the date grid', function() {
      sinon.spy(DateFilter.prototype, 'setupDateGrid');
      this.filter.handleInputChange({target: this.filter.$minDate});
      expect(this.filter.setupDateGrid).to.have.been.called;
      DateFilter.prototype.setupDateGrid.restore();
    });
  });

  describe('handleModifyEvent()', function() {
    beforeEach(function() {
      var today = new Date();
      this.today = moment(today).format('MM/DD/YYYY');
      this.thisYear = today.getFullYear();
      this.lastYear = today.getFullYear() - 1;
      this.firstDayOfLastYear = "01/01/" + this.lastYear.valueOf()
      var opts = {
        filterName: 'date',
        filterValue: this.thisYear,
      };

      this.filter.handleModifyEvent({}, opts);
    });

    it('sets the min and max year properties', function() {
      expect(this.filter.minYear).to.equal(this.lastYear);
      expect(this.filter.maxYear).to.equal(this.thisYear);
    });

    it('sets the min date to the first of the min year', function() {
      expect(this.filter.$minDate.val()).to.equal(this.firstDayOfLastYear);
    });

    it('sets the max date to today if max year is this year', function() {
      expect(this.filter.$maxDate.val()).to.equal(this.today);
    });

    it('sets the max date to the last of the year if not this year', function() {
      this.filter.handleModifyEvent({}, {
        filterName: 'date',
        filterValue: '2014'
      });

      expect(this.filter.$maxDate.val()).to.equal('12/31/2014');
    });
  });

  describe('validate()', function() {
    beforeEach(function() {
      this.trigger = sinon.spy($.prototype, 'trigger');
      this.hideWarning = sinon.spy(DateFilter.prototype, 'hideWarning');
      this.showWarning = sinon.spy(DateFilter.prototype, 'showWarning');
    });

    afterEach(function() {
      $.prototype.trigger.restore();
      DateFilter.prototype.hideWarning.restore();
      DateFilter.prototype.showWarning.restore();
    });

    it('triggers an valid event if valid', function() {
      this.filter.minYear = 2015;
      this.filter.maxYear = 2016;
      this.filter.$minDate.val('09/01/2015');
      this.filter.$maxDate.val('09/01/2016');
      this.filter.validate();
      expect(this.hideWarning).to.have.been.called;
      expect(this.trigger).to.have.been.calledWith('filters:validation', [{
        isValid: true
      }]);
    });

    it('triggers an invalid event if not valid', function() {
      this.filter.minYear = 2013;
      this.filter.maxYear = 2014;
      this.filter.$minDate.val('09/01/2015');
      this.filter.$maxDate.val('09/01/2016');
      this.filter.validate();
      expect(this.showWarning).to.have.been.called;
      expect(this.trigger).to.have.been.calledWith('filters:validation', [{
        isValid: false
      }]);
    });
  });

  describe('setting up the date grid', function() {
    before(function() {
      this.filter.minYear = 2013;
      this.filter.maxYear = 2014;
      this.filter.$minDate.val('01/01/2013');
      this.filter.$maxDate.val('12/31/2014');
      this.filter.setupDateGrid();

      // Store these for checking later
      this.$firstRange = this.filter.$elm.find('.date-range__row:first-of-type');
      this.$secondRange = this.filter.$elm.find('.date-range__row:last-of-type');
      this.$dateBegin = this.filter.$grid.find('ul[data-year="2013"] li[data-month="01"]');
      this.$dateEnd = this.filter.$grid.find('ul[data-year="2014"] li[data-month="12"]');
    });

    it('sets up a date grid with the correct years', function() {
      expect(this.$firstRange.find('.date-range__year').html()).to.equal('2013');
      expect(this.$secondRange.find('.date-range__year').html()).to.equal('2014');
    });

    it('adds the right classes to all months in the range', function() {
      expect(this.$dateBegin.attr('class')).to.include('month--begin');
      expect(this.$dateEnd.attr('class')).to.include('month--end');
      expect(this.$dateBegin.attr('class')).to.include('selected');
      expect(this.$dateEnd.attr('class')).to.include('selected');
      // Check if a random month has selected
      expect(this.$dateBegin.next('li').attr('class')).to.include('selected');
    });
  });

  describe('handleMinDateSelect()', function() {
    beforeEach(function() {
      this.filter.minYear = 2013;
      this.filter.maxYear = 2014;
      this.filter.$minDate.val('01/01/2013');
      this.filter.$maxDate.val('12/31/2014');
      this.filter.setupDateGrid();
      this.filter.handleMinDateSelect();
    });

    it('shows the grid', function() {
      expect(this.filter.$grid).to.be.visible;
    });

    it('adds the correct classes', function() {
      expect(this.filter.$grid.attr('class')).to.not.include('pick-max');
      expect(this.filter.$grid.attr('class')).to.include('pick-min');
      expect(this.filter.$grid.find('.month--begin').attr('class')).to.include('is-active');
    });
  });

  describe('handleMaxDateSelect()', function() {
    beforeEach(function() {
      this.filter.minYear = 2013;
      this.filter.maxYear = 2014;
      this.filter.$minDate.val('01/01/2013');
      this.filter.$maxDate.val('12/31/2014');
      this.filter.setupDateGrid();
      this.filter.handleMaxDateSelect();
    });

    it('shows the grid', function() {
      expect(this.filter.$grid).to.be.visible;
    });

    it('adds the correct classes', function() {
      expect(this.filter.$grid.attr('class')).to.not.include('pick-min');
      expect(this.filter.$grid.attr('class')).to.include('pick-max');
      expect(this.filter.$grid.find('.month--end').attr('class')).to.include('is-active');
    });
  });

  describe('handleGridItemSelect()', function() {
    beforeEach(function() {
      this.filter.minYear = 2013;
      this.filter.maxYear = 2014;
      this.filter.$minDate.val('01/01/2013');
      this.filter.$maxDate.val('12/31/2014');
      this.filter.setupDateGrid();
      this.target = this.filter.$grid.find('ul[data-year="2014"] li[data-month="09"] div');
    });

    it('sets the date range for a min data selection', function() {
      this.filter.$grid.addClass('pick-min');
      this.filter.handleGridItemSelect({target: this.target});
      expect(this.filter.$minDate.val()).to.equal('09/01/2014');
      expect(this.filter.$maxDate.val()).to.equal('12/31/2014');
    });

    it('sets the date range for a max data selection', function() {
      this.filter.$grid.addClass('pick-max');
      this.filter.handleGridItemSelect({target: this.target});
      expect(this.filter.$minDate.val()).to.equal('01/01/2013');
      expect(this.filter.$maxDate.val()).to.equal('09/30/2014');
    });

    it('focuses on the max input after selecting a min', function() {
      this.filter.$grid.addClass('pick-min');
      this.filter.handleGridItemSelect({target: this.target});
      expect(this.filter.$maxDate.is(document.activeElement)).to.be.true;
    });

    it('focuses on the submit button after selecting a max', function() {
      this.filter.$grid.addClass('pick-max');
      this.filter.handleGridItemSelect({target: this.target});
      expect(this.filter.$submit.is(document.activeElement)).to.be.true;
    });
  });

  it('shows a warning', function() {
    this.filter.setupDateGrid();
    this.filter.showWarning();
    expect(this.filter.$range.next('.message').length).to.equal(1);
    expect(this.filter.showingWarning).to.be.true;
    expect(this.filter.$grid).to.not.be.visible;
  });

  it('hides a warning', function() {
    this.filter.showWarning();
    this.filter.hideWarning();
    expect(this.filter.$range.next('.message').length).to.equal(0);
    expect(this.filter.showingWarning).to.be.false;
  });
});
