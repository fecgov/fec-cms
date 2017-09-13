'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var Filter = require('../../static/js/modules/filters/filter-base').Filter;

describe('base filter', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<button class="accordion__trigger">Filter category</button>' +
      '<div class="accordion__content">' +
        '<div class="js-filter">' +
          '<label>Name</label>' +
          '<input id="name" name="name">' +
        '</div>' +
      '</div>'
    );
    this.filter = new Filter(this.$fixture.find('.js-filter'));
  });

  it('locates dom elements', function() {
    expect(this.filter.$elm.is('#fixtures .js-filter')).to.be.true;
    expect(this.filter.$input.is('#fixtures input')).to.be.true;
    expect(this.filter.$filterLabel.is('#fixtures .accordion__trigger')).to.be.true;
  });

  it('pulls name from $elm if present', function() {
    this.$fixture.empty().append(
      '<div class="js-filter" data-name="name-override">' +
        '<input name="name">' +
      '</div>'
    );
    var filter = new Filter(this.$fixture.find('.js-filter'));
    expect(filter.name).to.equal('name-override');
  });

  it('sets its initial state', function() {
    expect(this.filter.name).to.equal('name');
    expect(this.filter.fields).to.deep.equal(['name']);
  });

  it('pulls values from the query', function() {
    sinon.spy(Filter.prototype, 'setValue');
    var query = {'name': ['george', 'martha'], 'office': 'president'};
    this.filter.fromQuery(query);
    expect(Filter.prototype.setValue).to.have.been.calledWith(['george', 'martha']);
    expect(this.filter.loadedOnce).to.be.true;
  });

  it('sets the correct value', function() {
    this.filter.setValue('martha');
    expect(this.filter.$input.val()).to.equal('martha');
  });

  it('prepares the value with a prefix or suffix', function() {
    var $input = $('<input data-prefix="$" data-suffix="and more" type="text">');
    var value = this.filter.formatValue($input, 100);
    expect(value).to.equal('<span class="prefix">$</span>100<span class="suffix"> and more</span>');
  });

  it('increases filter count', function() {
    this.filter.handleAddEvent({}, {name: 'name'});
    expect(this.filter.$filterLabel.find('.filter-count').html()).to.equal('1');
  });

  it('decreases filter count', function() {
    this.filter.handleAddEvent({}, {name: 'name'});
    this.filter.handleRemoveEvent({}, {name: 'name', loadedOnce: true});
    expect(this.filter.$filterLabel.find('.filter-count').length).to.equal(0);
  });

  it('sets lastAction', function() {
    this.filter.setLastAction({type: 'filter:added'}, {name: 'name'});
    expect(this.filter.lastAction).to.equal('Filter added');
    this.filter.setLastAction({type: 'filter:removed'}, {name: 'name'});
    expect(this.filter.lastAction).to.equal('Filter removed');
    this.filter.setLastAction({type: ''}, {name: 'name'});
    expect(this.filter.lastAction).to.equal('Filter changed');
  });

  describe('enabling and disabling filters', function() {
    beforeEach(function() {
      this.trigger = sinon.spy($.prototype, 'trigger');
    });

    afterEach(function() {
      $.prototype.trigger.restore();
    });

    it('disables filters', function() {
        this.filter.$input.val('martha');
        this.filter.disable();
        expect(this.filter.isEnabled).to.be.false;
        expect(this.filter.$input.attr('class')).to.equal('is-disabled');
        expect(this.filter.$elm.find('label').attr('class')).to.equal('is-disabled');
        expect(this.trigger).to.have.been.calledWith('filter:disabled', {key: 'name'});
      });

    it('enables filters', function() {
        this.filter.disable();
        this.filter.enable();
        expect(this.filter.isEnabled).to.be.true;
        expect(this.filter.$input.attr('class')).to.not.equal('is-disabled');
        expect(this.filter.$elm.find('label').attr('class')).to.not.equal('is-disabled');
        expect(this.trigger).to.have.been.calledWith('filter:enabled', {key: 'name'});
    });
  });
});
