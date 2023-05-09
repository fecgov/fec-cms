'use strict';

var $ = require('jquery');
var _ = require('underscore');
var helpers = require('./helpers');
var utils = require('./election-utils');
var districtTemplate = require('../templates/districts.hbs');

/**
 * Base class for all election lookup tools
 * @class
 * Base class for constructing election lookup tools
 * Both the ElectionSearch and ElectionLookup inherit from this class
 * It handles all logic around showing districts for the district select
 */
function ElectionForm(elm) {
  this.districts = 0;
  this.$cycle;
  this.$elm = $(elm);
  this.$state = this.$elm.find('[name="state"]');
  this.$district = this.$elm.find('[name="district"]').prop('disabled', true).val('');
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

  if (state && this.$zip) {
    this.$zip.val('');
  }

 this.updateDistricts();
};

/**
 * Calls getDistricts() to get list of districts for the selected state.
 * Populates the district dropdown with the correct values.
 * The district param can be passed in optionally to preserve
 * the selected district
 * performs a search at the end
 * @param {district} - number that represents the selected district
 */
ElectionForm.prototype.updateDistricts = function(district) {
  district = district === undefined ? '' : district;
  var self = this;

  self.getDistricts(function (result) {
  self.districts = result;
  self.updateDistrictDropdowns(district);
  self.search();
  });
};

/**
 * Convenience method for building an API URL to call for a query
 * @param {object} query - the query to pass to the URL
 */
ElectionForm.prototype.getUrl = function(query) {
  var params = _.extend({}, { per_page: 100 }, query);
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

/**
 * Gets the value of the state dropdown.
 * If cycle is undefined it calculates the current cycle.
 * If the state is defined it will make an API call to get districts
 * and return that value.
 * If state is undefined, it returns zero.
 */
ElectionForm.prototype.getDistricts = function(callback) {
  var state = this.$state.val();
  var year;

  if (this.$cycle === undefined || this.$cycle.val() === undefined) {
     var now = new Date();
     var currentYear = now.getFullYear();
       year = currentYear + 4 - (currentYear % 4);
  } else {
     year = this.$cycle.val();
  }

  if (state) {
  var query = {
    cycle: year,
    state: state,
    sort: '-district',
    office: 'house'
    };

  var url = this.getUrl(query);

  $.getJSON(url).done(function(response) {
    var result = response.results[0] === undefined ? 0 : response.results[0].district;
    callback(parseInt(result));
  });

 } else {
 callback(0);
 }
};

/**
 * Populates the district dropdown with the correct values.
 * The district param can be passed in optionally to preserve
 * the selected district
 * @param {district} - number that represents the selected district
 */
ElectionForm.prototype.updateDistrictDropdowns = function(district) {
    // for when a state loses a congressional district and the user changes
    // the cycle
    if(district > this.districts) {
        this.$district
      .html(
        districtTemplate({
          districts: _.range(1, this.districts + 1),
          senate: this.showSenateOption
        })
      )
      .val('')
      .prop('disabled', false)
      .change();
   } else if (this.districts) {
    this.$district
      .html(
        districtTemplate({
          districts: _.range(1, this.districts + 1),
          senate: this.showSenateOption
        })
      )
      .val(district)
      .prop('disabled', false);
  } else if (this.showSenateOption) {
    // When a state only has one house district, like Alaska, districts will be empty
    // This is a problem for the ElectionLookup where you need to have an option to
    // navigate to the house page.
    // If showSenateOption is true, we also want to show an at-large house district
    this.$district
      .html(
        districtTemplate({
          districts: null,
          atLargeHouse: true,
          senate: this.showSenateOption
        })
      )
      .val('')
      .prop('disabled', false);
  } else {
    this.$district.prop('disabled', true).val('');
  }
};

module.exports = {
  ElectionForm: ElectionForm
};
