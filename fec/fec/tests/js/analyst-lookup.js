'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var AnalystLookup = require('../../static/js/pages/contact-form').AnalystLookup;

describe('AnalystLookup', function() {
    before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<div class="js-analyst-lookup">' +
        '<input>' +
        '<p class="js-analyst-prompt" aria-hidden="false">Message.</p>' +
        '<div class="js-analyst-container">' +
          '<h5 class="js-analyst-name"></h5>' +
          '<span class="js-analyst-ext"></span>' +
        '</div>' +
      '</div>'
    );
    this.initTypeahead = sinon.spy(AnalystLookup.prototype, 'initTypeahead');
    this.fetch = sinon.spy(AnalystLookup.prototype, 'fetchAnalyst');
    this.lookup = new AnalystLookup($('.js-analyst-lookup'));
  });

  afterEach(function() {
    this.initTypeahead.restore();
    this.fetch.restore();
  });

  describe('constructor()', function() {
    it('finds all DOM elements', function() {
      expect(this.lookup.$elm.is('.js-analyst-lookup')).to.be.true;
      expect(this.lookup.$input.is('#fixtures input')).to.be.true;
      expect(this.lookup.$name.is('.js-analyst-name')).to.be.true;
      expect(this.lookup.$ext.is('.js-analyst-ext')).to.be.true;
      expect(this.lookup.$analystContainer.is('.js-analyst-container')).to.be.true;
      expect(this.lookup.$analystDetails.is('.js-yes-analyst')).to.be.true;
      expect(this.lookup.$analystNoResults.is('.js-no-analyst')).to.be.true;
      expect(this.lookup.$prompt.is('.js-analyst-prompt')).to.be.true;
    });

    it('initializes typeahead', function() {
      expect(this.initTypeahead).to.have.been.called;
    });
  });

  describe('fetching analysts', function() {
    it('calls fetchAnalyst on typeahead:select', function() {
      this.lookup.typeahead.$input.trigger('typeahead:select', {
        id: '12345'
      });
      expect(this.fetch).to.have.been.called;
    });
  });

  it('shows the analyst', function() {
    this.lookup.showAnalyst({'results': [{'first_name': 'Kim', 'last_name': 'Radical', 'telephone_ext': '1234'}]});
    expect(this.lookup.$name.html()).to.equal('Kim Radical');
    expect(this.lookup.$ext.html()).to.equal('1234');
    expect(this.lookup.$analystContainer.attr('aria-hidden')).to.equal('false');
    expect(this.lookup.$analystDetails.attr('aria-hidden')).to.equal('false');
    expect(this.lookup.$analystNoResults.attr('aria-hidden')).to.equal('true');
    expect(this.lookup.$prompt.attr('aria-hidden')).to.equal('true');
  });

  it('shows no assigned analyst', function() {
    this.lookup.showAnalyst({'results': [0]});
    expect(this.lookup.$analystContainer.attr('aria-hidden')).to.equal('true');
    expect(this.lookup.$analystDetails.attr('aria-hidden')).to.equal('true');
    expect(this.lookup.$analystNoResults.attr('aria-hidden')).to.equal('false');
    expect(this.lookup.$prompt.attr('aria-hidden')).to.equal('true');
  });

  it('hides the analyst', function() {
    this.lookup.hideAnalyst();
    expect(this.lookup.$name.html()).to.equal('');
    expect(this.lookup.$ext.html()).to.equal('');
    expect(this.lookup.$analystContainer.attr('aria-hidden')).to.equal('true');
    expect(this.lookup.$analystDetails.attr('aria-hidden')).to.equal('true');
    expect(this.lookup.$analystNoResults.attr('aria-hidden')).to.equal('true');
    expect(this.lookup.$prompt.attr('aria-hidden')).to.equal('false');
  });

  describe('handleChange()', function() {
    beforeEach(function() {
      this.hide = sinon.spy(AnalystLookup.prototype, 'hideAnalyst');
    });

    afterEach(function() {
      this.hide.restore();
    });

    it('clears the input if it is empty', function() {
      var $input = this.lookup.$input;
      this.lookup.handleChange({target: $input});
      expect(this.hide).to.have.been.called;
    });

    it('does not clear the input if there is a value', function() {
      var $input = this.lookup.$input;
      $input.val('Some value');
      this.lookup.handleChange({target: $input});
      expect(this.hide).to.not.have.been.called;
    });
  });
});
