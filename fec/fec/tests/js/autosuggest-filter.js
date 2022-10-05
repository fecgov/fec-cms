'use strict';

/*
var $ = require('jquery');
var _ = require('underscore');

window.$ = window.jQuery = $;
_.extend(window, {
  API_LOCATION: '',
  API_VERSION: '/v1'
});

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var autosuggest = require('../../static/js/modules/autosuggest');
var FilterAutosuggest = require('../../static/js/modules/filters/filter-autosuggest').FilterAutosuggest;

describe('FilterAutosuggest', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<div class="autosuggest-filter" data-filter="autosuggest" data-search-type="committees">' +
        '<ul class="dropdown__selected"></ul>' +
        '<input type="text" name="committee_id">' +
        '<button type="button"></button>' +
      '</div>'
    );

    this.filterAutosuggest = new FilterAutosuggest('[data-filter="autosuggest"]');
  });

  it('should initialize', function() {
    var autosuggest = this.filterAutosuggest.$elm.find('.autosuggest');
    expect(autosuggest.length).to.equal(1);
  });

  it('should set firstItem', function() {
    this.filterAutosuggest.setFirstItem({}, { id: 'smith' });
    expect(this.filterAutosuggest.firstItem.id).to.equal('smith');
  });

  it('should append checkbox and clear datum on autosuggest:select', function() {
    var appendCheckbox = sinon.spy(this.filterAutosuggest, 'appendCheckbox');
    var datum = {
      name: 'FAKE CANDIDATE',
      id: '12345'
    };
    this.filterAutosuggest.handleSelect({}, datum);

    expect(appendCheckbox).to.have.been.calledWith({
      name: 'committee_id',
      value: '12345',
      datum: datum
    });
    expect(this.filterAutosuggest.datum).to.equal(null);

    this.filterAutosuggest.appendCheckbox.restore();
  });

  it('should format the data when no autosuggest datum is passed in', function() {
    var input = {
      name: 'committee_id',
      label: '"George Washington"',
      value: '"George Washington"'
    };

    var expectedOutput = {
      name: 'committee_id',
      label: 'George Washington',
      value: 'George Washington',
      id: 'committee_id-George-Washington-checkbox'
    };

    var output = this.filterAutosuggest.formatCheckboxData(input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('should format the data when a autosuggest datum is passed in', function() {
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

    var output = this.filterAutosuggest.formatCheckboxData(input);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('should set this.datum on autosuggest:autocomplte', function() {
    this.filterAutosuggest.handleAutocomplete({}, { id: '12345' });
    expect(this.filterAutosuggest.datum).to.deep.equal({ id: '12345' });
  });

  it('should submit on enter', function() {
    var handleSubmit = sinon.spy(this.filterAutosuggest, 'handleSubmit');
    this.filterAutosuggest.handleKeypress({ keyCode: 13 });
    expect(handleSubmit).to.have.been.calledWith({ keyCode: 13 });
    this.filterAutosuggest.handleSubmit.restore();
  });

  it('should enable and disable button when the input changes', function() {
    var enableButton = sinon.spy(this.filterAutosuggest, 'enableButton');
    var disableButton = sinon.spy(this.filterAutosuggest, 'disableButton');

    this.filterAutosuggest.$field.autosuggest('val', 'FAKE CANDIDATE').change();
    expect(enableButton).to.have.been.called;

    this.filterAutosuggest.$field.autosuggest('val', '').change();
    expect(disableButton).to.have.been.called;

    this.filterAutosuggest.enableButton.restore();
    this.filterAutosuggest.disableButton.restore();
  });

  it('should clear input', function() {
    this.filterAutosuggest.$field.val('hello');
    this.filterAutosuggest.enableButton();
    this.filterAutosuggest.clearInput();
    expect(this.filterAutosuggest.$field.val()).to.equal('');
    expect(this.filterAutosuggest.$button.hasClass('is-disabled')).to.be.true;
  });

  it('should enable the search button', function() {
    this.filterAutosuggest.enableButton();
    expect(this.filterAutosuggest.searchEnabled).to.be.true;
    expect(this.filterAutosuggest.$button.hasClass('is-disabled')).to.be.false;
  });

  it('should disable the search button', function() {
    this.filterAutosuggest.disableButton();
    expect(this.filterAutosuggest.searchEnabled).to.be.false;
    expect(this.filterAutosuggest.$button.hasClass('is-disabled')).to.be.true;
  });

  describe('handleSubmit()', function() {
    beforeEach(function() {
      this.handleSelect = sinon.spy(this.filterAutosuggest, 'handleSelect');
      this.e = { name: 'event' };
    });

    it('should select this.datum if present', function() {
      this.filterAutosuggest.datum = { id: '12345' };
      this.filterAutosuggest.handleSubmit(this.e);
      expect(this.handleSelect).to.have.been.called;
    });

    it('should select this.firstItem if no datum and it does not allow text', function() {
      this.filterAutosuggest.datum = null;
      this.filterAutosuggest.allowText = false;
      this.filterAutosuggest.firstItem = { id: 'firstItem' };
      this.filterAutosuggest.handleSubmit(this.e);
      expect(this.handleSelect).to.have.been.calledWith(this.e, { id: 'firstItem' });
    });

    it('should select the free text input if present', function() {
      this.filterAutosuggest.allowText = true;
      this.filterAutosuggest.$field.autosuggest('val', 'freetext');
      this.filterAutosuggest.handleSubmit(this.e);
      expect(this.handleSelect).to.have.been.calledWith(this.e, { id: 'freetext' });
    });

    afterEach(function() {
      this.filterAutosuggest.handleSelect.restore();
    });
  });
});
*/
