import { Set1 } from 'colorbrewer';
import { default as L } from 'leaflet';
import { feature } from 'topojson-client/dist/topojson-client.js';
import { chain as _chain, extend as _extend, filter as _filter, find as _find, map as _map, max as _max } from 'underscore';

import { decodeDistrict, decodeState, districtFeatures, findDistricts } from './election-utils.js';
import { default as states } from '../data/us-states-10m.json' assert { type: 'json' };

const stateFeatures = feature(states, states.objects.states).features;
import 'leaflet-providers';
// require('leaflet-providers');

const FEATURE_TYPES = {
  STATES: 1,
  DISTRICTS: 2
};
const STATE_ZOOM_THRESHOLD = 4;

let defaultOpts = {
  colorScale_states: Set1,
  colorScale_districts: Set1
};
// Doing the district color adjustment here in case Object.assign isn't supported
defaultOpts.colorScale_districts = Object.assign({}, Set1);
// Delete the last color for dists because the grey gets lost over our current map tiles
delete defaultOpts.colorScale_districts['9'];

const boundsOverrides = {
  200: { coords: [64.06, -152.23], zoom: 3 } // eslint-disable-line quote-props
};

function getStatePalette(scale) {
  var colorOptions = _map(Object.keys(scale), function(key) {
    return parseInt(key);
  });
  return scale[_max(colorOptions)];
}

function getDistrictPalette(scale) {
  var colorOptions = _map(Object.keys(scale), function(key) {
    return parseInt(key);
  });
  var minColors = Math.min.apply(null, colorOptions);
  var maxColors = Math.max.apply(null, colorOptions);
  return _chain(districtFeatures.features)
    .groupBy(function(feature) {
      var district = decodeDistrict(feature.id);
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
 * @param {Object} opts - Configuration options
 */
export default function ElectionMap(elm, opts) {
  this.elm = elm;
  this.opts = _extend({}, defaultOpts, opts);
  this.statePalette = getStatePalette(this.opts.colorScale_states);
  this.districtPalette = getDistrictPalette(this.opts.colorScale_districts);
  this.mapMessage = document.querySelector('.js-map-message');
  this.mapApproxMessage = document.querySelector('.js-map-approx-message');
  this.initialized = false;
  this.init();
}

/**
 * Initialize the map
 */
ElectionMap.prototype.init = function() {
  if (this.initialized === false) {
    this.overlay = null;
    this.districts = null;
    this.map = L.map(this.elm, {
      scrollWheelZoom: false,
      draggable: false,
      touchZoom: false
    });
    this.map.on('viewreset', this.handleReset.bind(this));
    this.tileLayer = L.tileLayer.provider('Stadia.StamenTonerLite');
    this.tileLayer.on('tileload', this.handleTileLoad.bind(this));
    this.tileLayer.addTo(this.map);
    if (this.opts.drawStates) {
      this.map.setView([37.8, -96], 3);
    }
    this.initialized = true;
  }
};

/**
 * Draw state overlays
 */
ElectionMap.prototype.drawStates = function() {
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
ElectionMap.prototype.drawDistricts = function(districts) {
  if (this.featureType === FEATURE_TYPES.DISTRICTS && !districts) {
    return;
  }
  this.featureType = FEATURE_TYPES.DISTRICTS;
  var features = districts
    ? this.filterDistricts(districts)
    : districtFeatures;
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
 * @param {Array} districts - Array of unique district identifiers
 */
ElectionMap.prototype.updateBounds = function(districts) {
  var self = this;
  var rule =
    districts &&
    _find(boundsOverrides, function(rule, district) {
      return districts.indexOf(parseInt(district)) !== -1;
    });
  this._viewReset = !!(rule || districts);
  if (rule) this.map.setView(rule.coords, rule.zoom);
  else if (districts.length >= 1) self.map.flyToBounds(self.overlay.getBounds(), { duration: 0.25 });
};

ElectionMap.prototype.drawBackgroundDistricts = function(districts) {
  if (!districts) {
    return;
  }
  var states = _chain(districts)
    .map(function(district) {
      return Math.floor(district / 100);
    })
    .unique() // TODO: jQuery deprecation
    .value();
  var stateDistricts = _filter(districtFeatures.features, function(
    feature
  ) {
    return (
      states.indexOf(Math.floor(feature.id / 100)) !== -1 &&
      districts.indexOf(feature.id) === -1
    );
  });
  L.geoJson(stateDistricts, {
    onEachFeature: this.onEachBackgroundDistrict.bind(this)
  }).addTo(this.overlay);
};

ElectionMap.prototype.filterDistricts = function(districts) {
  return {
    type: districtFeatures.type,
    features: findDistricts(districts)
  };
};

ElectionMap.prototype.handleStateClick = function(e) {
  if (this.opts.handleSelect) {
    var state = decodeState(e.target.feature.id);
    this.opts.handleSelect(state);
  }
};

ElectionMap.prototype.handleTileLoad = function(e) {
  e.tile.setAttribute('alt', 'Map tile image');
};

ElectionMap.prototype.onEachState = function(feature, layer) {
  var color = this.statePalette[feature.id % this.statePalette.length];
  layer.setStyle({ color: color });
  layer.on('click', this.handleStateClick.bind(this));
};

ElectionMap.prototype.onEachDistrict = function(feature, layer, opts) {
  opts = opts || {};
  var decoded = decodeDistrict(feature.id);
  var palette = this.districtPalette[decoded.state];
  var color = palette[decoded.district % palette.length];
  layer.setStyle({ color: opts.color || color });
  layer.on('click', this.handleDistrictClick.bind(this));
};

ElectionMap.prototype.onEachBackgroundDistrict = function(feature, layer) {
  layer.setStyle({ color: '#bbbbbb' });
  layer.on('click', this.handleDistrictClick.bind(this));
};

ElectionMap.prototype.handleDistrictClick = function(e) {
  this.map.removeLayer(this.overlay);
  this.drawDistricts([e.target.feature.id]);
  if (this.opts.handleSelect) {
    var district = decodeDistrict(e.target.feature.id);
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
  if (this.mapMessage) this.mapMessage.setAttribute('aria-hidden', 'false');
  if (this.mapApproxMessage) this.mapApproxMessage.setAttribute('aria-hidden', 'true');
};

/**
 * Show the map
 */
ElectionMap.prototype.show = function() {
  if (this.elm) this.elm.setAttribute('aria-hidden', 'false');
  if (this.mapMessage) this.mapMessage.setAttribute('aria-hidden', 'true');
  if (this.mapApproxMessage) this.mapApproxMessage.setAttribute('aria-hidden', 'false');
};
