'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var urls = require('../../static/js/modules/urls');
var analytics = require('../../static/js/modules/analytics');

// var params = {office: ['P']};
// var fields = ['office', 'cycle'];

function cleanUri() {
  var uri = window.location.toString();
  if (uri.indexOf('?') > 0) {
      var clean_uri = uri.substring(0, uri.indexOf('?'));
      window.history.replaceState({}, document.title, clean_uri);
  }
}

describe('urls.js', function() {
  beforeEach(function() {
    cleanUri();
  });

  describe('updateQuery()', function() {
    it('updates the url when a new query is made', function() {
      urls.updateQuery({office: 'P', cycle: 2020});
      expect(window.location.search).to.equal('?office=P&cycle=2020');
    });

    it('calls pageView()', function() {
      var pageView = sinon.spy(analytics, 'pageView');
      urls.updateQuery({office: 'P', cycle: 2020});
      expect(pageView).to.have.been.called;
      pageView.restore();
    });
  });

  describe('nextUrl()', function() {
    it('returns a new URL when given a new query', function() {
      var nextUrl = urls.nextUrl({office: ['H'], cycle: 2018}, ['office', 'cycle']);
      expect(nextUrl).to.equal('?office=H&cycle=2018');
    });

    it('returns null if the queries are the same', function() {
      sinon.stub(urls, 'compareQuery').returns(false);
      var nextUrl = urls.nextUrl({}, {}, ['office', 'cycle']);
      expect(nextUrl).to.be.null;
      urls.compareQuery.restore();
    });
  });

  describe('pushQuery()', function() {
    it('updates the url when a new query is made', function() {
      urls.updateQuery({office: 'P', cycle: 2020});
      expect(window.location.search).to.equal('?office=P&cycle=2020');
    });

    it('calls pageView()', function() {
      var pageView = sinon.spy(analytics, 'pageView');
      urls.updateQuery({office: 'P', cycle: 2020});
      expect(pageView).to.have.been.called;
      pageView.restore();
    });
  });

  describe('compareQuery()', function() {
    it('returns true for identifcal queries', function() {
      var identical = urls.compareQuery({office: ['P']}, {office: ['P']});
      expect(identical).to.be.true;
    });

    it('returns false for different queries', function() {
      var identical = urls.compareQuery({office: ['P']}, {office: ['S']});
      expect(identical).to.be.false;
    });
  });

  describe('ensureArray()', function() {
    it('turns a non array into an array', function() {
      var array = urls.ensureArray('a');
      expect(array).to.deep.equal(['a']);
    });
  });
});
