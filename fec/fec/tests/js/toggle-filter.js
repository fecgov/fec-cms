'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var ToggleFilter = require('../../static/js/modules/filters/toggle-filter').ToggleFilter;
var DOM = '<fieldset class="js-filter" data-filter-ignore-count="true">' +
            '<legend class="label">Data type</legend>' +
            '<label for="processed">' +
              '<input type="radio" value="processed" id="processed" checked name="data_type" data-prefix="Data type:" data-tag-value="processed">' +
              '<span>Processed data</span>' +
            '</label>' +
            '<label for="efiling">' +
              '<input type="radio" value="efiling" id="efiling" name="data_type" data-prefix="Data type:" data-tag-value="electronic filings">' +
              '<span>Electronic filings</span>' +
            '</label>' +
          '</fieldset>';

describe('toggle filters', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(DOM);
    this.handleChange = sinon.spy(ToggleFilter.prototype, 'handleChange');
    this.filter = new ToggleFilter(this.$fixture.find('.js-filter'));
  });

  afterEach(function() {
    ToggleFilter.prototype.handleChange.restore();
  });

  it('locates dom elements', function() {
    expect(this.filter.$elm.is('#fixtures .js-filter')).to.be.true;
    expect(this.filter.$input.is('#fixtures input')).to.be.true;
  });

  it('sets its initial state', function() {
    expect(this.filter.name).to.equal('data_type');
    expect(this.filter.ignoreCount).to.be.true;
    expect(this.filter.removeOnSwitch).to.be.false;
    expect(this.filter.fields).to.deep.equal(['data_type']);
  });

  it('pulls values from the query', function() {
    var query = {'data_type': 'efiling'};
    this.filter.fromQuery(query);
    expect(this.filter.$elm.find('#processed').is(':checked')).to.be.false;
    expect(this.filter.$elm.find('#efiling').is(':checked')).to.be.true;
  });

  it('calls handleChange() on initial load', function() {
    expect(this.handleChange).to.have.been.called;
  });

  it('calls handleChange() on change', function() {
    this.filter.$elm.find('#efiling').prop('checked', true).change();
    expect(this.handleChange).to.have.been.called;
  });

  describe('handleChange()', function() {
    beforeEach(function() {
      this.trigger = sinon.spy($.prototype, 'trigger');
      this.$fixture.empty().append(DOM);
      this.filter = new ToggleFilter(this.$fixture.find('.js-filter'));
    });

    afterEach(function() {
      $.prototype.trigger.restore();
    });

    it('sets loaded-once on the input after loading', function() {
      expect(this.filter.loadedOnce).to.be.true;
    });

    it('triggers the add event on initial setting of toggle', function() {
      expect(this.trigger).to.have.been.calledWith('filter:added', [
        {
          key: 'data_type-toggle',
          value: '<span class="prefix">Data type: </span>processed',
          loadedOnce: false,
          name: 'data_type',
          nonremovable: true,
          removeOnSwitch: false,
          ignoreCount: true
        }
      ]);
    });

    it('triggers rename event on changing the toggle', function() {
      this.$fixture.find('#efiling').prop('checked', true).change();
      expect(this.trigger).to.have.been.calledWith('filter:renamed', [
        {
          key: 'data_type-toggle',
          value: '<span class="prefix">Data type: </span>electronic filings',
          loadedOnce: true,
          name: 'data_type',
          nonremovable: true,
          removeOnSwitch: false,
          ignoreCount: true
        }
      ]);
    });
  });
});
