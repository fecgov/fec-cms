'use strict';

/* global require, module */

var _ = require('underscore');

function byField(values, key) {
  var getter = typeof key === 'function' ?
    key :
    function(val) {
      return val[key];
    };
  return _.reduce(values, function(acc, val) {
    acc[getter(val)] = val;
    return acc;
  }, {});
}

var fips = _.each(require('../data/state.json'), function(row) {
  row.STATE = parseInt(row.STATE);
});
var fipsByCode = byField(fips, 'STATE');
var fipsByState = byField(fips, 'STUSAB');

module.exports = {
  fips: fips,
  fipsByCode: fipsByCode,
  fipsByState: fipsByState
};
