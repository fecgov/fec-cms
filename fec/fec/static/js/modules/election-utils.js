import { sprintf } from 'sprintf-js';
import { feature } from 'topojson-client/dist/topojson-client.js';
import { filter as _filter, find as _find } from 'underscore';

import { fipsByCode, fipsByState } from './fips.js';
// var fips = require('./fips');
import { buildUrl } from './helpers.js';
import { default as districts } from '../data/districts.json' assert { type: 'json' };
import { default as electionOfficesTemplate } from '../templates/electionOffices.hbs';

export const districtFeatures = feature(districts, districts.objects.districts);

export function encodeDistrict(state, district) {
  return (
    fipsByState[state.toUpperCase()].STATE * 100 +
    (parseInt(district) || 0)
  );
}

export function decodeDistrict(district) {
  district = sprintf('%04d', district);
  return {
    state: fipsByCode[parseInt(district.substring(0, 2))].STUSAB,
    district: parseInt(district.substring(2, 4))
  };
}

export function decodeState(state) {
  return fipsByCode[parseInt(state)].STUSAB;
}

function truncate(value, digits) {
  var multiplier = Math.pow(10, digits);
  return Math.floor(value / multiplier) * multiplier;
}

/**
 * Find district feature matching `district`.
 * Note: To handle occasional irregularities in district numbering, include
 *  districts that are exact matches, as well as district that match after
 *  rounding to the nearest 100.
 */
export function findDistrict(district) {
  return _find(districtFeatures.features, function(feature) {
    return feature.id === district || truncate(feature.id, 2) === district;
  });
}

/**
 * Find district features matching `districts`.
 * Note: To handle occasional irregularities in district numbering, include
 *  districts that are exact matches, as well as district that match after
 *  rounding to the nearest 100.
 */
export function findDistricts(districts) {
  return _filter(districtFeatures.features, function(feature) {
    return (
      districts.indexOf(feature.id) !== -1 ||
      districts.indexOf(truncate(feature.id, 2)) !== -1
    );
  });
}

export function getStateElectionOffices(state) {
  var query = {
    state: state
  };
  var url = buildUrl(['state-election-office'], query);
  $.getJSON(url).done(function(response) {
    var $offices_list = $('#election-offices');
    var offices = response.results;
    $offices_list.html(electionOfficesTemplate(offices));
  });
}
