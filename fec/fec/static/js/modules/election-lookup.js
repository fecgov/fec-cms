/**
 * URLs: /data/
 * Templates: /fec/fec/data/templates/landing.jinja
 * Not to be confused with election-search.js, which is used on the homepage and /data/elections/
 */
'use strict';

var $ = require('jquery');
var helpers = require('./helpers');
var ElectionForm = require('./election-form').ElectionForm;
var ElectionMap = require('./election-map').ElectionMap;

/**
 * ElectionLookup
 * @class
 * The simpler form of the full ElectionSearch tool, used on the data landing page
 * This component has a map and the state and district selects
 * Inherits from the ElectionForm class
 */

function ElectionLookup(selector) {
  this.$elm = $(selector);
  this.$form = this.$elm.find('form');
  this.$state = this.$form.find('[name="state"]');
  this.$district = this.$form.find('[name="district"]').prop('disabled', true);
  this.$submit = this.$form.find('[type="submit"]');

  this.districts = 0;
  if (helpers.isInViewport(this.$elm)) {
    this.init();
  } else {
    $(window).on('scroll', this.init.bind(this));
  }
}

ElectionLookup.prototype = Object.create(ElectionForm.prototype);
ElectionLookup.constructor = ElectionLookup;

ElectionLookup.prototype.init = function() {
  if (this.initialized) {
    return;
  }
  this.$state.on('change', this.handleStateChange.bind(this));
  this.$district.on('change', this.handleDistrictChange.bind(this));

  // Show an option for the senate page in the district seelct
  this.showSenateOption = true;

  this.$map = $('.election-map');

  this.initialized = false;
  this.dormantMap = document.querySelector('.election-map.dormant');

  if (this.dormantMap) {
    this.dormantMap.addEventListener('click', this.wakeTheMap.bind(this));
    document.addEventListener('FEC-ElectionSearchInteraction', this.wakeTheMap.bind(this));
  } else {
    this.initInteractiveMap();
  }
};

/**
 * Makes the dormant map interactive,
 * removes the event listeners and calls initInteractiveMap()
 * Called when a user clicks the placeholder map image or when they interact with an
 * element of the election search form
 */
ElectionLookup.prototype.wakeTheMap = function() {
  // console.log('wakeTheMap()');
  if (this.initialized === false) {
    this.dormantMap.removeEventListener('click', this.wakeTheMap);
    document.removeEventListener('FEC-ElectionSearchInteraction', this.wakeTheMap);
    this.initInteractiveMap();
  }
};

/**
 * Removes the `dormant` class and title attribute from the placeholder map,
 * then initializes the interactive map
 */
ElectionLookup.prototype.initInteractiveMap = function() {
  if (!this.initialized) {
    if (this.dormantMap) {
      this.dormantMap.classList.remove('dormant');
      this.dormantMap.removeAttribute('title');
      this.dormantMap = null; // Let garbage collection sweep it
    }

    this.map = new ElectionMap(this.$map.get(0), {
      drawStates: true,
      handleSelect: this.handleSelectMap.bind(this)
    });

    this.initialized = true;
  }
};

/**
 * Handles a click event on the map
 * Updates the values in the district <select> and executes a search
 * @param {string} state - Two-letter state abbreviation
 * @param {integer} district - District number
 */
ElectionLookup.prototype.handleSelectMap = function(state, district) {
  this.$state.val(state);
  this.updateDistricts(state);
  if (district && this.hasOption(this.$district, district)) {
    this.$district.val(district);
  }
  this.search();
};

/**
 * Handles a change event of the district <select>
 * Calls the search method
 * If there's a value, change the text of the button to signify that it takes you to a page
 * If there's no value, revert to "search"
 * @param {jQuery.Event} e - Passed to this.search()
 */
ElectionLookup.prototype.handleDistrictChange = function(e) {
  this.search(e);
  if (e.target.value) {
    this.$submit.html('Go');
    this.$submit.removeClass('button--search--text').addClass('button--go');
  } else {
    this.$submit.html('Search');
    this.$submit.addClass('button--search--text').removeClass('button--go');
  }
};

/**
 * Calls the API with the value of the form fields
 * Passes the values of the districts returned by the API call to the map
 * @param {jQuery.Event=} e - If it's included, it gets preventDefault()
 */
ElectionLookup.prototype.search = function(e) {
  e && e.preventDefault();
  var self = this;
  this.xhr = $.getJSON(self.getUrl(this.serialize())).done(function(response) {
    // Note: Update district color map before rendering results
    var encodedDistricts = self.encodeDistricts(response.results);
    self.map.drawDistricts(encodedDistricts);
  });
};

module.exports = {
  ElectionLookup: ElectionLookup
};
