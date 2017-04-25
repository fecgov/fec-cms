'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var ContactForm = require('../../static/js/contact-form').ContactForm;

describe('Contact form', function() {
    before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<form id="form">' +
        '<input class="js-contact-typeahead">' +
        '<input id="id_u_committee">' +
        '<select id="id_u_category">' +
          '<option value="option-1">Option 1</option>' +
          '<option value="other">Other</option>' +
        '</select>' +
        '<div id="other-reason">' +
          '<textarea id="id_u_other_reason"></textarea>' +
        '</div>' +
        '<button class="js-cancel">Cancel</button>' +
      '</form>'
    );
    this.initTypeahead = sinon.spy(ContactForm.prototype, 'initTypeahead');
    this.form = new ContactForm($('#form'));
  });

  afterEach(function() {
    this.initTypeahead.restore();
  });

  describe('constructor()', function() {
    it('finds all DOM elements', function() {
      expect(this.form.$elm.is('#form')).to.be.true;
      expect(this.form.committeeId.is('#id_u_committee')).to.be.true;
      expect(this.form.category.is('#id_u_category')).to.be.true;
      expect(this.form.otherReason.is('#other-reason')).to.be.true;
      expect(this.form.$cancel.is('.js-cancel')).to.be.true;
    });

    it('initializes typeahead', function() {
      expect(this.initTypeahead).to.have.been.called;
    });
  });

  describe('initOtherReason', function() {
    it('adds the conditional-field class', function() {
      expect(this.form.otherReason.attr('class')).to.equal('conditional-field');
    });

    it('hides the other reason box', function() {
      expect(this.form.otherReason.is(':visible')).to.be.false;
    });
  });

  it('sets the committeeId field to the value of the typeahead selection', function() {
    this.form.typeahead.$input.trigger('typeahead:select', {
      id: '12345'
    });
    expect(this.form.committeeId.val()).to.equal('12345');
  });

  it('shows the other reason box when other is selected', function() {
    this.form.category.val('other').change();
    expect(this.form.otherReason.is(':visible')).to.be.true;
  });

  it('hides the other reason box when another value is selected', function() {
    this.form.category.val('option-1').change();
    expect(this.form.otherReason.is(':visible')).to.be.false;
  });

  it('clears the form on cancel', function() {
    $('#id_u_committee').val('12345');
    $('#id_u_other_reason').val('Some other reason');
    $('select').val('other');
    this.form.$cancel.click();
    expect(this.form.committeeId.val()).to.equal('');
    expect($('select').val()).to.equal(null);
    expect($('#id_u_other_reason').val()).to.equal('');
  });
});
