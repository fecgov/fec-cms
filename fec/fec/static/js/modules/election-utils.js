'use strict';

/* global require, module */

var _ = require('underscore');
var topojson = require('topojson');

var s = require('underscore.string');
_.mixin(s.exports());

var fips = require('./fips');

var districts = require('../data/districts.json');
var districtFeatures = topojson.feature(districts, districts.objects.districts);

function encodeDistrict(state, district) {
  return fips.fipsByState[state.toUpperCase()].STATE * 100 + (parseInt(district) || 0);
}

function decodeDistrict(district) {
  district = _.sprintf('%04d', district);
  return {
    state: fips.fipsByCode[parseInt(district.substring(0, 2))].STUSAB,
    district: parseInt(district.substring(2, 4))
  };
}

function decodeState(state) {
  return fips.fipsByCode[parseInt(state)].STUSAB;
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
function findDistrict(district) {
  return _.find(districtFeatures.features, function(feature) {
    return feature.id === district ||
      truncate(feature.id, 2) === district;
  });
}

/**
 * Find district features matching `districts`.
 * Note: To handle occasional irregularities in district numbering, include
 *  districts that are exact matches, as well as district that match after
 *  rounding to the nearest 100.
 */
function findDistricts(districts) {
  return _.filter(districtFeatures.features, function(feature) {
    return districts.indexOf(feature.id) !== -1 ||
      districts.indexOf(truncate(feature.id, 2)) !== -1;
  });
}

module.exports = {
  findDistrict: findDistrict,
  findDistricts: findDistricts,
  districtFeatures: districtFeatures,
  encodeDistrict: encodeDistrict,
  decodeDistrict: decodeDistrict,
  decodeState: decodeState
};
