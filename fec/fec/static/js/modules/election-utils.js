'use strict';

/* global require, module */

var _ = require('underscore');
var fips = require('./fips');
var helpers = require('./helpers');
var moment = require('moment');
var s = require('underscore.string');
var topojson = require('topojson');

_.mixin(s.exports());

var electionDatesTemplate = require('../templates/electionDates.hbs');
var electionOfficesTemplate = require('../templates/electionOffices.hbs');

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

function getElections(state, office, cycle) {
  var officeSymbol = {
    'house': 'H',
    'senate': 'S',
    'president': 'P'
  };

  var defaultQuery = {
    'sort': '-election_date',
    'per_page': 2,
    'election_type_id': 'G',
    'election_state': state,
    'office_sought': officeSymbol[office]
  };

  var query = office !== 'president' ? defaultQuery : _.omit(defaultQuery, 'election_state');

  var url = helpers.buildUrl(['election-dates'], query);
  var $election_dates_results = $('.election-dates');
  $.getJSON(url).done(function(response) {
    var results = {
      last: moment(response.results[1].election_date).format('MMMM DD, YYYY'),
      current: moment(response.results[0].election_date).format('MMMM DD, YYYY')
    };
    $election_dates_results.html(electionDatesTemplate(results));
  });
}

function getStateElectionOffices(state) {
  var query = {
    state: state
  };
  var url = helpers.buildUrl(['state-election-office'], query);
  $.getJSON(url).done(function(response) {
    var $offices_list = $('#election-offices');
    var offices = response.results;
    $offices_list.html(electionOfficesTemplate(offices));
  });
}

module.exports = {
  districtFeatures: districtFeatures,
  decodeDistrict: decodeDistrict,
  decodeState: decodeState,
  encodeDistrict: encodeDistrict,
  findDistrict: findDistrict,
  findDistricts: findDistricts,
  getElections: getElections,
  getStateElectionOffices: getStateElectionOffices
};
