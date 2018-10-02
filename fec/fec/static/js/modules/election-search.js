'use strict';

/* global window */

var $ = require('jquery');
var URI = require('urijs');
var _ = require('underscore');
var moment = require('moment');

var analytics = require('./analytics');

var ElectionForm = require('./election-form').ElectionForm;
var ElectionMap = require('./election-map').ElectionMap;
var helpers = require('./helpers');
var decoders = require('./decoders');

var resultTemplate = require('../templates/electionResult.hbs');
var zipWarningTemplate = require('../templates/electionZipWarning.hbs');
var noResultsTemplate = require('../templates/electionNoResults.hbs');

var officeMap = {
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
function ElectionSearch(selector) {
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

  this.$resultsItems = this.$elm.find('.js-results-items');
  this.$resultsTitle = this.$elm.find('.js-results-title');

  this.$map = $('.election-map');
  this.map = new ElectionMap(this.$map.get(0), {
    drawStates: _.isEmpty(this.serialized),
    handleSelect: this.handleSelectMap.bind(this)
  });

  this.$zip.on('change', this.handleZipChange.bind(this));
  this.$state.on('change', this.performStateChange.bind(this));
  this.$form.on('change', 'input,select', this.performSearch.bind(this));
  this.$form.on('submit', this.performSearch.bind(this));
  this.$cycle.on('change', this.getPresidentialElections.bind(this));
  $(window).on('popstate', this.handlePopState.bind(this));

  this.getUpcomingElections();
  this.performStateChange();
  this.handlePopState();
}

ElectionSearch.prototype = Object.create(ElectionForm.prototype);
ElectionSearch.constructor = ElectionSearch;

ElectionSearch.prototype.updateRedistrictingMessage = function() {
  if (this.$cycle.val() == 2018 && this.$state.val() == 'PA') {
    $('.pa-message').show();
  } else {
    $('.pa-message').hide();
  }
};
ElectionSearch.prototype.performSearch = function() {
  this.search();
  this.updateRedistrictingMessage();
};
ElectionSearch.prototype.performStateChange = function() {
  this.handleStateChange();
  this.updateRedistrictingMessage();
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
  var url = helpers.buildUrl(['election-dates'], query);
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
  this.$state.val('').change();
  this.$district.val('');
};

/**
 * Handle a click on the map
 * Update the options in the distict <select> and call a search
 * @param {string} state - two-letter abbreviation of a state
 * @param {int} district - disctrict Number
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
 * @param {array} results - Array of API results
 * @param {int} cycle - The even-year value of a cycle
 */
ElectionSearch.prototype.removeWrongPresidentialElections = function(
  results,
  cycle
) {
  if (Number(cycle) % 4 > 0) {
    return _.filter(results, function(result) {
      return result.office !== 'P';
    });
  } else {
    return results;
  }
};

/**
 * Call the API with the values of the form and get a list of upcoming ElectionSearch
 * @param {event} e - event object
 * @param {object} opts - configuration options
 */
ElectionSearch.prototype.search = function(e, opts) {
  e && e.preventDefault();
  opts = _.extend({ pushState: true }, opts || {});
  var self = this;
  var serialized = self.serialize();
  if (self.shouldSearch(serialized)) {
    if (!_.isEqual(serialized, self.serialized)) {
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
        analytics.pageView();
      }
    } else if (self.results) {
      // Requested options match saved options; redraw cached results. This
      // ensures that clicking on a state or district will highlight it when
      // the search options don't match the state of the map, e.g. after the
      // user has run a search, then zoomed out and triggered a map redraw.
      var encodedDistricts = self.encodeDistricts(self.results);
      self.map.drawDistricts(encodedDistricts);
    }
  }
};

/**
 * Handles loading data from URL parameters if a query string is passed
 */
ElectionSearch.prototype.handlePopState = function() {
  var params = URI.parseQuery(window.location.search);
  var resultsItems = this.$resultsItems;
  if (
    URI.parseQuery(window.location.search).office !== 'president' &&
    !_.isEmpty(params)
  ) {
    console.log(URI.parseQuery(window.location.search).office);
    console.log(params);
    this.$zip.val(params.zip);
    this.$state.val(params.state);
    this.handleStateChange();
    this.$district.val(params.district);
    this.$cycle.val(params.cycle || this.$cycle.val());
    this.performSearch(null, { pushState: false });
//search presidential only if no query is passed or id office=president is pased
  } else {
    var self = this;
    var cycle = _.isEmpty(params)
      ? this.$cycle.val()
      : URI.parseQuery(window.location.search).cycle;
    this.$cycle.val(cycle);
    if (Number(this.$cycle.val()) % 4 == 0) {
      $.getJSON(
        this.getUrl(
          {
            office: 'president',
            cycle: cycle,
            election_full: 'true'
          }
        ),
        function(data) {
          if (data.results[0]) {
            var electionDate = self.formatGenericElectionDate(data.results[0]);
            resultsItems.append(
              resultTemplate({
                office: 'Presidential',
                electionType: 'General election',
                electionDate: electionDate,
                electionName: officeMap[data.results[0].office]
              })
            );
          }
        }
      );
    } else if (Number(this.$cycle.val()) % 4 !== 0) {
      resultsItems.empty();
      resultsItems.append('No general elections for ' + this.$cycle.val());
    }
    var obj = {
      office: 'president',
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
  }
};

ElectionSearch.prototype.getPresidentialElections = function() {
  var resultsItems = this.$resultsItems;
  var inputs = this.$form.find(':input').not(this.$cycle);
  var cycle = this.$cycle.val(); //|| URI.parseQuery(window.location.search).cycle
  if (inputs.val() == '' && Number(this.$cycle.val()) % 4 == 0) {
    var self = this;
    console.log(cycle);
    $.getJSON(
      this.getUrl({
        office: 'president',
        cycle: cycle,
        election_full: 'true'
      }),
      function(data) {
        if (data.results[0]) {
          console.log('results');
          var electionDate = self.formatGenericElectionDate(data.results[0]);
          var urlBase = ['elections/president'];
          var url = helpers.buildAppUrl([urlBase, data.results[0].cycle]);
          resultsItems.empty();
          resultsItems.append(
            resultTemplate({
              office: 'Presidential',
              electionType: 'General election',
              electionDate: electionDate,
              electionName: officeMap[data.results[0].office],
              url: url
            })
          );
        }
      }
    );
  } else if (inputs.val() == '' && Number(this.$cycle.val()) % 4 !== 0) {
    resultsItems.empty();
    resultsItems.append('No general elections for ' + this.$cycle.val());
  }
  var obj = {
    office: 'president',
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

ElectionSearch.prototype.shouldSearch = function(serialized) {
  return serialized.zip || serialized.state;
};

/**
 * Empties the contents of the search results list and then draws
 * the new results (not the map districts).
 * If we're on a past election, it will hide the map
 * @param {array} results - array of API election results
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
 * @param {object} result - a single result from the API
 */
ElectionSearch.prototype.drawResult = function(result) {
  var election = this.formatResult(result, this);
  var upcomingElections = _.filter(this.upcomingElections, function(upcoming) {
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
 * @param {jQuery} $svg - SVG element
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
    title += ' in ' + decoders.states[params.state];
    if (params.district && params.district !== '00') {
      title += ', district ' + params.district;
    }
  }
  return title;
};

/**
 * Format data into a uniform hash with pretty values that can be passed to the result templates
 * @param {object} result
 */
ElectionSearch.prototype.formatResult = function(result) {
  return _.extend({}, result, {
    officeName: officeMap[result.office],
    electionName: this.formatName(result),
    incumbent: this.formatIncumbent(result),
    color: this.formatColor(result),
    url: this.formatUrl(result)
  });
};

/**
 * Figure out the color to use for the map indicator of the search result
 * @param {object} result
 */
ElectionSearch.prototype.formatColor = function(result) {
  var palette = this.map.districtPalette[result.state] || {};
  return palette[result.district % palette.length] || '#000000';
};

/**
 * Format the name of the search result
 * @param {object} result
 */
ElectionSearch.prototype.formatName = function(result) {
  var parts = [decoders.states[result.state], officeMap[result.office]];
  if (result.district && result.district !== '00') {
    parts = parts.concat('District ' + result.district.toString());
  }
  return parts.join(' ');
};

/**
 * Get the date of the general election for a two-year period
 * @param {object} result
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
 * @param {object} result
 */
ElectionSearch.prototype.formatIncumbent = function(result) {
  if (result.incumbent_id) {
    return {
      name: result.incumbent_name,
      url: helpers.buildAppUrl(['candidate', result.incumbent_id])
    };
  } else {
    return null;
  }
};

/**
 * Format the URL to the election page
 * @param {object} result
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
  return helpers.buildAppUrl(path, {});
};

module.exports = {
  ElectionSearch: ElectionSearch
};
