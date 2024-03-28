// Common for all/most tests
import { expect, use } from 'chai';
import sinon from 'sinon/pkg/sinon-esm';
import * as sinonChai from 'sinon-chai';
use(sinonChai);
// import './setup.js';
// (end common)

import Listeners from '../../static/js/modules/listeners.js';

function dummyListener() { return true; }

describe('Listeners', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').empty().append(this.$fixture);
    this.listeners = new Listeners();
  });

  it('adds listeners', function() {
    this.listeners.on('#fixtures', dummyListener);
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
