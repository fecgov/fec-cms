'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

var StickyBar = require('../../static/js/modules/sticky-bar').StickyBar;
var helpers = require('../../static/js/modules/helpers');

var DOM = '<div class="sticky" data-trigger-offset="100" style="height: 20px">Sticky bar</div>';

describe('Sticky bar', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
    $('body').css('padding-top', '0px');
  });

  beforeEach(function() {
    this.$fixture.empty().append(DOM);
    this.stickyBar = new StickyBar('.sticky');
  });

  it('locates DOM elements', function() {
    expect(this.stickyBar.$bar.is('#fixtures .sticky')).to.be.true;
  });

  it('configures the offsets and padding', function() {
    var offset = this.stickyBar.$bar.offset().top;
    expect(this.stickyBar.defaultBodyPadding).to.equal('0px');
    expect(this.stickyBar.offset).to.equal(offset);
    expect(this.stickyBar.triggerOffset).to.equal(100);
  });

  describe('scrolling down', function() {
    beforeEach(function() {
      sinon.stub($.prototype, 'scrollTop').returns(this.stickyBar.offset + 200);
    });

    afterEach(function() {
      $.prototype.scrollTop.restore();
    });

    it('sticks on large screens', function() {
      sinon.stub(helpers, 'isLargeScreen').returns(true);
      this.stickyBar.toggle();
      expect(this.stickyBar.$bar.hasClass('is-stuck')).to.be.true;
      expect($('body').css('padding-top')).to.equal('20px');
      helpers.isLargeScreen.restore();
    });

    it('does not stick on small screens', function() {
      sinon.stub(helpers, 'isLargeScreen').returns(false);
      this.stickyBar.toggle();
      expect(this.stickyBar.$bar.hasClass('is-stuck')).to.be.false;
      helpers.isLargeScreen.restore();
    });
  });

  describe('scrolling up', function() {
    beforeEach(function() {
      sinon.stub($.prototype, 'scrollTop').returns(this.stickyBar.offset - 200);
    });

    afterEach(function() {
      $.prototype.scrollTop.restore();
    });

    it('unsticks the bar', function() {
      this.stickyBar.toggle();
      expect(this.stickyBar.$bar.hasClass('is-stuck')).to.be.false;
    });
  });
});
