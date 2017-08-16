'use strict';

var _ = require('underscore');
var topojson = require('topojson');
var colorbrewer = require('colorbrewer');
var utils = require('./election-utils');
var states = require('../data/us-states-10m.json');
var stateFeatures = topojson.feature(states, states.objects.states).features;
var L = require('leaflet');
require('leaflet-providers');

var FEATURE_TYPES = {
  STATES: 1,
  DISTRICTS: 2
};
var STATE_ZOOM_THRESHOLD = 4;

var defaultOpts = {
  colorScale: colorbrewer.Set1
};

var boundsOverrides = {
  200: {coords: [64.06, -152.23], zoom: 3}
};

function getStatePalette(scale) {
  var colorOptions = _.map(Object.keys(scale), function(key) {
    return parseInt(key);
  });
  return scale[_.max(colorOptions)];
}

function getDistrictPalette(scale) {
  var colorOptions = _.map(Object.keys(scale), function(key) {
    return parseInt(key);
  });
  var minColors = Math.min.apply(null, colorOptions);
  var maxColors = Math.max.apply(null, colorOptions);
  return _.chain(utils.districtFeatures.features)
    .groupBy(function(feature) {
      var district = utils.decodeDistrict(feature.id);
      return district.state;
    })
    .map(function(features, state) {
      var numColors = Math.max(minColors, Math.min(features.length, maxColors));
      return [state, scale[numColors]];
    })
    .object()
    .value();
}

/**
 * ElectionMap
 * Generates a clickable, zoomable map of states and districts
 * Sub-component referenced by ElectionSearch and ElectionLookup
 * @class
 * @param {string} elm - selector for the div to put the map in
 * @param {object} opts - Configuration options
 */
function ElectionMap(elm, opts) {
  this.elm = elm;
  this.opts = _.extend({}, defaultOpts, opts);
  this.statePalette = getStatePalette(this.opts.colorScale);
  this.districtPalette = getDistrictPalette(this.opts.colorScale);
  this.mapMessage = document.querySelector('.js-map-message');
  this.init();
}

/**
 * Initialize the map
 */
ElectionMap.prototype.init = function() {
  this.overlay = null;
  this.districts = null;
  this.map = L.map(this.elm, {
    scrollWheelZoom: false,
    draggable: false,
    touchZoom: false
  });
  this.map.on('viewreset', this.handleReset.bind(this));
  this.tileLayer = L.tileLayer.provider('Stamen.TonerLite');
  this.tileLayer.on('tileload', this.handleTileLoad.bind(this));
  this.tileLayer.addTo(this.map);
  if (this.opts.drawStates) {
    this.map.setView([37.8, -96], 3);
  }
};

/**
 * Draw state overlays
 */
ElectionMap.prototype.drawStates = function() {
  if (this.featureType === FEATURE_TYPES.STATES) { return; }
  this.featureType = FEATURE_TYPES.STATES;
  if (this.overlay) {
    this.map.removeLayer(this.overlay);
  }
  this.districts = null;
  this.overlay = L.geoJson(stateFeatures, {
    onEachFeature: this.onEachState.bind(this)
  }).addTo(this.map);
};

/**
 * Draw district overlays
 * @param {array} districts - array of unique district identifiers
 */
ElectionMap.prototype.drawDistricts = function(districts) {
  if (this.featureType === FEATURE_TYPES.DISTRICTS && !districts) { return; }
  this.featureType = FEATURE_TYPES.DISTRICTS;
  var features = districts ?
    this.filterDistricts(districts) :
    utils.districtFeatures;
  if (this.overlay) {
    this.map.removeLayer(this.overlay);
  }
  this.districts = districts;
  this.overlay = L.geoJson(features, {
    onEachFeature: this.onEachDistrict.bind(this)
  }).addTo(this.map);
  this.updateBounds(districts);
  this.drawBackgroundDistricts(districts);
};

/**
 * Update the boundaries of the map
 * @param {array} districts - array of unique district identifiers
 */
ElectionMap.prototype.updateBounds = function(districts) {
  var rule = districts && _.find(boundsOverrides, function(rule, district) {
    return districts.indexOf(parseInt(district)) !== -1;
  });
  this._viewReset = !!(rule || districts);
  if (rule) {
    this.map.setView(rule.coords, rule.zoom);
  }
  else if (districts) {
    this.map.fitBounds(this.overlay.getBounds());
  }
};

ElectionMap.prototype.drawBackgroundDistricts = function(districts) {
  if (!districts) { return; }
  var states = _.chain(districts)
    .map(function(district) {
      return Math.floor(district / 100);
    })
    .unique()
    .value();
  var stateDistricts = _.filter(utils.districtFeatures.features, function(feature) {
    return states.indexOf(Math.floor(feature.id / 100)) !== -1 &&
      districts.indexOf(feature.id) === -1;
  });
  L.geoJson(stateDistricts, {
    onEachFeature: _.partial(this.onEachDistrict.bind(this), _, _, {color: '#bbbbbb'})
  }).addTo(this.overlay);
};

ElectionMap.prototype.filterDistricts = function(districts) {
  return {
    type: utils.districtFeatures.type,
    features: utils.findDistricts(districts)
  };
};

ElectionMap.prototype.handleStateClick = function(e) {
  if (this.opts.handleSelect) {
    var state = utils.decodeState(e.target.feature.id);
    this.opts.handleSelect(state);
  }
};

ElectionMap.prototype.handleTileLoad = function(e) {
  e.tile.setAttribute('alt', 'Map tile image');
};

ElectionMap.prototype.onEachState = function(feature, layer) {
  var color = this.statePalette[feature.id % this.statePalette.length];
  layer.setStyle({color: color});
  layer.on('click', this.handleStateClick.bind(this));
};

ElectionMap.prototype.onEachDistrict = function(feature, layer, opts) {
  opts = opts || {};
  var decoded = utils.decodeDistrict(feature.id);
  var palette = this.districtPalette[decoded.state];
  var color = palette[decoded.district % palette.length];
  layer.setStyle({color: opts.color || color});
  layer.on('click', this.handleDistrictClick.bind(this));
};

ElectionMap.prototype.handleDistrictClick = function(e) {
  this.map.removeLayer(this.overlay);
  this.drawDistricts([e.target.feature.id]);
  if (this.opts.handleSelect) {
    var district = utils.decodeDistrict(e.target.feature.id);
    this.opts.handleSelect(district.state, district.district);
  }
};

ElectionMap.prototype.handleReset = function(e) {
  if (this._viewReset) {
    this._viewReset = false;
    return;
  }
  var zoom = e.target.getZoom();
  if (zoom <= STATE_ZOOM_THRESHOLD) {
    this.drawStates();
  } else if (!this.districts) {
    this.drawDistricts();
  }
};

/**
 * Hide the map
 */
ElectionMap.prototype.hide = function() {
  this.elm.setAttribute('aria-hidden', 'true');
  this.mapMessage.setAttribute('aria-hidden', 'false');
};

/**
 * Show the map
 */
ElectionMap.prototype.show = function() {
  this.elm.setAttribute('aria-hidden', 'false');
  this.mapMessage.setAttribute('aria-hidden', 'true');
};

module.exports = {
  ElectionMap: ElectionMap,
};
