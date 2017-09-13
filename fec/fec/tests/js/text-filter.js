'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var TextFilter = require('../../static/js/modules/filters/text-filter').TextFilter;

describe('text filters', function() {
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
          '<button class="is-disabled"></button>' +
        '</div>' +
      '</div>'
    );
    this.filter = new TextFilter(this.$fixture.find('.js-filter'));
  });

  it('locates dom elements', function() {
    expect(this.filter.$elm.is('#fixtures .js-filter')).to.be.true;
    expect(this.filter.$input.is('#fixtures input')).to.be.true;
    expect(this.filter.$submit.is('#fixtures button')).to.be.true;
    expect(this.filter.$filterLabel.is('#fixtures .accordion__trigger')).to.be.true;
  });

  it('sets its initial state', function() {
    expect(this.filter.name).to.equal('name');
    expect(this.filter.fields).to.deep.equal(['name']);
    expect(this.filter.checkboxIndex).to.equal(1);
  });

  it('pulls values from the query', function() {
    var query = {'name': ['george', 'martha']};
    sinon.spy(TextFilter.prototype, 'appendCheckbox');
    this.filter.fromQuery(query);
    expect(TextFilter.prototype.appendCheckbox).to.have.been.calledWith('george');
    expect(TextFilter.prototype.appendCheckbox).to.have.been.calledWith('martha');
  });

  it('removes is-disabled on keyup', function() {
    this.filter.handleKeyup();
    expect(this.filter.$submit.attr('class')).to.not.equal('is-disabled');
  });

  it('adds disabled class on blur if there is no value', function() {
    this.filter.handleBlur();
    expect(this.filter.$submit.attr('class')).to.equal('is-disabled');
  });

  it('does not add disabled class if there is a value', function() {
    this.filter.$submit.removeClass('is-disabled');
    this.filter.$input.val('benjamin');
    this.filter.handleBlur();
    expect(this.filter.$submit.attr('class')).to.not.equal('is-disabled');
  });

  it('appends the checkbox list', function() {
    this.filter.appendCheckboxList();
    expect(this.filter.checkboxList.$elm.is('#fixtures ul')).to.be.true;
    expect(this.filter.checkboxList.name).to.equal('name');
  });

  it('appends a checkbox with the right data', function() {
    this.filter.appendCheckbox('martha');
    var $checkbox = this.$fixture.find('input[type="checkbox"]');
    expect($checkbox.length).to.be.equal(1);
    expect($checkbox.attr('id')).to.equal('name1');
    expect($checkbox.attr('name')).to.equal('name');
    expect($checkbox.attr('value')).to.equal('martha');
  });

  it('only appends the checkbox list once', function() {
    sinon.spy(TextFilter.prototype, 'appendCheckboxList');
    this.filter.checkboxList = 'fakelist';
    this.filter.appendCheckbox('martha');
    expect(TextFilter.prototype.appendCheckboxList).to.have.not.been.called;
  });

  it('strips quotes from the value', function() {
    this.filter.appendCheckbox('"george washington"');
    var $checkbox = this.$fixture.find('input[type="checkbox"]');
    expect($checkbox.attr('value')).to.equal('george washington');
  });

  describe('handleChange()', function() {
    it('removes the disabled class when the field has a value', function() {
      this.filter.$input.val('martha');
      this.filter.handleChange();
      expect(this.filter.$submit.attr('class')).to.not.equal('is-disabled');
    });

    it('adds the disabled class if there is no value', function() {
      this.filter.$input.val('');
      this.filter.handleChange();
      expect(this.filter.$submit.attr('class')).to.equal('is-disabled');
    });

    it('sets loaded-once on the input after loading', function() {
      this.filter.handleChange();
      expect(this.filter.$input.data('loaded-once')).to.be.true;
    });

    it('adds the loading class if it has loaded once', function() {
      this.filter.$input.data('loaded-once', true);
      this.filter.handleChange();
      expect(this.filter.$submit.attr('class')).to.contain('is-loading');
    });
  });
});
