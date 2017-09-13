'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var SelectFilter = require('../../static/js/modules/filters/select-filter').SelectFilter;

describe('Select filter', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<div class="js-filter"' +
        'data-filter="select"' +
        'data-required-default="2016">' +
        '<label class="label" for="transaction-period">Transaction period</label>' +
        '<select name="transaction_period">' +
            '<option value="">Select an option</option>' +
            '<option value="2018">2018</option>' +
            '<option value="2016">2016</option>' +
            '<option value="2012">2012</option>' +
        '</select>' +
      '</div>'
    );
    this.filter = new SelectFilter(this.$fixture.find('.js-filter'));
    this.trigger = sinon.spy($.prototype, 'trigger');
  });

  it('sets its initial state', function() {
    expect(this.filter.name).to.equal('transaction_period');
    expect(this.filter.requiredDefault).to.equal(2016);
    expect(this.filter.$input.val()).to.equal('2016');
  });

  it('pulls values from query', function() {
    this.filter.fromQuery({
      transaction_period: 2018
    });
    expect(this.filter.$input.val()).to.equal('2018');
  });

  it('removes an empty option when setting required default', function() {
    expect(this.filter.$input.find('option[value=""]').length === 0).to.be.true;
  });

  it('sets sets selected prop on the selected option', function() {
    this.filter.setValue(2012);
    expect(this.filter.$input.find('option[value="2012"]').prop('selected')).to.be.true;
  });

  afterEach(function() {
    $.prototype.trigger.restore();
  });
});
