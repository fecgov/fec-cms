'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var ElectionFilter = require('../../static/js/modules/filters/election-filter').ElectionFilter;

describe('Election filter', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<div class="js-filter"' +
        'data-filter="election"' +
        'data-name="election_year"' +
        'data-cycle-name="cycle"' +
        'data-full-name="election_full"' +
        'data-duration="4"' +
        'data-default-cycle="2016">' +
        '<label class="label" for="election_year">Election</label>' +
        '<select name="election_year" class="js-election">' +
            '<option value="2016">2016</option>' +
            '<option value="2012">2012</option>' +
        '</select>' +
        '<fieldset>' +
          '<legend class="label">Time period</legend>' +
          '<div class="js-cycles"></div>' +
        '</fieldset>' +
        '<input type="hidden" name="cycle">' +
        '<input type="hidden" name="election_full"">' +
      '</div>'
    );
    this.filter = new ElectionFilter(this.$fixture.find('.js-filter'));
    this.filter.fromQuery({
      election_year: '2016',
      cycle: '2014',
      election_full: false
    });
    this.trigger = sinon.spy($.prototype, 'trigger');
  });

  it('sets its initial state', function() {
    expect(this.filter.name).to.equal('election_year');
    expect(this.filter.duration).to.equal(4);
    expect(this.filter.defaultCycle).to.equal(2016);
    expect(this.filter.fields).to.deep.equal(['election_year', 'cycle', 'election_full']);
  });

  it('pulls values from query', function() {
    this.filter.fromQuery({
      election_year: '2016',
      cycle: '2014',
      election_full: false
    });
    expect(this.filter.$election.val()).to.equal('2016');
    expect(this.filter.$cycles.find(':checked').val()).to.equal('2014:false');
  });

  it('builds cycle toggles on election change', function() {
    this.filter.handleElectionChange({target: this.filter.$election});
    expect(this.filter.$cycles.find('label').length).to.equal(3);
    expect(this.filter.$cycles.find('label:first-of-type input').is(':checked')).to.be.true;
  });

  it('handles cycle change', function() {
    var target = '<input type="radio" value="2014:false">';
    this.filter.handleCycleChange({target: target});
    expect(this.filter.$cycle.val()).to.equal('2014');
    expect(this.filter.$full.val()).to.equal('false');
  });

  it('sets a tag', function() {
    this.filter.loadedOnce = false;
    this.filter.$election.val('2016');
    this.filter.setTag();
    expect(this.trigger).to.have.been.calledWith('filter:added', [
      {
        key: 'election',
        value: '2016 election: 2013-2014',
        nonremovable: true,
        removeOnSwitch: false
      }
    ]);
  });

  it('renames a tag if it already exitss', function() {
    this.filter.loadedOnce = true;
    this.filter.$election.val('2012');
    this.filter.setTag();
    expect(this.trigger).to.have.been.calledWith('filter:renamed', [
      {
        key: 'election',
        value: '2012 election: 2013-2014',
        nonremovable: true,
        removeOnSwitch: false
      }
    ]);
  });

  afterEach(function() {
    $.prototype.trigger.restore();
  });
});
