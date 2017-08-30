'use strict';

var _ = require('underscore');
var helpers = require('./helpers');
var utils = require('./election-utils');
var districts = require('../data/stateDistricts.json');
var districtTemplate = require('../templates/districts.hbs');

/**
 * Base class for all election lookup tools
 * @class
 * Base class for constructing election lookup tools
 * Both the ElectionSearch and ElectionLookup inherit from this class
 * It handles all logic around showing districts for the district select
 */
function ElectionForm(elm) {
  this.$elm = $(elm);
  this.$state = this.$elm.find('[name="state"]');
  this.$district = this.$elm.find('[name="district"]').prop('disabled', true);
  this.$submit = this.$elm.find('[type="submit"]');
  this.showSenateOption = true;
  this.$state.on('change', this.handleStateChange.bind(this));
}

/**
 * Identify if a select has an option matching a particular value
 * @param {jquery} $select - jQuery selector of a <select>
 * @param {string} value - The value to check for
 * @return {bool} whether or not the select has the value
 */
ElectionForm.prototype.hasOption = function($select, value) {
  return $select.find('option[value="' + value + '"]').length > 0;
};

/**
 * Handles a change event on the state field by calling
 * the updateDistricts() method and executing a search
 * If there's a zip field, it clears that.
 */
ElectionForm.prototype.handleStateChange = function() {

  var state = this.$state.val();
  this.updateDistricts(state);
  if (state && this.$zip) {
    this.$zip.val('');
  }

  this.search();
};

/**
 * Takes a state value and populates the district dropdown with the correct values
 * @param {string} state - two-letter abbreviation of a state
 */
ElectionForm.prototype.updateDistricts = function(state) {
  state = state || this.$state.val();
  this.districts = districts[state] ? districts[state].districts : 0;
  if (this.districts) {
    this.$district
      .html(districtTemplate({
        districts: _.range(1, this.districts + 1),
        senate: this.showSenateOption
      }))
      .val('')
      .prop('disabled', false);
  } else if (this.showSenateOption) {
    // When a state only has one house district, like Alaska, districts will be empty
    // This is a problem for the ElectionLookup where you need to have an option to
    // navigate to the house page.
    // If showSenateOption is true, we also want to show an at-large house district
    this.$district
      .html(districtTemplate({
        districts: null,
        atLargeHouse: true,
        senate: this.showSenateOption
      }))
      .val('')
      .prop('disabled', false);
  } else {
    this.$district.prop('disabled', true);
  }

};

/**
 * Convenience method for building an API URL to call for a query
 * @param {object} query - the query to pass to the URL
 */
ElectionForm.prototype.getUrl = function(query) {
  var params = _.extend({}, {per_page: 100}, query);
  return helpers.buildUrl(['elections', 'search'], params);
};

/**
 * Creates a serialized array from the form values
 */
ElectionForm.prototype.serialize = function() {
  var params = _.chain(this.$form.serializeArray())
    .map(function(obj) {
      return [obj.name, obj.value];
    })
    .object()
    .value();
  return _.extend(helpers.filterNull(params));
};

/**
 * Finds all unique district IDs based on the state and district number
 * @param {array} results - array of results returned from the API
 * @returns {array} an array of the unique district identifiers
 */
ElectionForm.prototype.encodeDistricts = function(results) {
  var encoded = _.chain(results)
    .filter(function(result) {
      return result.office === 'H';
    })
    .map(function(result) {
      return utils.encodeDistrict(result.state, result.district);
    })
    .value();
  var state = this.$state.val();
  var district = this.$district.val();
  if (state) {
    encoded.push(utils.encodeDistrict(state, district));
  }
  return _.unique(encoded);
};

module.exports = {
  ElectionForm: ElectionForm
};
