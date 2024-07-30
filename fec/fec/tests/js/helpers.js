import './setup.js';
import { expect } from 'chai';

import * as helpers from '../../static/js/modules/helpers.js';

describe('helpers', function() {
  describe('buildTableQuery', function() {
    it('should create a query object from context and per page length', function() {
      var context = {};
      var perPage = 99;
      var results = helpers.buildTableQuery(context, { per_page: perPage });
      var expected = { per_page: perPage, sort_hide_null: true };

      expect(results).to.be.a('object');
      expect(results).to.deep.equal(expected);
    });
  });

  describe('buildTableQuery', function() {
    it('should create a query object from context use default page length', function() {
      var context = {};
      var results = helpers.buildTableQuery(context);
      var expected = { per_page: 100, sort_hide_null: true };

      expect(results).to.be.a('object');
      expect(results).to.deep.equal(expected);
    });
  });

  describe('anchorify', function() {

    before(function(done) {
      this.$fixture = $('<div id="fixtures"></div>');
      $('body').append(this.$fixture);
      done();
    });

    beforeEach(function() {
      this.$fixture.empty().append(
        '<div>' +
          '<span id="test" data-anchor="test">Test</span>' +
          '<span id="other-test" data-anchor="other-test">Other Test</span>' +
          '<span></span>' +
        '</div>'
      );
    });

    afterEach(function() {
      this.$fixture.empty();
    });

    it('should find, build, and attach links with data-anchor attribute', function() {
      helpers.anchorify('data-anchor');
      var anchors = $('[data-anchor]');
      var links = $('a');

      expect(anchors.length).to.equal(2);
      expect(links.length).to.equal(2);

      anchors.each(function(idx, item) {
        var elt = $(item);
        var anchorLink = '#' + elt.attr('id');
        var a = elt.find('a');
        var link = a.attr('href');

        expect(link).to.be.a('string');
        expect(link).contains('#');
        expect(link).to.equal(anchorLink);
      });
    });

    it.skip('should not build links when attribute not found', function() {
      helpers.anchorify('not-available');
      var anchors = $('[data-anchor]');
      var links = $('a');

      expect(anchors.length).to.equal(2);
      expect(links.length).to.equal(0);
    });
  });

  describe('sanitizeValue', function() {
    it('sanitizes a string', function() {
      var value = 'X0YZ12345><sCrIPt>alert(document.cookie)</ScRiPt>';
      expect(helpers.sanitizeValue(value)).to.equal('X0YZ12345gt');
    });

    it('sanitizes an array', function() {
      var value = [
          'X0YZ12345><sCrIPt>alert(document.cookie)</ScRiPt>',
          'A1BC67890'
      ];

      expect(helpers.sanitizeValue(value)).to.deep.equal(
          ['X0YZ12345gt', 'A1BC67890']
      );
    });

    it('skips sanitizing null values', function() {
      var value = null;

      expect(helpers.sanitizeValue(value)).to.be.null;
    });

    it('skips sanitizing undefined values', function() {
      var value;

      expect(helpers.sanitizeValue(value)).to.be.undefined;
    });

    it('sanitizes an array that includes null values', function() {
      var value = [
          'X0YZ12345"><sCrIPt>alert(document.cookie)</ScRiPt>',
          null
      ];

      expect(helpers.sanitizeValue(value)).to.deep.equal(
          ['X0YZ12345gt', null]
      );
    });

    it('removes all double quotes', function() {
      var value = '"committee name"';
      expect(helpers.sanitizeValue(value)).to.equal('committee name');
    });
  });

  describe('sanitizeQueryParams', function() {
    it('sanitizes a collection of parameters', function() {
      var query = {
        candidate_id: 'H4GA06087><sCrIPt>alert(document.cookie)</ScRiPt>',
        committee_id: 'C00509893',
        max_date: '12-31-2016',
        min_date: '01-01-2015',
        support_oppose_indicator: 'S',
        sort: '@#$(@#8923012;,/.as><AJKO@&amp;&#41;',
        q: '@@@@@@@@@@@@@@@@@@@@@@'
      };

      expect(helpers.sanitizeQueryParams(query)).to.deep.equal({
        candidate_id: 'H4GA06087gt',
        committee_id: 'C00509893',
        max_date: '12-31-2016',
        min_date: '01-01-2015',
        support_oppose_indicator: 'S',
        sort: '(8923012,.asgt',
        q: ''
      });
    });
  });

  describe('datetime()', function() {
    it('formats MM/DD/YYYY if no format was specified', function() {
      var date = helpers.datetime('2017-12-25', {});
      expect(date).to.equal('12/25/2017');
    });

    it('does not format invalid dates', function() {
      var date = helpers.datetime('17-41-2', {});
      expect(date).to.be.null;
    });

    it('formats a pretty date if specified', function() {
      var date = helpers.datetime('2017-12-25', { hash: { format: 'pretty' } });
      expect(date).to.equal('December 25, 2017');
    });
  });

  describe('window helpers', function() {
    it('gets window inner width', function() {
      var w = helpers.getWindowWidth();
      expect(w).to.equal(window.innerWidth);
    });

    it('identifies large screens', function() {
      window.innerWidth = 1200;
      expect(helpers.isLargeScreen()).to.be.true;
    });

    it('identifies non-large screens', function() {
      window.innerWidth = 800;
      expect(helpers.isLargeScreen()).to.be.false;
    });

    it('identifies medium screens', function() {
      window.innerWidth = 700;
      expect(helpers.isMediumScreen()).to.be.true;
    });

    it('identifies small screens', function() {
      window.innerWidth = 400;
      expect(helpers.isMediumScreen()).to.be.false;
    });
  });
});

describe('formatZipCode', function() {
  it('should add dashes to nine-digit numbers and strings of numbers', function() {
    expect(helpers.formatZipCode(123456789)).to.equal('12345-6789');
    expect(helpers.formatZipCode('123456789')).to.equal('12345-6789');
  });

  it('should return what it\'s given', function() {
    expect(helpers.formatZipCode(12345)).to.equal(12345);
    expect(helpers.formatZipCode('12345')).to.equal('12345');
    expect(helpers.formatZipCode(123456)).to.equal(123456);
    expect(helpers.formatZipCode('1234567')).to.equal('1234567');
    expect(helpers.formatZipCode('1234567.1')).to.equal('1234567.1');
    expect(helpers.formatZipCode('12345678.6')).to.equal('12345678.6');
    expect(helpers.formatZipCode('1234567890.6')).to.equal('1234567890.6');
    expect(helpers.formatZipCode('I2E4S6TB9')).to.equal('I2E4S6TB9');
    expect(helpers.formatZipCode('012345678')).to.equal('012345678');
  });
});
