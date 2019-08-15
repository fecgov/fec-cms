'use strict';

/**
 * Based on fec/fec/static/js/modules/election-map.js
 */

const d3 = require('d3');
const chroma = require('chroma-js');

// const _ = require('underscore');
const topojson = require('topojson');
const colorbrewer = require('colorbrewer');
// const utils = require('./election-utils');
const states = require('../data/us-states-10m.json');
// console.log('states: ', states);
let stateFeatures = topojson.feature(states, states.objects.states).features;
console.log('stateFeatures: ', stateFeatures);
const L = require('leaflet');
require('leaflet-providers');

const fips = require('./fips');

const compactRules = [['B', 9], ['M', 6], ['k', 3], ['', 0]];

// let FEATURE_TYPES = {
//   STATES: 1
//   // DISTRICTS: 2
// };
// let STATE_ZOOM_THRESHOLD = 4;

let defaultOpts = {
  colorScale: colorbrewer.Set1,
  height: 400,
  width: 400
};

// let boundsOverrides = {
//   200: { coords: [64.06, -152.23], zoom: 3 }
// };

/**
 * Called from DataMap constructor
 * @param {*} scale
 */
// function getColorPalette(scale) {
//   // console.log('getColorPalette(scale): ', scale);
//   // let colorOptions = _.map(Object.keys(scale), function(key) {
//   //   return parseInt(key);
//   // });
//   let colorOptions = Object.keys(scale).map(key => {
//     return parseInt(key);
//   });
//   // console.log('colorOptions: ', colorOptions);
//   // return scale[_.max(colorOptions)];
//   return scale[Math.max(...colorOptions)];
// }

/**
 *
 * @param {*} elm
 * @param {*} opts
 */
// function getDistrictPalette(scale) {
//   // var colorOptions = _.map(Object.keys(scale), function(key) {
//   //   return parseInt(key);
//   // });
//   var colorOptions = Object.keys(scale).map(key => {
//     return parseInt(key);
//   });
//   let minColors = Math.min.apply(null, colorOptions);
//   let maxColors = Math.max.apply(null, colorOptions);
//   return _.chain(utils.districtFeatures.features)
//     .groupBy(function(feature) {
//       let district = utils.decodeDistrict(feature.id);
//       return district.state;
//     })
//     .map(function(features, state) {
//       let numColors = Math.max(minColors, Math.min(features.length, maxColors));
//       return [state, scale[numColors]];
//     })
//     .object()
//     .value();
// }

/**
 * DataMap
 * Generates a clickable, zoomable map of states and districts
 * Sub-component referenced by ElectionSearch and ElectionLookup
 * @class
 * @param {string} elm - selector for the div to put the map in
 * @param {object} opts - Configuration options
 * @param {Boolean} opts.data
 * @param {Boolean} opts.width
 * @param {Boolean} opts.height
 * @param {Boolean} opts.min
 * @param {Boolean} opts.max
 * @param {Boolean} opts.addLegend
 * @param {Boolean} opts.addTooltips
 */
function DataMap(elm, opts) {
  this.elm = elm;
  this.data;
  this.legend;
  // this.map;
  this.maxValue;
  this.minValue;
  this.overlay;
  this.popup;
  // this.opts = _.extend({}, defaultOpts, opts);
  this.opts = Object.assign({}, defaultOpts, opts);
  // console.log('DataMap(elm, opts): ', opts);
  // this.colorPalette = getColorPalette(this.opts.colorScale);
  // console.log('colorPalette: ' + this.colorPalette);
  // this.districtPalette = getDistrictPalette(this.opts.colorScale);
  this.mapMessage = document.querySelector('.js-map-message');
  this.mapApproxMessage = document.querySelector('.js-map-approx-message');
  this.mapData;
  this.svg;
  // this.init();
}

/**
 * Initialize the map
 */
DataMap.prototype.init = function() {
  let instance = this;

  this.svg = d3
    .select(this.elm)
    .append('svg')
    // .attr('width', '100%') //this.width)
    // .attr('height', '100%') //this.height);
    .attr('viewBox', '30 50 353 300')
    .attr('preserveAspectRatio', 'xMidYMid meet');

  let projection = d3.geo
    .albersUsa()
    .scale(450)
    .translate([220, 150]);

  let path = d3.geo.path().projection(projection);

  let results = this.data['results'].reduce((acc, val) => {
    var row = fips.fipsByState[val.state] || {};
    var code = row.STATE ? parseInt(row.STATE) : null;
    acc[code] = val.total;
    return acc;
  }, {});
  this.mapData = results;

  let quantiles = 4;
  let totals = this.data['results']
    .map(value => value['total'])
    .filter(value => {
      return !!value;
    });

  this.min = this.min || Math.min(...totals);
  this.max = this.max || Math.max(...totals);

  let scale = chroma.scale(this.opts.colorScale).domain([this.min, this.max]);
  let quantize = d3.scale.linear().domain([this.min, this.max]);

  this.svg
    .append('g')
    .selectAll('path')
    .data(stateFeatures)
    .enter()
    .append('path')
    .attr('fill', function(d) {
      return instance.getStateValue(d.id)
        ? scale(instance.getStateValue(d.id))
        : instance.opts.colorZero;
    })
    .attr('data-state', function(d) {
      return fips.fipsByCode[d.id].STATE_NAME;
    })
    .attr('class', 'shape')
    .attr('d', path)
    .on('mouseover', function(d) {
      if (instance.getStateValue(d.id)) {
        this.parentNode.appendChild(this);
        this.classList.add('state--hover');
      }
    });

  if (this.opts.addLegend || typeof this.opts.addLegend === 'undefined') {
    let legendSVG = d3.select('.legend-container svg');
    stateLegend(legendSVG, scale, quantize, quantiles);
  }

  if (this.opts.addTooltips) {
    stateTooltips(this.svg, path, this);
  }

  // this.overlay = null;
  // this.districts = null;
  // this.map = L.map(this.elm, {
  //   scrollWheelZoom: false,
  //   draggable: false,
  //   touchZoom: false
  // });
  // this.map.on('viewreset', this.handleReset.bind(this));
  // this.tileLayer = L.tileLayer.provider('Stamen.TonerLite');
  // // this.tileLayer.on('tileload', this.handleTileLoad.bind(this));
  // this.tileLayer.addTo(this.map);
  // this.popup = L.popup();
  // // if (this.opts.drawStates) {
  // this.map.setView([37.8, -96], 3);
  // // }
  // if (this.opts.src) {
  //   console.log('WOULD HAVE LISTENED TO THE DATA SOURCE!');
  // }
  // TODO - Listen to srcUpdateDispatcher for data updates and re-draw map accordingly
  // if (srcUpdateDispatcher)
};

/**
 *
 * @param {String, Number} pathID
 */
DataMap.prototype.getStateValue = function(pathID) {
  if (pathID) return this.mapData[pathID];
  else return this.mapData;
};

/**
 *
 */
DataMap.prototype.applyNewData = function() {
  let instance = this;
  // let paths = this.elm.querySelectorAll('svg g path');
  // console.log('this.elm: ', this.elm);
  // console.log('paths: ', paths);

  // for (let i = 0; i < paths.length; i++) {
  //   let path = paths[i];
  //   console.log('paths[' + i + ']: ', path);
  //   this.svg.select('path.paths[i].data-state).data(
  //     this.data.results.filter((item, index, three, four) => {
  //       console.log('item, index: ', item, index, three, four);
  //       console.log('   paths[i].dataset[state];', paths[i].dataset['state']);
  //       return item.state_full == paths[i].dataset['state'];
  //     })
  //   );
  // }
  // for (var i = 0; i < this.data.results.length; i++) {
  //   console.log('');
  // }
  // this.svg.data(this.data);
  let scale = chroma.scale(this.opts.colorScale).domain([this.min, this.max]);

  this.mapData = this.data['results'].reduce((acc, val) => {
    var row = fips.fipsByState[val.state] || {};
    var code = row.STATE ? parseInt(row.STATE) : null;
    acc[code] = val.total;
    return acc;
  }, {});

  this.svg
    .selectAll('path')
    //   // .update()
    //   // .data(
    //   //   this.data.results.filter((item, index, three, four) => {
    //   //     console.log('d, item, index: ', d, item, index, three, four);
    //   //     return 'blah'; //item.state_full ==
    //   //   })
    //   // )
    //   .attr('fill', function(d) {
    //     return results[d.id] ? scale(results[d.id]) : this.opts.colorZero;
    //   });
    //   // .attr('data-state')
    // .data(results, function(d) {
    //   console.log('data function d: ', d);
    //   // this.data.results.filter((item, index, three, four) => {
    //   //   console.log('item, index: ', item, index, three, four);
    //   //   console.log('inside filter, this: ', this);
    //   //   return '5000000'; //item.state_full ==
    //   // })
    // })
    // .enter()
    // .append('path')
    .transition()
    .attr('fill', function(d) {
      console.log('inside fill, this: ', this);
      return instance.getStateValue(d.id)
        ? scale(instance.getStateValue(d.id))
        : instance.opts.colorZero;
    });
};

/**
 * Draw state overlays
 */
DataMap.prototype.drawStates = function() {
  // console.log('drawStates()');
  // if (this.featureType === FEATURE_TYPES.STATES) {
  //   return;
  // }
  // this.featureType = FEATURE_TYPES.STATES;
  if (this.overlay) {
    this.map.removeLayer(this.overlay);
  }
  // this.districts = null;
  // console.log('drawStates() style: ', style);
  this.overlay = L.geoJson(stateFeatures, {
    onEachFeature: this.onEachState.bind(this),
    style: feature => {
      return {
        fillColor: this.getColor(feature.properties.total),
        weight: 2,
        opacity: 1,
        color: 'white',
        // dashArray: '3',
        fillOpacity: 0.7
      };
    }
  }).addTo(this.map);
};

// /**
//  * Draw district overlays
//  * @param {array} districts - array of unique district identifiers
//  */
// DataMap.prototype.drawDistricts = function(districts) {
//   if (this.featureType === FEATURE_TYPES.DISTRICTS && !districts) {
//     return;
//   }
//   this.featureType = FEATURE_TYPES.DISTRICTS;
//   let features = districts
//     ? this.filterDistricts(districts)
//     : utils.districtFeatures;
//   if (this.overlay) {
//     this.map.removeLayer(this.overlay);
//   }
//   this.districts = districts;
//   this.overlay = L.geoJson(features, {
//     onEachFeature: this.onEachDistrict.bind(this)
//   }).addTo(this.map);
//   this.updateBounds(districts);
//   this.drawBackgroundDistricts(districts);
// };

/**
 * Update the boundaries of the map
 * @param {array} districts - array of unique district identifiers
 */
// DataMap.prototype.updateBounds = function(districts) {
//   let self = this;
//   let rule =
//     districts &&
//     // _.find(boundsOverrides, function(rule, district) {
//     //   return districts.indexOf(parseInt(district)) !== -1;
//     // }
//     boundsOverrides.find((rule, district) => {
//       return districts.indexOf(parseInt(district)) !== -1;
//     });
//   this._viewReset = !!(rule || districts);
//   if (rule) {
//     this.map.setView(rule.coords, rule.zoom);
//   } else if (districts) {
//     self.map.flyToBounds(self.overlay.getBounds(), { duration: 0.25 });
//   }
// };

// DataMap.prototype.drawBackgroundDistricts = function(districts) {
//   if (!districts) {
//     return;
//   }
//   // let states = _.chain(districts)
//   let states = districts
//     .map(function(district) {
//       return Math.floor(district / 100);
//     })
//     .unique()
//     .value();
//   let stateDistricts = _.filter(utils.districtFeatures.features, function(
//     feature
//   ) {
//     return (
//       states.indexOf(Math.floor(feature.id / 100)) !== -1 &&
//       districts.indexOf(feature.id) === -1
//     );
//   });
//   L.geoJson(stateDistricts, {
//     onEachFeature: _.partial(this.onEachDistrict.bind(this), _, _, {
//       color: '#bbbbbb'
//     })
//   }).addTo(this.overlay);
// };

DataMap.prototype.drawLegend = function() {
  let valueSpread = this.maxValue - this.minValue;
  let legendItemValue = valueSpread * 0.2;
  // TODO - Let's figure out how our legend should look
  if (legendItemValue > 1000000)
    legendItemValue = Math.round(legendItemValue / 1000000);
  else if (legendItemValue > 1000)
    legendItemValue = Math.round(legendItemValue / 1000);
  else if (legendItemValue > 100)
    legendItemValue = Math.round(legendItemValue / 100);
  else if (legendItemValue > 10)
    legendItemValue = Math.round(legendItemValue / 10);

  if (!this.legend) {
    this.legend = L.control({ position: 'bottomright' });
    this.legend.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [];

      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background: #ff0000' +
          // getColor(grades[i] + 1) +
          '"></i> ' +
          grades[i] +
          (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
    };
    this.legend.addTo(this.map);
  }
};

// DataMap.prototype.filterDistricts = function(districts) {
//   return {
//     type: utils.districtFeatures.type,
//     features: utils.findDistricts(districts)
//   };
// };

/**
 *
 * @param {json} newData
 */
DataMap.prototype.handleDataRefresh = function(newData) {
  console.log('handleDataRefresh(), newData: ', newData);
  this.data = newData;

  if (!this.svg) this.init();
  else this.applyNewData();
  // console.log('DataMap.prototype.handleDataRefresh(newData): ', newData);
  // this.dataLayer = L.geoJSON().addTo(this.map);
  // this.overlay.addData(newData);
  // Let's loop through every state/territory map element
  // this.maxValue = 0;
  // this.minValue = 1000000000;
  // for (let i = 0; i < stateFeatures.length; i++) {
  //   // console.log('stateFeatures[i]: ', stateFeatures[i]);
  //   let thisStateAbbrev = stateFeatures[i].properties.state;
  //   let theDataElement = newData.find(element => {
  //     return element.state == thisStateAbbrev;
  //   });

  //   if (theDataElement) {
  //     stateFeatures[i].properties.total = theDataElement.total;
  //     this.maxValue = Math.max(this.maxValue, theDataElement.total);
  //     this.minValue = Math.min(this.minValue, theDataElement.total);
  //   } else stateFeatures[i].properties.total = '';

  //   // console.log('  stateFeatures[i]: ', stateFeatures[i]);
  // }
  // this.drawLegend();
  // this.drawStates();
};

/**
 *
 * @param {Event} e
 */
DataMap.prototype.handleStateClick = function(e) {
  console.log('handleStateClick(e): ', e);

  console.log('  this:', this);
  // if (this.opts.handleSelect) {
  //   let state = utils.decodeState(e.target.feature.id);
  //   this.opts.handleSelect(state);
  // }
  this.popup
    .setLatLng(e.latlng)
    .setContent('Clicked ' + e.target.feature.properties.state)
    .openOn(this.map);
};

/**
 *
 * @param {Event} e
 */
// DataMap.prototype.handleTileLoad = function(e) {
//   console.log('DataMap.prototype.handleTileLoad()');
//   e.tile.setAttribute('alt', 'Map tile image');
// };

/**
 * Called from inside @see drawStates and its geoJson()
 * @param {} feature
 * @param {} layer
 */
DataMap.prototype.onEachState = function(feature, layer) {
  // console.log('onEachState(feature, layer): ', feature, layer);
  // console.log('this.colorPalette: ', this.colorPalette);
  // let color = this.colorPalette[feature.id % this.colorPalette.length];
  // layer.setStyle({ color });
  layer.on('click', this.handleStateClick.bind(this));
};

// DataMap.prototype.onEachDistrict = function(feature, layer, opts) {
//   opts = opts || {};
//   let decoded = utils.decodeDistrict(feature.id);
//   let palette = this.districtPalette[decoded.state];
//   let color = palette[decoded.district % palette.length];
//   layer.setStyle({ color: opts.color || color });
//   layer.on('click', this.handleDistrictClick.bind(this));
// };

// DataMap.prototype.handleDistrictClick = function(e) {
//   this.map.removeLayer(this.overlay);
//   this.drawDistricts([e.target.feature.id]);
//   if (this.opts.handleSelect) {
//     let district = utils.decodeDistrict(e.target.feature.id);
//     this.opts.handleSelect(district.state, district.district);
//   }
// };

/**
 *
 * @param {Event} e
 */
DataMap.prototype.handleReset = function(e) {
  console.log('DataMap.prototype.handleReset();');
  if (this._viewReset) {
    this._viewReset = false;
    return;
  }
  // let zoom = e.target.getZoom();
  // if (zoom <= STATE_ZOOM_THRESHOLD) {
  this.drawStates();
  // } else if (!this.districts) {
  //   this.drawDistricts();
  // }
};

/**
 *
 * @param {*} value
 */
DataMap.prototype.getColor = function(value) {
  // console.log('getColor(' + value + ')');
  return value > 3000000
    ? this.opts.colorScale[4]
    : value > 2000000
    ? this.opts.colorScale[3]
    : value > 1000000
    ? this.opts.colorScale[2]
    : value > 500000
    ? this.opts.colorScale[1]
    : this.opts.colorScale[0];
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

/**
 *
 * @param {*} svg
 * @param {*} scale
 * @param {*} quantize
 * @param {*} quantiles
 */
function stateLegend(svg, scale, quantize, quantiles) {
  // Add legend swatches
  let legendWidth = 40;
  let legendBar = 35;
  let ticks = quantize.ticks(quantiles);
  let legend = svg
    .selectAll('g.legend')
    .data(ticks)
    .enter()
    .append('g')
    .attr('class', 'legend');
  legend
    .append('rect')
    .attr('x', function(d, i) {
      return i * legendWidth + (legendWidth - legendBar) / 2;
    })
    .attr('y', 0)
    .attr('width', legendBar)
    .attr('height', 20)
    .style('fill', function(d) {
      return scale(d);
    });

  // Add legend text
  let compactRule = chooseRule(ticks[Math.ceil(ticks.length / 2)]);
  legend
    .append('text')
    .attr('x', function(d, i) {
      return (i + 0.5) * legendWidth;
    })
    .attr('y', 30)
    .attr('width', legendWidth)
    .attr('height', 20)
    .attr('font-size', '10px')
    .attr('text-anchor', 'middle')
    .text(function(d) {
      return '$' + compactNumber(d, compactRule).toString();
    });
}

/**
 *
 * @param {*} svg
 * @param {*} path
 * @param {*} results
 */
function stateTooltips(svg, path, instance) {
  let tooltip = d3
    .select('body')
    .append('div')
    .attr('id', 'map-tooltip')
    .attr('class', 'tooltip tooltip--above tooltip--mouse')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('display', 'none');
  svg
    .selectAll('path')
    .on('mouseover', function(d) {
      this.parentNode.appendChild(this);
      let html = tooltipTemplate({
        name: fips.fipsByCode[d.id].STATE_NAME,
        total: new Intl.NumberFormat('en-US', {
          currency: 'USD',
          style: 'currency'
        }).format(instance.getStateValue(d.id))
      });
      tooltip.style('display', 'block').html(html);
      moveTooltip(tooltip);
    })
    .on('mouseout', function() {
      tooltip.style('display', 'none');
    })
    .on('mousemove', function() {
      moveTooltip(tooltip);
    });
}

/**
 *
 * @param {*} tooltip
 */
function moveTooltip(tooltip) {
  let x = d3.event.pageX - tooltip[0][0].offsetWidth / 2;
  let y = d3.event.pageY - tooltip[0][0].offsetHeight;

  let bottomPointerHeight = '.8rem';

  let contentHeight = $('#map-tooltip .tooltip__title').innerHeight();
  contentHeight += $('#map-tooltip .tooltip__value').innerHeight();
  contentHeight += 30; // (padding)

  tooltip
    .style('left', x + 'px')
    .style('top', 'calc(' + y + 'px - ' + bottomPointerHeight + ')')
    .style('height', contentHeight + 'px');
}

/**
 *
 * @param {*} value
 */ function chooseRule(value) {
  return compactRules.find(rule => {
    return value >= Math.pow(10, rule[1]);
  });
}

/**
 *
 * @param {*} obj
 * @param {*} obj.name
 * @param {*} obj.total
 */ function tooltipTemplate(obj) {
  return `<div class="tooltip__title">${obj.name}</div>
    <div class="tooltip__value">${obj.total}</div>`;
}

module.exports = {
  DataMap
};
