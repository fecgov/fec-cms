// Common for all/most tests
// import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
// import sinon from 'sinon/pkg/sinon-esm';
use(sinonChai);
// (end common)

import * as analytics from '../../static/js/modules/analytics.js';
import { compareQuery, ensureArray, nextUrl, updateQuery } from '../../static/js/modules/urls.js';
// import { pageView } from '../../static/js/modules/analytics.js';

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
      updateQuery({ office: 'P', cycle: 2020 });
      expect(window.location.search).to.equal('?office=P&cycle=2020');
    });

    it('calls pageView()', function() {
      var pageView = sinon.spy(analytics, 'pageView');
      updateQuery({ office: 'P', cycle: 2020 });
      expect(pageView).to.have.been.called;
      pageView.restore();
    });
    */
  });

  describe('nextUrl()', function() {
    it('returns a new URL when given a new query', function() {
      const theNextUrl = nextUrl({ office: ['H'], cycle: 2018 }, [
        'office',
        'cycle'
      ]);
      expect(theNextUrl).to.equal('?office=H&cycle=2018');
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
      updateQuery({ office: 'P', cycle: 2020 });
      expect(window.location.search).to.equal('?office=P&cycle=2020');
    });

    it('calls pageView()', function() {
      var pageView = sinon.spy(analytics, 'pageView');
      updateQuery({ office: 'P', cycle: 2020 });
      expect(pageView).to.have.been.called;
      pageView.restore();
    });
  });

  describe('compareQuery()', function() {
    it('returns true for identifcal queries', function() {
      var identical = compareQuery({ office: ['P'] }, { office: ['P'] });
      expect(identical).to.be.true;
    });

    it('returns false for different queries', function() {
      var identical = compareQuery({ office: ['P'] }, { office: ['S'] });
      expect(identical).to.be.false;
    });
  });

  describe('ensureArray()', function() {
    it('turns a non array into an array', function() {
      var array = ensureArray('a');
      expect(array).to.deep.equal(['a']);
    });
  });
});
