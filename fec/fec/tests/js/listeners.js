'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

var Listeners = require('../../static/js/modules/listeners').Listeners;

function dummyListener() { return true; }

describe('Listeners', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').empty().append(this.$fixture);
    this.listeners = new Listeners();
  });

  it('adds listeners', function() {
    this.listeners.on('#fixtures', dummyListener);
    // console.log(this.listeners.listeners[0].$elm);
    expect(this.listeners.listeners[0]).to.deep.equal(
      {$elm: $('#fixtures'), args: [dummyListener]}
    );
  });

  it('removes listeners', function() {
    var off = sinon.spy($.prototype, 'off');
    this.listeners.on('#fixtures', dummyListener);
    this.listeners.clear();
    expect(off).to.have.been.called;
    off.restore();
  });
});
