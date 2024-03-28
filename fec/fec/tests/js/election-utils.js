// Common for all/most tests
import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
import sinon from 'sinon/pkg/sinon-esm';
use(sinonChai);
// (end common)

import { getStateElectionOffices } from '../../static/js/modules/election-utils.js';
import { default as electionOffices } from '../fixtures/election-offices.js';

describe('election-utils', function() {
  before(function(done) {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').empty().append(this.$fixture);
    this.stub = sinon.stub($, 'getJSON').returns({done: sinon.stub().callsArgWith(0, {results: electionOffices})});
    done();
  });

  after(function(done) {
    $('body').empty()
    done();
  });

  beforeEach(function(done) {
    this.$fixture.empty().append(
      '<div id="election-offices"></div>'
    );
    done();
  });

  afterEach(function(done) {
    this.$fixture.empty()
    this.stub.restore();
    done();
  });

  describe('getStateElectionOffices', function() {
    it('should query then attach state election office template', function(done) {
      var state = 'NV';
      getStateElectionOffices(state);
      var offices = $('#election-offices');
      this.stub.calledOnce;
      expect(offices.children().length).to.be.greaterThan(1);
      done();
    });
  });
});
