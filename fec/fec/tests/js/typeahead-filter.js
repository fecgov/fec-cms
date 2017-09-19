'use strict';

/* global require, window, describe, before, beforeEach, afterEach, it */

var $ = require('jquery');
var _ = require('underscore');

window.$ = window.jQuery = $;
_.extend(window, {
  API_LOCATION: '',
  API_VERSION: '/v1',
});

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var typeahead = require('../../static/js/modules/typeahead');
var FilterTypeahead = require('../../static/js/modules/filters/filter-typeahead').FilterTypeahead;

describe('FilterTypeahead', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<div class="typeahead-filter" data-filter="typeahead" data-dataset="committees">' +
        '<ul class="dropdown__selected"></ul>' +
        '<input type="text" name="committee_id">' +
        '<button type="button"></button>' +
      '</div>'
    );

    this.FilterTypeahead = new FilterTypeahead('[data-filter="typeahead"]', typeahead.datasets.committees, true);
  });

  it('should initialize', function() {
    var typeahead = this.FilterTypeahead.$elm.find('.twitter-typeahead');
    expect(typeahead.length).to.equal(1);
  });

  it('should set firstItem', function() {
    this.FilterTypeahead.setFirstItem({}, {id: 'smith'});
    expect(this.FilterTypeahead.firstItem.id).to.equal('smith');
  });

  it('should append checkbox and clear datum on typeahead:select', function() {
    var appendCheckbox = sinon.spy(this.FilterTypeahead, 'appendCheckbox');
    var datum = {
      name: 'FAKE CANDIDATE',
      id: '12345',
    };
    this.FilterTypeahead.handleSelect({}, datum);

    expect(appendCheckbox).to.have.been.calledWith({
      name: 'committee_id',
      value: '12345',
      datum: datum
    });
    expect(this.FilterTypeahead.datum).to.equal(null);

    this.FilterTypeahead.appendCheckbox.restore();
  });

  it('should format the data when no typeahead datum is passed in', function() {
    var input = {
      name: 'committee_id',
      label: '"George Washington"',
      value: '"George Washington"',
    };

    var expectedOutput = {
      name: 'committee_id',
      label: 'George Washington',
      value: 'George Washington',
      id: 'committee_id-George-Washington-checkbox'
    };

    var output = this.FilterTypeahead.formatCheckboxData(input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('should format the data when a typeahead datum is passed in', function() {
    var input = {
      name: 'committee_id',
      value: '12345',
      datum: {
        name: 'Washington Committee',
        id: '12345'
      }
    };

    var expectedOutput = {
      name: 'committee_id',
      label: 'Washington Committee (12345)',
      value: '12345',
      id: 'committee_id-12345-checkbox'
    };

    var output = this.FilterTypeahead.formatCheckboxData(input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('should set this.datum on typeahead:autocomplte', function() {
    this.FilterTypeahead.handleAutocomplete({}, {id: '12345'});
    expect(this.FilterTypeahead.datum).to.deep.equal({id: '12345'});
  });

  it('should submit on enter', function() {
    var handleSubmit = sinon.spy(this.FilterTypeahead, 'handleSubmit');
    this.FilterTypeahead.handleKeypress({keyCode: 13});
    expect(handleSubmit).to.have.been.calledWith({keyCode: 13});
    this.FilterTypeahead.handleSubmit.restore();
  });

  it('should enable and disable button when the input changes', function() {
    var enableButton = sinon.spy(this.FilterTypeahead, 'enableButton');
    var disableButton = sinon.spy(this.FilterTypeahead, 'disableButton');

    this.FilterTypeahead.$field.typeahead('val', 'FAKE CANDIDATE').change();
    expect(enableButton).to.have.been.called;

    this.FilterTypeahead.$field.typeahead('val', '').change();
    expect(disableButton).to.have.been.called;

    this.FilterTypeahead.enableButton.restore();
    this.FilterTypeahead.disableButton.restore();
  });

  it('should clear input', function() {
    this.FilterTypeahead.$field.val('hello');
    this.FilterTypeahead.enableButton();
    this.FilterTypeahead.clearInput();
    expect(this.FilterTypeahead.$field.val()).to.equal('');
    expect(this.FilterTypeahead.$button.hasClass('is-disabled')).to.be.true;
  });

  it('should enable the search button', function() {
    this.FilterTypeahead.enableButton();
    expect(this.FilterTypeahead.searchEnabled).to.be.true;
    expect(this.FilterTypeahead.$button.hasClass('is-disabled')).to.be.false;
  });

  it('should disable the search button', function() {
    this.FilterTypeahead.disableButton();
    expect(this.FilterTypeahead.searchEnabled).to.be.false;
    expect(this.FilterTypeahead.$button.hasClass('is-disabled')).to.be.true;
  });

  describe('handleSubmit()', function() {
    beforeEach(function() {
      this.handleSelect = sinon.spy(this.FilterTypeahead, 'handleSelect');
      this.e = {name: 'event'};
    });

    it('should select this.datum if present', function() {
      this.FilterTypeahead.datum = {id: '12345'};
      this.FilterTypeahead.handleSubmit(this.e);
      expect(this.handleSelect).to.have.been.called;
    });

    it('should select this.firstItem if no datum and it does not allow text', function() {
      this.FilterTypeahead.datum = null;
      this.FilterTypeahead.allowText = false;
      this.FilterTypeahead.firstItem = {id: 'firstItem'};
      this.FilterTypeahead.handleSubmit(this.e);
      expect(this.handleSelect).to.have.been.calledWith(this.e, {id: 'firstItem'});
    });

    it('should select the free text input if present', function() {
      this.FilterTypeahead.allowText = true;
      this.FilterTypeahead.$field.typeahead('val', 'freetext');
      this.FilterTypeahead.handleSubmit(this.e);
      expect(this.handleSelect).to.have.been.calledWith(this.e, {id: 'freetext'});
    });

    afterEach(function() {
      this.FilterTypeahead.handleSelect.restore();
    });
  });
});
