import { each, reduce } from 'underscore';
import { default as stateJson } from '../data/state.json' assert { type: 'json' };

function byField(values, key) {
  var getter =
    typeof key === 'function'
      ? key
      : function(val) {
          return val[key];
        };
  return reduce(
    values,
    function(acc, val) {
      acc[getter(val)] = val;
      return acc;
    },
    {}
  );
}

export const fips = each(stateJson, function(row) {
  row.STATE = parseInt(row.STATE);
});
export const fipsByCode = byField(fips, 'STATE');
export const fipsByState = byField(fips, 'STUSAB');
