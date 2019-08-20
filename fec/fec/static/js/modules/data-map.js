'use strict';

/**
 * @fileoverview TODO -
 * @author TODO
 * @version 0.1
 */

/**
 * @example
 * TODO -
 */

/* global document */

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
 * @param {object} opts - Configuration options
 * @param {Boolean} opts.data
 * @param {Boolean} opts.min
 * @param {Boolean} opts.max
 * @param {Boolean} opts.addLegend
 * @param {Boolean} opts.addTooltips
 */
function DataMap(elm, opts) {
  // Data, vars
  this.data;
  this.mapData;
  this.opts = Object.assign({}, defaultOpts, opts);

  // Elements
  this.elm = elm;
  this.legendSVG;
  // this.popup;
  this.svg;
}

/**
 * Initialize the map
 */
DataMap.prototype.init = function() {
  let instance = this;

  this.svg = d3
    .select(this.elm)
    .append('svg')
    .attr('viewBox', '30 50 353 300')
    .attr('preserveAspectRatio', 'xMidYMid meet');

  let projection = d3.geo
    .albersUsa()
    .scale(450)
    .translate([220, 150]);

  let path = d3.geo.path().projection(projection);

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
    .attr('d', path)
    .on('mouseover', function(d) {
      if (instance.getStateValue(d.id)) {
        this.parentNode.appendChild(this);
        this.classList.add('state--hover');
      }
    });

  if (this.opts.addLegend || typeof this.opts.addLegend === 'undefined') {
    this.legendSVG = d3.select('.legend-container svg');

    drawStateLegend(this.legendSVG, legendScale, legendQuantize, quantiles);
  }

  if (this.opts.addTooltips) {
    buildStateTooltips(this.svg, path, this);
  }

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
 * @param {json} newData
 */
DataMap.prototype.handleDataRefresh = function(newData) {
  this.data = newData;

  if (!this.svg) this.init();
  else this.applyNewData();
};

/**
 *
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

  this.svg
    .selectAll('path')
    .transition()
    .delay(function(d, i) {
      return 20 * i;
    })
    .attr('fill', function(d) {
      return instance.getStateValue(d.id)
        ? legendScale(instance.getStateValue(d.id))
        : instance.opts.colorZero;
    });

  // If we need to
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
 *
 * @param {d3.svg} svg
 * @param {Function} scale
 * @param {*} quantize
 * @param {Number} quantiles
 */
function drawStateLegend(svg, scale, quantize, quantiles) {
  // Add legend swatches
  let legendWidth = 40;
  let legendBar = 35;
  let ticks = quantize.ticks(quantiles);

  let legend = svg
    .attr('width', legendWidth * ticks.length)
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
    .text(function(d, i) {
      // TODO - If we want to add the "<" from the comps, we'll need the i
      // let toReturn = '< $' + compactNumber(d, compactRule).toString();
      // if (i >= ticks.length - 1) toReturn += '+';
      let toReturn = compactNumber(d, compactRule).toString();
      return toReturn;
    });
}

/**
 *
 * @param {*} svg
 * @param {*} path
 * @param {*} results
 */
function buildStateTooltips(svg, path, instance) {
  let tooltip = d3
    .select('body')
    .append('div')
    .attr('id', 'map-tooltip')
    .attr('class', 'tooltip tooltip--above tooltip--mouse data-map-tooltip')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('display', 'none');
  svg
    .selectAll('path')
    .on('mouseover', function(d) {
      this.parentNode.appendChild(this);
      let html = tooltipTemplate({
        name: fips.fipsByCode[d.id].STATE_NAME,
        total: '$' + instance.getStateValue(d.id).toLocaleString()
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
 * @param {*} rule
 */
function compactNumber(value, rule) {
  let divisor = Math.pow(10, rule[1]);
  return d3.round(value / divisor, 1).toString() + rule[0];
}

/**
 *
 * @param {*} value
 */
function chooseRule(value) {
  return compactRules.find(rule => {
    return value >= Math.pow(10, rule[1]);
  });
}

/**
 *
 * @param {*} obj
 * @param {*} obj.name
 * @param {*} obj.total
 */
function tooltipTemplate(obj) {
  return `<div class="tooltip__title">${obj.name}</div>
    <div class="tooltip__value">${obj.total}</div>`;
}

module.exports = {
  DataMap
};
