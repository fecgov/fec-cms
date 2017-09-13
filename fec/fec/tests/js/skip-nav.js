'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

var SkipNav = require('../../static/js/modules/skip-nav').Skipnav;

var DOM = '<a class="skip-nav">Skip</a><main><h1>Welcome</h1></main>';

describe('Skip nav link', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(DOM);
    this.skipNav = new SkipNav('.skip-nav', 'main');
  });

  it('locates DOM elements', function() {
    expect($(this.skipNav.anchor).is('#fixtures .skip-nav')).to.be.true;
    expect(this.skipNav.$targetBody.is('#fixtures main')).to.be.true;
    expect(this.skipNav.$target.is('#fixtures h1')).to.be.true;
  });

  it('focuses on the target when clicked', function() {
    var e = {type: 'click', preventDefault: function() {}};
    this.skipNav.focusOnTarget(e);
    expect($(document.activeElement).is(this.skipNav.$target)).to.be.true;
  });

  it('focuses on the target when enter pressed', function() {
    var e = {keyCode: 13, preventDefault: function() {}};
    this.skipNav.focusOnTarget(e);
    expect($(document.activeElement).is(this.skipNav.$target)).to.be.true;
  });
});
