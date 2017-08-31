'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

var TOC = require('../../static/js/modules/toc').TOC;

var DOM =
  '<ul class="toc">' +
    '<li><a href="#section-1">Section 1</a></li>' +
    '<li><a href="#section-2">Section 2</a></li>' +
  '</ul>' +
  '<div id="section-1"></div>' +
  '<div id="section-2"></div>';

describe('Table of contents', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(DOM);
    this.toc = new TOC('.toc');
  });

  it('locates the menu element', function() {
    expect(this.toc.$menu.is('#fixtures .toc')).to.be.true;
  });

  it('locates the correct number of sections', function() {
    expect(this.toc.sections.length).to.equal(2);
  });

  it('highlights the active item', function() {
    var $firstItem = this.toc.$menu.find('a[href="#section-1"]');
    var $secondItem = this.toc.$menu.find('a[href="#section-2"]');
    var mockWatcher = {isInViewport: true, $menuItem: $secondItem};
    $firstItem.addClass('is-active');
    this.toc.highlightActiveItem(mockWatcher);
    expect($firstItem.hasClass('is-active')).to.be.false;
    expect($secondItem.hasClass('is-active')).to.be.true;
  });

  it('scrolls to an item on click', function() {
    var $secondItem = this.toc.$menu.find('a[href="#section-2"]');
    var animate = sinon.spy($.prototype, 'animate');
    var top = $('#section-2').offset().top + 10;
    this.toc.scrollTo({target: $secondItem, preventDefault: function() {}});
    expect(animate).to.have.been.calledWith({scrollTop: top});
    animate.restore();
  });
});
