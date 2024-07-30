import { default as _each } from 'underscore/modules/each.js';
import { default as _reduce } from 'underscore/modules/reduce.js';

import { default as stateJson } from '../data/state.json' assert { type: 'json' };

function byField(values, key) {
  var getter =
    typeof key === 'function'
      ? key
      : function(val) {
          return val[key];
        };
  return _reduce(
    values,
    function(acc, val) {
      acc[getter(val)] = val;
      return acc;
    },
    {}
  );
}

export const fips = _each(stateJson, function(row) {
  row.STATE = parseInt(row.STATE);
});
export const fipsByCode = byField(fips, 'STATE');
export const fipsByState = byField(fips, 'STUSAB');
