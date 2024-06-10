// TODO: Do we still need this test if we aren't calling sortQuery from anywhere else in the repo?

import { expect } from 'chai';
import { sortQuery } from '../../static/js/modules/analytics.js';

describe('analytics', function() {
  it('sorts query parameters', function() {
    var query = {
      cycle: [2016, 2014],
      sort: 'name'
    };
    expect(sortQuery(query)).to.equal(
      'cycle=2014&cycle=2016&sort=name'
    );
  });
});
