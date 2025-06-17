/**
 * URLs: / and /data/elections/
 * Templates: /fec/data/templates/election-lookup.jinja
 * Not to be confused with election-lookup.js, which is used on /data/elections/
 */
import { default as moment } from 'moment';
import { default as _extend } from 'underscore/modules/extend.js';
import { default as _filter } from 'underscore/modules/filter.js';
import { default as _isEmpty } from 'underscore/modules/isEmpty.js';
import { default as _isEqual } from 'underscore/modules/isEqual.js';
import { default as URI } from 'urijs';

import { pageView } from './analytics.js';
import { states } from './decoders.js';
import ElectionForm from './election-form.js';
import ElectionMap from './election-map.js';
import { buildAppUrl, buildUrl } from './helpers.js';
import { default as noResultsTemplate } from '../templates/electionNoResults.hbs';
import { default as resultTemplate } from '../templates/electionResult.hbs';
import { default as zipWarningTemplate } from '../templates/electionZipWarning.hbs';
import { default as upcomingTemplate } from '../templates/upcomingPresidential.hbs';
// var resultTemplate = require('../templates/electionResult.hbs');
// var upcomingTemplate = require('../templates/upcomingPresidential.hbs');
// var zipWarningTemplate = require('../templates/electionZipWarning.hbs');
// var noResultsTemplate = require('../templates/electionNoResults.hbs');

const officeMap = {
  P: 'President',
  S: 'Senate',
  H: 'House'
};

/**
 * ElectionSearch
 * @class
 * Complex election lookup component that contains search controls, a map and search results
 * Inherits from the base ElectionForm class
 * @param {string} selector - Selector string
 */
export default function ElectionSearch(selector) {
  this.$elm = $(selector);
  this.districts = 0;
  this.serialized = {};
  this.results = [];
  this.xhr = null;
  this.upcomingElections = [];

  this.$form = this.$elm.find('form');
  this.$zip = this.$form.find('[name="zip"]');
  this.$state = this.$form.find('[name="state"]');
  this.$district = this.$form.find('[name="district"]').prop('disabled', true);
  this.$cycle = this.$form.find('[name="cycle"]');

  this.$resultsHeading = this.$elm.find('.js-results-heading');
  this.$resultsItems = this.$elm.find('.js-results-items');
  this.$resultsTitle = this.$elm.find('.js-results-title');
  this.$upcomingPresidential = this.$elm.find('.js-upcoming-presidential');

  this.$map = $('.election-map');

  this.$zip.on('change', this.handleZipChange.bind(this));
  this.$state.on('change', this.performStateChange.bind(this));
  this.$form.on('change', 'input,select', this.performSearch.bind(this));
  this.$form.on('submit', this.performSearch.bind(this));
  $(window).on('popstate', this.handlePopState.bind(this));

  this.initialized = false;
  this.dormantMap = document.querySelector('.election-map.dormant');
  this.zipSearchField = document.querySelector('#zip');

  if (this.dormantMap) {
    document.addEventListener('FEC-ElectionSearchInteraction', this.wakeTheMap.bind(this));
    this.dormantMap.addEventListener('click', this.wakeTheMap.bind(this));
    if (this.zipSearchField) this.zipSearchField.addEventListener('change', this.wakeTheMap.bind(this));
  } else {
    this.initInteractiveMap();
  }
}

ElectionSearch.prototype = Object.create(ElectionForm.prototype);
ElectionSearch.constructor = ElectionSearch;

/**
 * Makes the dormant map interactive,
 * removes the event listeners and calls initInteractiveMap()
 * Called when a user clicks the placeholder map image or when they interact with an
 * element of the election search form
 */
ElectionSearch.prototype.wakeTheMap = function() {
  if (!this.initialized) {
    document.removeEventListener('FEC-ElectionSearchInteraction', this.wakeTheMap.bind(this));
    if (this.dormantMap) this.dormantMap.removeEventListener('click', this.wakeTheMap.bind(this));
    if (this.zipSearchField) this.zipSearchField.removeEventListener('input', this.wakeTheMap.bind(this));
    this.initInteractiveMap();
  }
};

/**
 * Removes the `dormant` class and title attribute from the map,
 * then initializes the interactive map
 */
ElectionSearch.prototype.initInteractiveMap =function() {
  if (!this.initialized) {
    if (this.dormantMap) {
      this.dormantMap.classList.remove('dormant');
      this.dormantMap.removeAttribute('title');
      delete this.dormantMap;
    }

    if (!this.map) {
      this.map = new ElectionMap(this.$map.get(0), {
        drawStates: _isEmpty(this.serialized),
        handleSelect: this.handleSelectMap.bind(this)
      });
    }
    this.initialized = true;

    this.getUpcomingPresidentialElection();
    this.getUpcomingElections();
    this.performStateChange();
    this.handlePopState();
  }
};

/**
 * Toggles various components' states based on election year and state
 */
ElectionSearch.prototype.toggleComponents = function() {
  // The important years
  const firstYearToOfferMap = parseInt(window.DISTRICT_MAP_CUTOFF);
  const firstYearToOfferZip = parseInt(window.DISTRICT_MAP_CUTOFF);
  const firstYearToShowRedistrictingMsg = 2020;

  // The map elements
  const theMap = document.querySelector('.election-map');
  const theMapDisclaimer = document.querySelector('.js-map-approx-message');
  const theMapAltMessage = document.querySelector('.js-map-message');
  const theZipSearchParts = document.querySelectorAll(
    '.search-controls__zip, \
    .search-controls__zip input, \
    .search-controls__zip button'
  );
  const redistrictingMsgAccordion = document.querySelector('.js-accordion[data-content-prefix="2022-redistricting"]');

  // Should we show the map, zip, redistricting?
  const shouldShowMap = this.$cycle.val() >= firstYearToOfferMap;
  const shouldShowZip = this.$cycle.val() >= firstYearToOfferZip;
  const shouldShowRedistrictingMsg = this.$cycle.val() >= firstYearToShowRedistrictingMsg;
  const shouldShowRedistrictingMsgForPA = this.$cycle.val() == 2018 && this.$state.val() == 'PA';

  // The map and its alternate message
  if (theMap) theMap.setAttribute('aria-hidden', !shouldShowMap);
  if (theMapDisclaimer) theMapDisclaimer.setAttribute('aria-hidden', !shouldShowMap);
  if (theMapAltMessage) theMapAltMessage.setAttribute('aria-hidden', shouldShowMap);

  // ZIP Code search
  if (theZipSearchParts) {
    theZipSearchParts.forEach(el => {
      if (shouldShowZip) {
        el.classList.remove('is-disabled');
        el.removeAttribute('disabled');
      } else {
        el.classList.add('is-disabled');
        el.setAttribute('disabled', true);
      }
    });
  }

  // Redistricting message
  if (redistrictingMsgAccordion)
    redistrictingMsgAccordion.setAttribute('aria-hidden', !shouldShowRedistrictingMsg);

  // Pennsylvania redistricting message
  if (shouldShowRedistrictingMsgForPA) $('.pa-message').show();
  else $('.pa-message').hide();
};

ElectionSearch.prototype.performSearch = function() {
  document.dispatchEvent(new Event('FEC-ElectionSearchInteraction'));
  var inputs = this.$form.find(':input').not(this.$cycle);
  //only search presidential elections if no other parameters (zip, state, district) are present
  if (
    $(inputs).filter(function() {
      return $(this).val().length > 0;
    }).length == 0
  ) {
    this.getPresidentialElections();
    this.$resultsTitle.empty();
  }

  this.search();
  this.toggleComponents();
};
ElectionSearch.prototype.performStateChange = function() {
  this.handleStateChange();
  this.toggleComponents();
};

/**
 * Call the API to get a list of upcoming election dates
 */
ElectionSearch.prototype.getUpcomingElections = function() {
  var now = new Date();
  var month = now.getMonth() + 1;
  var today = now.getFullYear() + '-' + month + '-' + now.getDate();
  var query = {
    sort: 'election_date',
    min_election_date: today
  };
  var url = buildUrl(['election-dates'], query);
  var self = this;
  if (Number(this.$cycle.val()) >= now.getFullYear()) {
    $.getJSON(url).done(function(response) {
      self.upcomingElections = response.results;
    });
  }
};

/**
 * Handle a change event on the zip code fields
 */
ElectionSearch.prototype.handleZipChange = function() {
  this.$state.val('').trigger('change');
  this.$district.val('');
};

/**
 * Handle a click on the map
 * Update the options in the district <select> and call a search
 * @param {string} state - Two-letter abbreviation of a state
 * @param {int} district - District number
 */
ElectionSearch.prototype.handleSelectMap = function(state, district) {
  this.$zip.val('');
  this.$state.val(state);
  this.updateDistricts(state);
  if (district && this.hasOption(this.$district, district)) {
    this.$district.val(district);
  }
  this.performSearch();
};

/**
 * Hack to remove the presidential result in non-presidential years
 * Eventually this will be handled by the API
 * @param {Array} results - Array of API results
 * @param {int} cycle - The even-year value of a cycle
 */
ElectionSearch.prototype.removeWrongPresidentialElections = function(
  results,
  cycle
) {
  if (Number(cycle) % 4 > 0) {
    return _filter(results, function(result) {
      return result.office !== 'P';
    });
  } else {
    return results;
  }
};

/**
 * Call the API with the values of the form and get a list of upcoming ElectionSearch
 * @param {jQuery.Event=} e - If it exists, it gets preventDefault()
 * @param {Object=} opts - Default: `{pushState:true}`
 * @param {boolean} [opts.pushState] - Assigned `true` if it doesn't exist
 */
ElectionSearch.prototype.search = function(e, opts) {
  e && e.preventDefault();
  opts = _extend({ pushState: true }, opts || {});
  var self = this;
  var serialized = self.serialize();
  if (self.shouldSearch(serialized)) {
    if (!_isEqual(serialized, self.serialized)) {
      // Requested search options differ from saved options; request new data.
      self.xhr && self.xhr.abort();
      self.xhr = $.getJSON(self.getUrl(serialized)).done(function(response) {
        self.results = self.removeWrongPresidentialElections(
          response.results,
          serialized.cycle
        );
        // Note: Update district color map before rendering results
        var encodedDistricts = self.encodeDistricts(self.results);
        self.map.drawDistricts(encodedDistricts);
        self.draw(self.results);
      });
      self.serialized = serialized;
      if (opts.pushState) {
        window.history.pushState(
          serialized,
          null,
          URI('')
            .query(serialized)
            .toString()
        );
        pageView();
        self.$resultsHeading.show();
      }
    } else if (self.results) {
      self.$resultsHeading.show();
      // Requested options match saved options; redraw cached results. This
      // ensures that clicking on a state or district will highlight it when
      // the search options don't match the state of the map, e.g. after the
      // user has run a search, then zoomed out and triggered a map redraw.
      var encodedDistricts = self.encodeDistricts(self.results);
      if (encodedDistricts) self.map.drawDistricts(encodedDistricts);
    }
  }
};

/**
 * Handles loading data from URL parameters if a query string is passed
 */
ElectionSearch.prototype.handlePopState = function() {
  var params = URI.parseQuery(window.location.search);
  this.$zip.val(params.zip);
  this.$state.val(params.state);
  this.handleStateChange();
  this.$district.val(params.district);
  this.$cycle.val(params.cycle || this.$cycle.val());
  this.performSearch(null, { pushState: false });
};

// Search presidential elections only if no other parameters (zip, state, district) are present
ElectionSearch.prototype.getPresidentialElections = function() {
  var resultsItems = this.$resultsItems;
  var cycle = this.$cycle.val();
  if (Number(this.$cycle.val()) % 4 == 0) {
    var self = this;
    $.getJSON(
      this.getUrl({
        state: 'US',
        cycle: cycle,
        election_full: 'true'
      }),
      function(data) {
        if (data.results[0]) {
          var electionDate = self.formatGenericElectionDate(data.results[0]);
          var urlBase = ['elections/president'];
          var url = buildAppUrl([urlBase, data.results[0].cycle]);
          var election = {
            office: 'Presidential',
            electionType: 'General election',
            electionDate: electionDate,
            electionName: officeMap[data.results[0].office],
            url: url
          };
          self.$resultsHeading.show();
          self.$resultsTitle.text('');
          self.$resultsItems.empty();
          resultsItems.append(resultTemplate(election));
        }
      }
    );
  } else {
    resultsItems.empty();
  }
  var obj = {
    state: '',
    cycle: cycle,
    election_full: 'true'
  };
  window.history.pushState(
    obj,
    null,
    URI('')
      .query(obj)
      .toString()
  );
};

// Show next upcoming presidential election on page load
ElectionSearch.prototype.getUpcomingPresidentialElection = function() {
  var now = new Date();
  var currentYear = now.getFullYear();
  var queryP = {
    state: 'US',
    // Get upcoming presidential election year (unless the current year is an election year)
    cycle: currentYear % 4 === 0 ? currentYear : currentYear + 4 - (currentYear % 4)
  };
  var presidentialUrl = buildUrl(['elections', 'search'], queryP);
  var self = this;
  // Display the result based on election result template
  $.getJSON(presidentialUrl).done(function(response) {
    var result = response.results[0];
    var election = {
      cycle: result.cycle,
      electionName: self.formatName(result),
      url: self.formatUrl(result),
      electionDate: self.formatGenericElectionDate(result),
      electionType: 'General election'
    };
    self.$upcomingPresidential.append(upcomingTemplate(election));
  });
};

ElectionSearch.prototype.shouldSearch = function(serialized) {
  return serialized.zip || serialized.state;
};

/**
 * Empties the contents of the search results list and then draws
 * the new results (not the map districts).
 * If we're on a past election, it will hide the map
 * @param {Array} results - Array of API election results
 */
ElectionSearch.prototype.draw = function(results) {
  var self = this;
  if (results.length) {
    this.$resultsItems.empty();
    results.forEach(function(result) {
      self.drawResult(result);
    });
    if (this.serialized.zip) {
      this.drawZipWarning();
    }
    this.updateLocations();
    this.$resultsTitle.text(this.getTitle());
  } else {
    this.$resultsTitle.text('');
    this.$resultsItems.html(noResultsTemplate(this.serialized));
  }

  if (Number(this.$cycle.val()) < window.DISTRICT_MAP_CUTOFF) {
    this.map.hide();
  } else {
    this.map.show();
  }
};

/**
 * Outputs an individual text search result
 * Won't display a senate result if there's no senate election for the selected cycle
 * To do this, it checks each result against the list of upcomingElections
 * If there's an upcoming election for the district, it will get the actual date,
 * otherwise it will use a generic date
 * If there's multiple districts in the zip code, it will show a warning
 * @param {Object} result - a single result from the API
 */
ElectionSearch.prototype.drawResult = function(result) {
  var election = this.formatResult(result, this);
  var upcomingElections = _filter(this.upcomingElections, function(upcoming) {
    if (election.office === 'H') {
      return (
        upcoming.election_state === election.state &&
        upcoming.election_district === Number(election.district)
      );
    } else if (election.office === 'S') {
      return (
        upcoming.election_state === election.state &&
        upcoming.office_sought === election.office
      );
    }
  });

  if (upcomingElections.length > 0) {
    var parsed = moment(upcomingElections[0].election_date, 'YYYY-MM-DD');
    election.electionDate = parsed.isValid()
      ? parsed.format('MMMM Do, YYYY')
      : '';
    election.electionType = upcomingElections[0].election_type_full;
    this.$resultsItems.append(resultTemplate(election));
  } else {
    election.electionDate = this.formatGenericElectionDate(election);
    election.electionType = 'General election';
    this.$resultsItems.append(resultTemplate(election));
  }
};

ElectionSearch.prototype.drawZipWarning = function() {
  var houseResults = this.$resultsItems.find('.result[data-office="H"]');
  if (houseResults.length > 1) {
    houseResults.eq(0).before(zipWarningTemplate(this.serialized));
  }
};

/**
 * Fetch location image if not cached, then add to relevant districts
 */
ElectionSearch.prototype.updateLocations = function() {
  var self = this;
  var svg =
    self.$svg ||
    $.get('/static/img/i-map--primary.svg', '', null, 'xml').then(function(
      document
    ) {
      self.$svg = $(document.querySelector('svg'));
      return self.$svg;
    });

  $.when(svg).done(self.drawLocations.bind(self));
};

/**
 * Append highlighted location images to relevant districts
 * @param {jQuery.Object} $svg - SVG element
 */
ElectionSearch.prototype.drawLocations = function($svg) {
  this.$resultsItems.find('[data-color]').each(function(_, elm) {
    var $elm = $(elm);
    var $clone = $svg.clone();
    $clone.find('path').css('fill', $elm.data('color'));
    $elm.prepend($clone);
  });
};

/**
 * Generate a pretty title for the search results
 */
ElectionSearch.prototype.getTitle = function() {
  var params = this.serialized;
  var minYear = Number(params.cycle) - 1;
  var title = minYear + '–' + params.cycle + ' candidates';
  if (params.zip) {
    title += ' in ZIP code ' + params.zip;
  } else {
    title += ' in ' + states[params.state];
    if (params.district && params.district !== '00') {
      title += ', district ' + params.district;
    }
  }
  return title;
};

/**
 * Format data into a uniform hash with pretty values that can be passed to the result templates
 * @param {Object} result
 */
ElectionSearch.prototype.formatResult = function(result) {
  return _extend({}, result, {
    officeName: officeMap[result.office],
    electionName: this.formatName(result),
    incumbent: this.formatIncumbent(result),
    color: this.formatColor(result),
    url: this.formatUrl(result)
  });
};

/**
 * Figure out the color to use for the map indicator of the search result
 * @param {Object} result
 */
ElectionSearch.prototype.formatColor = function(result) {
  var palette = this.map.districtPalette[result.state] || {};
  if (officeMap[result.office] == 'Senate') {
    return '#000000';
  } else {
    return palette[result.district % palette.length] || '#000000';
  }
};

/**
 * Format the name of the search result
 * @param {Object} result
 */
ElectionSearch.prototype.formatName = function(result) {
  var parts = [states[result.state], officeMap[result.office]];
  if (result.district && result.district !== '00') {
    parts = parts.concat('District ' + result.district.toString());
  }
  return parts.join(' ');
};

/**
 * Get the date of the general election for a two-year period
 * @param {Object} result
 * @returns {string} - In the `MMMM Do, YYYY` format
 * (i.e. Full month name + ordinal date + four-digit year e.g. August 8th 2008)
 */
ElectionSearch.prototype.formatGenericElectionDate = function(result) {
  var date = moment()
    .year(result.cycle)
    .month('November')
    .date(1);
  while (date.format('E') !== '1') {
    date = date.add(1, 'day');
  }
  return date.add(1, 'day').format('MMMM Do, YYYY');
};

/**
 * If the result has an incumber, this formats the name of the person
 * @param {Object} result
 * @returns {Object|null} If a valid result, returns object in the format of
 * `{name: 'Incumbent Name, url: '/candidate/P12345678/'}` else returns `null`
 */
ElectionSearch.prototype.formatIncumbent = function(result) {
  if (result.incumbent_id) {
    return {
      name: result.incumbent_name,
      url: buildAppUrl(['candidate', result.incumbent_id])
    };
  } else {
    return null;
  }
};

/**
 * Format the URL to the election page
 * @param {Object} result
 * @param {string} result.cycle
 * @param {'P' | 'H' | 'S'} result.office
 * @param {string} [result.district]
 * @param {string} [result.state]
 * @returns {string} URL like `/data/elections/president/2024/`
 */
ElectionSearch.prototype.formatUrl = function(result) {
  var path = ['elections', officeMap[result.office].toLowerCase()];
  if (['S', 'H'].indexOf(result.office) !== -1) {
    path = path.concat(result.state);
  }
  if (result.office === 'H') {
    path = path.concat(result.district);
  }
  path = path.concat(result.cycle);
  return buildAppUrl(path, {});
};
