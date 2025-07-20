// Common for all/most tests
import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
import { spy, stub } from 'sinon/pkg/sinon-esm';
use(sinonChai);
// (end common)

import { default as URI } from 'urijs';
import { default as _extend } from 'underscore/modules/extend.js';

_extend(window, {
  context: {
    districts: {
      NJ: { state: 'New Jersey', districts: 12 },
      VA: { state: 'Virginia', districts: 11 }
    }
  }
});

import ElectionSearch from '../../static/js/modules/election-search.js';
import ElectionMap from '../../static/js/modules/election-map.js';

describe('election search', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  before(function() {
    stub(ElectionMap.prototype, 'init');
    stub(ElectionMap.prototype, 'drawDistricts');
  });

  beforeEach(function() {
    this.$fixture
      .empty()
      .append(
        '<div id="election-lookup">' +
          '<form>' +
          '<input name="cycle" value="2016" />' +
          '<input name="zip" />' +
          '<input name="state" />' +
          '<input name="district" />' +
          '</form>' +
          '<div class="results">' +
          '<div class="js-results-items"></div>' +
          '</div>' +
          '<div class="election-map"></div>' +
          '<div class="js-map-approx-message"></div>' +
          '<div class="js-map-message"></div>' +
          '</div>'
      );
    window.history.pushState({}, null, '/');
    this.el = new ElectionSearch('#election-lookup');
  });

  it('should memorize its selector', function() {
    expect(this.el.$elm.is($('#election-lookup'))).to.be.true;
  });

  it('should memorize its inputs', function() {
    expect(this.el.$zip.is($('#election-lookup [name="zip"]'))).to.be.true;
    expect(this.el.$state.is($('#election-lookup [name="state"]'))).to.be.true;
    expect(this.el.$district.is($('#election-lookup [name="district"]'))).to.be
      .true;
  });

  it('should disable the district select when state is not set', function() {
    this.el.$state.val('').trigger('change');
    expect(this.el.$district.prop('disabled')).to.be.true;
  });

  it('should disable the district select when state is set and the state does not have districts', function() {
    this.el.$state.val('AS').trigger('change');
    expect(this.el.$district.prop('disabled')).to.be.true;
  });

  it('should enable the district select when state is set and the state has districts', function() {
    this.el.$state.val('VA').trigger('change');
    expect(this.el.$district.prop('disabled')).to.be.false;
  });

  it('should clear the state select and disable the district select when the zip select is set', function() {
    this.el.$zip.val('19041').trigger('change');
    expect(this.el.$state.val()).to.equal('');
    expect(this.el.$district.prop('disabled')).to.be.true;
  });

  it('should serialize zip codes', function() {
    this.el.$zip.val('22902');
    expect(this.el.serialize()).to.deep.equal({ cycle: '2016', zip: '22902' });
  });

  it('should serialize state and district inputs', function() {
    this.el.$state.val('VA').trigger('change');
    this.el.$district.val('01');
    expect(this.el.serialize()).to.deep.equal({
      cycle: '2016',
      state: 'VA',
      district: '01'
    });
  });

  describe('drawing search results', function() {
    beforeEach(function() {
      this.drawItem = spy(ElectionSearch.prototype, 'drawResult');
      this.results = [
        { cycle: 2016, office: 'P', state: 'US' },
        { cycle: 2016, office: 'S', state: 'NJ' },
        { cycle: 2016, office: 'H', state: 'NJ', district: '09' }
      ];
      this.el.serialized = { cycle: '2016', state: 'NJ', district: '09' };
    });

    afterEach(function() {
      this.drawItem.restore();
    });

    it('should call drawResult', function() {
      this.el.draw(this.results);
      expect(this.drawItem).to.have.been.called;
    });
  });

  it('should show no results warning on no results by zip', function() {
    this.el.serialized = { cycle: '2016', zip: '19041' };
    this.el.draw([]);
    expect(this.el.$resultsItems.text()).to.contain(
      `We can't find any results for this ZIP code`
    );
    expect(this.el.$resultsTitle.text()).to.equal('');
  });

  it('should show no results warning on no results by state', function() {
    this.el.serialized = { cycle: '2016', state: 'VI' };
    this.el.draw([]);
    expect(this.el.$resultsItems.text()).to.contain(
      `We can't find any results for this location`
    );
    expect(this.el.$resultsTitle.text()).to.equal('');
  });

  describe('fetching ajax', function() {
    beforeEach(function() {
      this.response = {
        results: [
          { cycle: 2016, office: 'P', state: 'US' },
          { cycle: 2016, office: 'S', state: 'NJ' },
          { cycle: 2016, office: 'H', state: 'NJ', district: '09' }
        ]
      };
      this.deferred = $.Deferred();
      stub($, 'ajax').returns(this.deferred);
      this.deferred.resolve(this.response);
    });

    afterEach(function() {
      $.ajax.restore();
    });

    it('should fetch search results', function() {
      stub(this.el, 'draw');
      this.el.$zip.val('19041');
      this.el.search();
      expect($.ajax).to.have.been.called;
      var call = $.ajax.getCall(0);
      var uri = URI(call.args[0].url);
      expect(uri.path()).to.equal('/v1/elections/search/');
      expect(URI.parseQuery(uri.search())).to.deep.equal({
        api_key: '12345',
        per_page: '100',
        cycle: '2016',
        zip: '19041'
      });
      expect(URI.parseQuery(window.location.search)).to.deep.equal({
        cycle: '2016',
        zip: '19041'
      });
      expect(this.el.draw).to.have.been.calledWith(this.response.results);
    });

    it('should update form and search on popstate', function() {
      stub(this.el, 'draw');
      window.history.pushState({}, null, '?cycle=2016&zip=19041');
      this.el.handlePopState();
      expect(this.el.$zip.val()).to.equal('19041');
      expect($.ajax).to.have.been.called;
      var call = $.ajax.getCall(0);
      var uri = URI(call.args[0].url);
      expect(uri.path()).to.equal('/v1/elections/search/');
      expect(URI.parseQuery(uri.search())).to.deep.equal({
        api_key: '12345',
        per_page: '100',
        cycle: '2016',
        zip: '19041'
      });
    });

    it('should skip search if missing params', function() {
      stub(this.el, 'draw');
      this.el.search();
      expect($.ajax).not.to.have.been.called;
      expect(this.el.draw).not.to.have.been.called;
    });
  });

  it('removes incorrect presidential elections', function() {
    var raw = [{ cycle: 2018, office: 'P' }, { cycle: 2018, office: 'S' }];
    var results = this.el.removeWrongPresidentialElections(raw, '2018');
    expect(results).to.deep.equal([{ cycle: 2018, office: 'S' }]);
  });
});
