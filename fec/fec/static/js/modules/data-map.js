'use strict';

const _ = require('underscore');
const topojson = require('topojson');
const colorbrewer = require('colorbrewer');
const utils = require('./election-utils');
const states = require('../data/us-states-10m.json');
const stateFeatures = topojson.feature(states, states.objects.states).features;
const L = require('leaflet');
require('leaflet-providers');

const FEATURE_TYPES = {
  STATES: 1,
  DISTRICTS: 2
};
const STATE_ZOOM_THRESHOLD = 4;

const defaultOpts = {
  colorScale: colorbrewer.Set1
};

const boundsOverrides = {
  200: { coords: [64.06, -152.23], zoom: 3 }
};

function getStatePalette(scale) {
  // let colorOptions = _.map(Object.keys(scale), function(key) {
  //   return parseInt(key);
  // });
  let colorOptions = Object.assign(Object.keys(scale), key => {
    return parseInt(key);
  });
  // return scale[_.max(colorOptions)];
  return scale[Math.max(colorOptions)];
}

function getDistrictPalette(scale) {
  // var colorOptions = _.map(Object.keys(scale), function(key) {
  //   return parseInt(key);
  // });
  var colorOptions = Object.assign(Object.keys(scale), key => {
    return parseInt(key);
  });
  let minColors = Math.min.apply(null, colorOptions);
  let maxColors = Math.max.apply(null, colorOptions);
  // return _.chain(utils.districtFeatures.features)
  //   .groupBy(function(feature) {
  //     let district = utils.decodeDistrict(feature.id);
  //     return district.state;
  //   })
  //   .map(function(features, state) {
  //     let numColors = Math.max(minColors, Math.min(features.length, maxColors));
  //     return [state, scale[numColors]];
  //   })
  //   .object()
  //   .value();
  utils.districtFeatures.features
    .groupBy(function(feature) {
      let district = utils.decodeDistrict(feature.id);
      return district.state;
    })
    .map(function(features, state) {
      let numColors = Math.max(minColors, Math.min(features.length, maxColors));
      return [state, scale[numColors]];
    })
    .object()
    .value();
}

/**
 * DataMap
 * Generates a clickable, zoomable map of states and districts
 * Sub-component referenced by ElectionSearch and ElectionLookup
 * @class
 * @param {string} elm - selector for the div to put the map in
 * @param {object} opts - Configuration options
 */
function DataMap(elm, opts) {
  this.elm = elm;
  // this.opts = _.extend({}, defaultOpts, opts);
  this.opts = Object.assign({}, defaultOpts, opts);
  this.statePalette = getStatePalette(this.opts.colorScale);
  this.districtPalette = getDistrictPalette(this.opts.colorScale);
  this.mapMessage = document.querySelector('.js-map-message');
  this.mapApproxMessage = document.querySelector('.js-map-approx-message');
  this.init();
}

/**
 * Initialize the map
 */
DataMap.prototype.init = function() {
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
DataMap.prototype.drawStates = function() {
  if (this.featureType === FEATURE_TYPES.STATES) {
    return;
  }
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
DataMap.prototype.drawDistricts = function(districts) {
  if (this.featureType === FEATURE_TYPES.DISTRICTS && !districts) {
    return;
  }
  this.featureType = FEATURE_TYPES.DISTRICTS;
  let features = districts
    ? this.filterDistricts(districts)
    : utils.districtFeatures;
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
DataMap.prototype.updateBounds = function(districts) {
  let self = this;
  let rule =
    districts &&
    // _.find(boundsOverrides, function(rule, district) {
    //   return districts.indexOf(parseInt(district)) !== -1;
    // }
    boundsOverrides.find((rule, district) => {
        return districts.indexOf(parseInt(district)) !== -1;
      }
    );
  this._viewReset = !!(rule || districts);
  if (rule) {
    this.map.setView(rule.coords, rule.zoom);
  } else if (districts) {
    self.map.flyToBounds(self.overlay.getBounds(), { duration: 0.25 });
  }
};

DataMap.prototype.drawBackgroundDistricts = function(districts) {
  if (!districts) {
    return;
  }
  // let states = _.chain(districts)
  let states = districts
    .map(function(district) {
      return Math.floor(district / 100);
    })
    .unique()
    .value();
  let stateDistricts = _.filter(utils.districtFeatures.features, function(
    feature
  ) {
    return (
      states.indexOf(Math.floor(feature.id / 100)) !== -1 &&
      districts.indexOf(feature.id) === -1
    );
  });
  L.geoJson(stateDistricts, {
    onEachFeature: _.partial(this.onEachDistrict.bind(this), _, _, {
      color: '#bbbbbb'
    })
  }).addTo(this.overlay);
};

DataMap.prototype.filterDistricts = function(districts) {
  return {
    type: utils.districtFeatures.type,
    features: utils.findDistricts(districts)
  };
};

DataMap.prototype.handleStateClick = function(e) {
  if (this.opts.handleSelect) {
    let state = utils.decodeState(e.target.feature.id);
    this.opts.handleSelect(state);
  }
};

DataMap.prototype.handleTileLoad = function(e) {
  e.tile.setAttribute('alt', 'Map tile image');
};

DataMap.prototype.onEachState = function(feature, layer) {
  let color = this.statePalette[feature.id % this.statePalette.length];
  layer.setStyle({ color: color });
  layer.on('click', this.handleStateClick.bind(this));
};

DataMap.prototype.onEachDistrict = function(feature, layer, opts) {
  opts = opts || {};
  let decoded = utils.decodeDistrict(feature.id);
  let palette = this.districtPalette[decoded.state];
  let color = palette[decoded.district % palette.length];
  layer.setStyle({ color: opts.color || color });
  layer.on('click', this.handleDistrictClick.bind(this));
};

DataMap.prototype.handleDistrictClick = function(e) {
  this.map.removeLayer(this.overlay);
  this.drawDistricts([e.target.feature.id]);
  if (this.opts.handleSelect) {
    let district = utils.decodeDistrict(e.target.feature.id);
    this.opts.handleSelect(district.state, district.district);
  }
};

DataMap.prototype.handleReset = function(e) {
  if (this._viewReset) {
    this._viewReset = false;
    return;
  }
  let zoom = e.target.getZoom();
  if (zoom <= STATE_ZOOM_THRESHOLD) {
    this.drawStates();
  } else if (!this.districts) {
    this.drawDistricts();
  }
};

/**
 * Hide the map
 */
DataMap.prototype.hide = function() {
  this.elm.setAttribute('aria-hidden', 'true');
  this.mapMessage.setAttribute('aria-hidden', 'false');
  this.mapApproxMessage.setAttribute('aria-hidden', 'true');
};

/**
 * Show the map
 */
DataMap.prototype.show = function() {
  this.elm.setAttribute('aria-hidden', 'false');
  this.mapMessage.setAttribute('aria-hidden', 'true');
  this.mapApproxMessage.setAttribute('aria-hidden', 'false');
};

module.exports = {
  DataMap
};
