import { default as _chain } from 'underscore/modules/chain.js';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as _range } from 'underscore/modules/range.js';
import { default as _unique } from 'underscore/modules/uniq.js';

import { encodeDistrict } from './election-utils.js';
import { buildUrl, filterNull } from './helpers.js';
import { default as districts } from '../data/stateDistricts.json' assert { type: 'json' };
import { default as districtTemplate } from '../templates/districts.hbs';

/**
 * Base class for all election lookup tools
 * @class
 * Base class for constructing election lookup tools
 * Both the ElectionSearch and ElectionLookup inherit from this class
 * It handles all logic around showing districts for the district select
 */
export default function ElectionForm(elm) {
  this.$elm = $(elm);
  this.$state = this.$elm.find('[name="state"]');
  this.$district = this.$elm.find('[name="district"]').prop('disabled', true);
  this.$submit = this.$elm.find('[type="submit"]');
  this.showSenateOption = true;
  this.$state.on('change', this.handleStateChange.bind(this));
}

/**
 * Identify if a select has an option matching a particular value
 * @param {jQuery.Object} $select - jQuery.Object selector of a <select>
 * @param {string} value - The value to check for
 * @return {boolean} Whether or not the select has the value
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
  const state = this.$state.val();
  this.updateDistricts(state);
  if (state && this.$zip) {
    this.$zip.val('');
  }
  if (this.$state.val().length == 0) {
    this.$district.val('');
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
      .html(
        districtTemplate({
          districts: _range(1, this.districts + 1),
          senate: this.showSenateOption
        })
      )
      .val('')
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
    this.$district.prop('disabled', true);
  }
};

/**
 * Convenience method for building an API URL to call for a query
 * @param {Object} query - The query to pass to the URL
 * @param {string} query.state - Two-letter state abbreviation
 * @param {string} query.district - District number as a string
 * @returns {string} API URL `/elections/search/?state=${query.state}&district=${query.district}`
 */
ElectionForm.prototype.getUrl = function(query) {
  const params = _extend({}, { per_page: 100 }, query);
  document.dispatchEvent(new Event('FEC-ElectionSearchInteraction'));
  return buildUrl(['elections', 'search'], params);
};

/**
 * Creates a serialized array from the form values
 * @returns {Object} In the format of `{state: 'TX'}`
 */
ElectionForm.prototype.serialize = function() {
  const params = _chain(this.$form.serializeArray())
    .map(function(obj) {
      return [obj.name, obj.value];
    })
    .object()
    .value();
  return _extend(filterNull(params));
};

/**
 * Finds all unique district IDs based on the state and district number
 * @param {Array} results - Array of results returned from the API, similar to
 * `[{cycle: 2024, district: '00', office: 'P', state: 'US'}…]`
 * @returns {Array} An array of the unique district identifiers, e.g. `[4801, 4802, 4800]`
 */
ElectionForm.prototype.encodeDistricts = function(results) {
  let encoded = _chain(results)
    .filter(function(result) {
      return result.office === 'H';
    })
    .map(function(result) {
      return encodeDistrict(result.state, result.district);
    })
    .value();
  const state = this.$state.val();
  const district = this.$district.val();
  if (state) {
    encoded.push(encodeDistrict(state, district));
  }
  return _unique(encoded);
};
