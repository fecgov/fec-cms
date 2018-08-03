'use strict';

var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

var electionUtils = require('../../static/js/modules/election-utils');
var electionOffices = require('../fixtures/election-offices');
require('./setup')();

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
      electionUtils.getStateElectionOffices(state);
      var offices = $('#election-offices');
      this.stub.calledOnce;
      expect(offices.children().length).to.be.greaterThan(1);
      done();
    });
  });
});
