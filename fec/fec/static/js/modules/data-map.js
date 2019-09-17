'use strict';

/**
 * @fileoverview Interactive map based on fec/fec/static/js/modules/maps.js. Displays color-coded states based on the dataset provided
 * @copyright 2019 Federal Election Commission
 * @license CC0-1.0
 * @author Robert
 * @owner  fec.gov
 * @version 1.0
 */

/**
 * @example creation:
 * this.map = new DataMap(htmlDomElement, {
 *      colorScale: ['#f0f9e8', '#a6deb4', '#7bccc4', '#2a9291', '#216a7a'],
 *      colorZero: '#ffffff',
 *    data: '',
 *    width: '300',
 *    height: '300',
 *    addLegend: true,
 *    addTooltips: true
 *  });
 *
 * @example   data update:
 * this.map.handleDataRefresh(theData);
 */

const d3 = require('d3');
const chroma = require('chroma-js');
const topojson = require('topojson');
const colorbrewer = require('colorbrewer');
const states = require('../data/us-states-10m.json');
const stateFeatures = topojson.feature(states, states.objects.states).features;

const fips = require('./fips');

const compactRules = [['B', 9], ['M', 6], ['k', 3], ['', 0]];

let defaultOpts = {
  colorScale: colorbrewer.Set1,
  quantiles: 4
};

/**
 * @constructor
 * @param {string} elm - selector for the div to put the map in
 * @param {object} opts - configuration options
 * @param {Boolean} opts.data - placeholder for this object to save its own data
 * @param {Boolean} opts.addLegend - whether to add a legend
 * @param {Boolean} opts.addTooltips - whether to add the tooltip functionality
 * @param {Array} opts.colorScale - list of hex color codes to use
 * @param {String} opts.colorZero - hex color code to use when no value is present
 */
function DataMap(elm, opts) {
  // Data, vars
  this.data;
  this.mapData; // saves results from init() and applyNewData(), formatted like {1: 123456789, 2: 6548, 4: 91835247} / {stateID: stateValue, stateID: stateValue}
  this.opts = Object.assign({}, defaultOpts, opts);

  // Elements
  this.elm = elm;
  this.legendSVG;
  this.svg;
}

/**
 * Initialize the map
 * Called from {@see handleDataRefresh() } when needed
 * Very similar to {@see applyNewData() }—enough that changes to one should be made to the other.
 * TODO - make init() and applyNewData() share more functionality
 */
DataMap.prototype.init = function() {
  let instance = this;

  // Initialize the D3 map
  // viewBox is necessary for responsive scaling
  // preserveAspectRatio tells the map how to scale
  this.svg = d3
    .select(this.elm)
    .append('svg')
    .attr('viewBox', '30 50 353 225')
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Create the base-level state/country shapes
  let projection = d3.geo
    .albersUsa()
    .scale(450)
    .translate([220, 150]);

  // Create the path based on those base-level shapes
  let path = d3.geo.path().projection(projection);

  /** Go through our data results and pair/merge them with the fips state codes {@see this.mapData} */
  let results = this.data['results'].reduce((acc, val) => {
    let row = fips.fipsByState[val.state] || {};
    let code = row.STATE ? parseInt(row.STATE) : null;
    acc[code] = val.total;
    return acc;
  }, {});

  // Save the data for later
  this.mapData = results;

  // Work through how to group these results for the legend
  // For our current usage, we'll only be dealing with one map,
  // but the functionality will work with multiple maps using the same legend
  let quantiles = this.opts.quantiles;
  // For each item in results, look at its total but only work with the value if it's truthy
  // Double bangs (!!value) :
  // `!!0` = false, `!!null` = false
  // `!!1` = true, `!!468546` = true
  let totals = this.data['results']
    .map(value => value['total'])
    .filter(value => {
      return !!value;
    });
  // Of all of the values across all DataMap instances, these are the smallest and largest values:
  let minValue = minValue || Math.min(...totals);
  let maxValue = maxValue || Math.max(...totals);

  // Decide the legend color scale for our values
  let legendScale = chroma
    .scale(this.opts.colorScale)
    .domain([minValue, maxValue]);
  let legendQuantize = d3.scale.linear().domain([minValue, maxValue]);

  // Create the states SVG, color them, initialize mouseover interactivity
  // (`selectAll()` will select elements if they exist, or will create them if they don't.)
  this.svg
    .append('g')
    .selectAll('path')
    .data(stateFeatures)
    .enter()
    .append('path')
    .attr('fill', function(d) {
      return instance.getStateValue(d.id)
        ? legendScale(instance.getStateValue(d.id))
        : instance.opts.colorZero;
    })
    .attr('data-state', function(d) {
      return fips.fipsByCode[d.id].STATE_NAME;
    })
    .attr('class', 'shape')
    .attr('d', path);

  // If we're supposed to add a legend, let's do it
  if (this.opts.addLegend || typeof this.opts.addLegend === 'undefined') {
    this.legendSVG = d3.select('.legend-container svg');
    drawStateLegend(this.legendSVG, legendScale, legendQuantize, quantiles);
  }

  // If we're supposed to add tooltips, let's do that, too
  if (this.opts.addTooltips) {
    buildStateTooltips(this.svg, path, this);
  }
};

/**
 * Takes an ID and finds that ID's dollar value in {@see this.mapData }
 * @param {String, Number} pathID
 * @returns {Number} the value associated with the ID passed to it
 * @returns {Object} else returns the full {@see this.mapData } when no pathID is included
 */
DataMap.prototype.getStateValue = function(pathID) {
  if (pathID) return this.mapData[pathID];
  else return this.mapData;
};

/**
 * Called from outside this element, it handles data updates
 * Saves the new data, then calls either {@see init() } or {@see applyNewData() } as needed
 * @param {json} newData
 */
DataMap.prototype.handleDataRefresh = function(newData) {
  this.data = newData;

  if (!this.svg) this.init();
  else this.applyNewData();
};

/**
 * Updates the map with new data
 * Called from {@see handleDataRefresh() } as needed
 * Very similar to {@see init() }—enough that changes to one should be made to the other.
 * TODO - make init() and applyNewData() share more functionality
 */
DataMap.prototype.applyNewData = function() {
  let instance = this;

  let results = this.data['results'].reduce((acc, val) => {
    let row = fips.fipsByState[val.state] || {};
    let code = row.STATE ? parseInt(row.STATE) : null;
    acc[code] = val.total;
    return acc;
  }, {});

  this.mapData = results;

  let quantiles = this.opts.quantiles;
  let totals = this.data['results']
    .map(value => value['total'])
    .filter(value => {
      return !!value;
    });

  let minValue = minValue || Math.min(...totals);
  let maxValue = maxValue || Math.max(...totals);

  let legendScale = chroma
    .scale(this.opts.colorScale)
    .domain([minValue, maxValue]);

  let legendQuantize = d3.scale.linear().domain([minValue, maxValue]);

  // This bit is the big difference from init() }
  // because we're transitioning states' colors,
  // states we know already exist, have IDs, and may have mouseover listeners, etc.
  this.svg
    .selectAll('path')
    .transition()
    .delay(function(d, i) {
      //
      if (!instance.getStateValue(d.id)) return 0;
      else return 20 * i;
    })
    .attr('fill', function(d) {
      return instance.getStateValue(d.id)
        ? legendScale(instance.getStateValue(d.id))
        : instance.opts.colorZero;
    });

  // The rest of applyNewData is back to the same code from init()
  if (this.legendSVG) {
    let theCurrentLegend = document.querySelector(
      '.map-wrapper .legend-container svg'
    );

    while (theCurrentLegend.hasChildNodes()) {
      theCurrentLegend.removeChild(theCurrentLegend.lastChild);
    }

    this.legendSVG = d3.select('.legend-container svg');
    drawStateLegend(this.legendSVG, legendScale, legendQuantize, quantiles);
  }
};

/**
 * Creates (and updates) the map's legend
 * @param {d3.svg} svg - the element created by d3.select()
 * @param {Function} scale
 * @param {*} quantize
 * @param {Number} quantiles
 */
function drawStateLegend(svg, scale, quantize, quantiles) {
  let legendWidth = 40;
  let legendBar = 35;
  let ticks = quantize.ticks(quantiles); // TODO - WHAT DOES .ticks DO / WHAT IS IT?
  // The number of ticks is just a guide.
  // If the data is more evenly split into one or two above this number, it will be.
  // e.g., if our range is $1M-$3M and we ask for four ticks, we'll probably only get three: $1M, $2M, $3M
  // instead of $750K, $1.5M, $2.25M, $3M

  // Create the legend itself
  let legend = svg
    .attr('width', legendWidth * ticks.length)
    .selectAll('g.legend')
    .data(ticks)
    .enter()
    .append('g')
    .attr('class', 'legend');

  // then create a box for each tick, putting each one to the right of the next
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

  // Now add the text under each tile
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
      // function(d,i)
      // TODO - If we want to add the "<" from the comps, we'll need the i
      // let toReturn = '< $' + compactNumber(d, compactRule).toString();
      // if (i >= ticks.length - 1) toReturn += '+';
      let toReturn = compactNumber(d, compactRule).toString();
      return toReturn;
    });
}

/**
 * Creates the tooltip element and adds mouse listeners to states
 * Called from {@see init() } if needed
 * @param {*} svg
 * @param {*} path
 * @param {*} results
 */
function buildStateTooltips(svg, path, instance) {
  // Create and style the tooltip object itself
  let tooltip = d3
    .select('body')
    .append('div')
    .attr('id', 'map-tooltip')
    .attr('class', 'tooltip tooltip--above tooltip--mouse data-map-tooltip')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('display', 'none');

  // Go through our svg/map and assign the mouse listeners to each path
  // TODO - Test on touch devices, too
  svg
    .selectAll('path')
    .on('mouseover', function(d) {
      if (instance.getStateValue(d.id) && instance.getStateValue(d.id) !== 0) {
        this.parentNode.appendChild(this);
        let html = tooltipTemplate({
          name: fips.fipsByCode[d.id].STATE_NAME,
          total: '$' + Math.round(instance.getStateValue(d.id)).toLocaleString()
        });
        tooltip.style('display', 'block').html(html);
        moveTooltip(tooltip);
      }
    })
    .on('mouseout', function() {
      tooltip.style('display', 'none');
    })
    .on('mousemove', function() {
      if (tooltip.style('display') != 'none') {
        moveTooltip(tooltip);
      }
    });
}

/**
 * Controls the tooltip position and visibility, called on each state's mouseover and mousemove
 * @param {HTMLElement} tooltip
 */
function moveTooltip(tooltip) {
  // Where's the pointer / where should the tooltip appear/move
  let x = d3.event.pageX - tooltip[0][0].offsetWidth / 2;
  let y = d3.event.pageY - tooltip[0][0].offsetHeight;
  let bottomPointerHeight = '.8rem';

  // The dom whose height we need to measure
  let theTooltipTitle = document.querySelector('#map-tooltip .tooltip__title');
  let theTooltipValue = document.querySelector('#map-tooltip .tooltip__value');

  // Measure those elements for our total height
  let contentHeight = theTooltipTitle.clientHeight;
  contentHeight += theTooltipValue.clientHeight;
  contentHeight += 30; // (padding)

  // Do it
  tooltip
    .style('left', x + 'px')
    .style('top', 'calc(' + y + 'px - ' + bottomPointerHeight + ')')
    .style('height', contentHeight + 'px');
}

/**
 * Used when building the legend in {@see drawStateLegend() }
 * @param {*} value
 * @param {*} rule
 */
function compactNumber(value, rule) {
  let divisor = Math.pow(10, rule[1]);
  return d3.round(value / divisor, 1).toString() + rule[0];
}

/**
 * Used when building the legend in {@see drawStateLegend() }
 * @param {*} value
 */
function chooseRule(value) {
  return compactRules.find(rule => {
    return value >= Math.pow(10, rule[1]);
  });
  // [['B', 9], ['M', 6], ['k', 3], ['', 0]];
}

/**
 * The html to go into the tooltips
 * @param {Object} obj
 * @param {String} obj.name - The state name to appear in the tooltip
 * @param {String} obj.total - The value for that state
 */
function tooltipTemplate(obj) {
  return `<div class="tooltip__title">${obj.name}</div>
    <div class="tooltip__value">${obj.total}</div>`;
}

module.exports = {
  DataMap
};
