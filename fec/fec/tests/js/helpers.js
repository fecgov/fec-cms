'use strict';

var chai = require('chai');
var expect = chai.expect;

var helpers = require('../../static/js/modules/helpers');

describe('helpers', function() {
  describe('sanitizeValue', function() {
    it('sanitizes a string', function() {
      var value = 'X0YZ12345><sCrIPt>alert(document.cookie)</ScRiPt>';

      expect(helpers.sanitizeValue(value)).to.equal('X0YZ12345');
    });

    it('sanitizes an array', function() {
      var value = [
          'X0YZ12345><sCrIPt>alert(document.cookie)</ScRiPt>',
          'A1BC67890'
      ];

      expect(helpers.sanitizeValue(value)).to.deep.equal(
          ['X0YZ12345', 'A1BC67890']
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
          ['X0YZ12345', null]
      );
    });
  });

  describe('sanitizeQueryParams', function() {
    it('sanitizes a collection of parameters', function() {
      var query = {
        candidate_id: 'H4GA06087"><sCrIPt>alert(document.cookie)</ScRiPt>',
        committee_id: 'C00509893',
        max_date: '12-31-2016',
        min_date: '01-01-2015',
        support_oppose_indicator: 'S',
        sort: '@#$(@#8923012;,/.as><AJKO@&amp;&#41;',
        q: '@@@@@@@@@@@@@@@@@@@@@@'
      };

      expect(helpers.sanitizeQueryParams(query)).to.deep.equal({
        candidate_id: 'H4GA06087',
        committee_id: 'C00509893',
        max_date: '12-31-2016',
        min_date: '01-01-2015',
        support_oppose_indicator: 'S',
        sort: '(8923012,.asAJKOamp41',
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
      var date = helpers.datetime('2017-12-25', {hash: {format: 'pretty'}});
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
