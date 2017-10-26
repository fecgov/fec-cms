'use strict';

var chai = require('chai');
var expect = chai.expect;

var analytics = require('../../static/js/modules/analytics');

describe('analytics', function() {
  it('sorts query parameters', function() {
    var query = {
      cycle: [2016, 2014],
      sort: 'name',
    };
    expect(analytics.sortQuery(query)).to.equal('cycle=2014&cycle=2016&sort=name');
  });
});
