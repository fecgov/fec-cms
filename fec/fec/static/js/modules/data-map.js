/* eslint-disable no-undef */

'use strict';

/**
 * @fileoverview Interactive map based on fec/fec/static/js/modules/maps.js. Displays color-coded states based on the dataset provided
 * @copyright 2019 Federal Election Commission
 * @license CC0-1.0
 * @owner  fec.gov
 * @version 1.0
 */

/**
 * @example creation:
 * this.map = new DataMap(htmlDomElement, {
 *      colorScale: ['#e2ffff', '#278887'],
 *      colorZero: '#ffffff',
 *    data: '',
 *    width: '300',
 *    height: '300',
 *    addLegend: true,
 *    addTooltips: true
 *  });
 *
 * @example data update:
 * this.map.handleDataRefresh(theData);
 */

const d3 = require('d3');
const chroma = require('chroma-js');
const topojson = require('topojson');
const statesJSON = require('../data/us-states-10m.json');
const stateFeatures = topojson.feature(statesJSON, statesJSON.objects.states)
  .features;

const fips = require('./fips');

const compactRules = [['B', 9], ['M', 6], ['K', 3], ['', 0]];

let defaultOpts = {
  colorScale: ['#e2ffff', '#278887'],
  colorZero: '#ffffff',
  circleSizeScale: [5, 20], // Smallest and largest circle sizes
  quantiles: 4,
  viewBox: '30 50 353 225', // min-x, min-y, width, height
  eventAppID: ''
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
 * @param {Array} opts.circleSizeScale -
 * @param {Array} opts.viewBox -
 * @param {Array} opts.eventAppID -
 */
function DataMap(elm, opts) {
  // console.log('new DataMap(): ', elm, opts);
  // Data, vars
  this.data;
  this.mapData; // saves results from init() and applyNewData(), formatted like {1: 123456789, 2: 6548, 4: 91835247} / {stateID: stateValue, stateID: stateValue}
  this.opts = Object.assign({}, defaultOpts, opts);
  this.eventAppID = this.opts.eventAppID;
  this.focusedState = 'US';

  // Elements
  this.elm = elm;
  this.legendSVG;
  this.svg;

  // d3 selections
  this.projection;
  this.path;
  this.pathDataEnter;
  this.states_fills;
  this.states_circles;
  this.states_fillsAndCircles;
}

/**
 * Initialize the map
 * Called from {@see handleDataRefresh() } when needed
 * Very similar to {@see applyNewData() }—enough that changes to one should be made to the other.
 * TODO: make init() and applyNewData() share more functionality
 */
DataMap.prototype.init = function() {
  let instance = this;

  console.log('statesJSON: ', statesJSON);
  console.log('stateFeatures: ', stateFeatures);

  // Initialize the D3 map
  // viewBox is necessary for responsive scaling
  // preserveAspectRatio tells the map how to scale
  this.svg = d3.select(this.elm).append('svg');
  this.svg
    .attr('viewBox', '30 50 353 225')
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Create the base-level state/country shapes
  this.projection = d3.geo.albersUsa();

  this.projection
    .scale(450) // lower numbers make the map smaller
    .translate([220, 150]); // lower numbers move the map up and to the left

  // Create the path based on those base-level shapes
  this.path = d3.geo.path().projection(this.projection);

  /** Go through our data results and pair/merge them with the fips state codes {@see this.mapData} */
  let results = instance.data['results'].reduce((acc, val) => {
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
  let quantiles = instance.opts.quantiles;
  // For each item in results, look at its total but only work with the value if it's truthy
  // Double bangs (!!value) :
  // `!!0` = false, `!!null` = false
  // `!!1` = true, `!!468546` = true
  let totals = instance.data['results']
    .map(value => value['total'])
    .filter(value => {
      return !!value;
    });
  // Of all of the values across all DataMap instances, these are the smallest and largest values:
  let minValue = minValue || Math.min(...totals);
  let maxValue = maxValue || Math.max(...totals);
  maxValue = trimmedMaxValue(minValue, maxValue);

  // Decide the legend color scale for our values
  let legendScale_colors = chroma
    .scale(instance.opts.colorScale)
    .domain([minValue, maxValue]);
  let legendQuantize_colors = d3.scale.linear().domain([minValue, maxValue]);

  // Create the states SVG, color them, initialize mouseover interactivity
  // (`selectAll()` will select elements if they exist, or will create them if they don't.)
  this.pathDataEnter = this.svg
    .append('g')
    .selectAll('path')
    .data(stateFeatures)
    .enter();

  let temp = this.pathDataEnter
    .append('path')
    .attr('fill', function(d) {
      d.statePath = this; // Linking this state/path/fill to this element in the data
      d.value = instance.getStateValue(d.id);
      return calculateStateFill(
        d.value,
        legendScale_colors,
        legendQuantize_colors,
        instance.opts.colorZero,
        instance.opts.addLegend,
        quantiles
      );
    })
    .attr('data-state', d => {
      return fips.fipsByCode[d.id].STATE_NAME;
    })
    .attr('data-stateID', d => {
      return fips.fipsByCode[d.id].STUSAB;
    })
    .attr('class', d => {
      return this.chooseStateClasses(d, 'shape');
    })
    .attr('d', this.path);
  this.states_fills = temp.selectAll('path');

  temp = this.pathDataEnter
    .append('circle')
    .attr('cx', function(d) {
      let stateBounds = d3
        .select(d.statePath)
        .node()
        .getBBox();

      d.cx = stateBounds.x + stateBounds.width / 2;
      d.cy = stateBounds.y + stateBounds.height / 2;

      return d.cx;
    })
    .attr('cy', function(d) {
      return d.cy;
    })
    .attr('r', function(d) {
      // console.log('calculating radius: ', d);
      d.value = instance.getStateValue(d.id); // TODO - COPY THIS TO applyNewData()?
      return calculateCircleSize(
        d.value, // TODO - COPY THIS TO applyNewData()?
        [minValue, maxValue],
        instance.opts.circleSizeScale,
        quantiles,
        instance.opts.addLegend
      );
    })
    .attr('data-state', function(d) {
      return fips.fipsByCode[d.id].STATE_NAME;
    })
    .attr('data-stateID', function(d) {
      return fips.fipsByCode[d.id].STUSAB;
    })
    .attr('class', d => {
      return this.chooseStateClasses(d, 'circle');
    })
    .attr('d', this.path);
  // .attr('d', this.path);
  this.states_circles = temp.selectAll('circle');
  // console.log('states_circles: ', this.states_circles);

  this.svg.selectAll('circle').sort((a, b) => {
    console.log('sort():', a, b);
    console.log('  a.value, b.value: ', a.value, b.value);
    d3.ascending(a.value, b.value);
  });

  this.states_fillsAndCircles = this.svg.selectAll('path, circle')[0];

  console.log('this.states_fills: ', this.states_fills);
  console.log('this.states_circles: ', this.states_circles);
  console.log('this.states_fillsAndCircles: ', this.states_fillsAndCircles);

  // If we're supposed to add a legend, let's do it
  if (this.opts.addLegend || typeof this.opts.addLegend === 'undefined') {
    this.legendSVG = d3.select('.legend-container svg');
    drawStateLegend(
      this.legendSVG,
      legendScale_colors,
      legendQuantize_colors,
      quantiles
    );
  }

  // If we're supposed to add tooltips, let's do that, too
  if (this.opts.addTooltips) {
    buildStateTooltips(this.svg, this.path, this);
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
  console.log('handleDataRefresh(): ', newData);
  this.data = newData;
  this.data.results.sort((a, b) => a.value - b.value);

  if (!this.svg) this.init();
  else this.applyNewData();
};

/**
 * Called from outside this element, it handles zooming out to show the rest of the US instead of just one state
 */
DataMap.prototype.handleZoomReset = function() {
  // TODO: zoom out to the full US
  this.zoomToState('US');
  // Show bubbles if they need to be shown
};

/**
 * Updates the map with new data
 * Called from {@see handleDataRefresh() } as needed
 * Very similar to {@see init() }—enough that changes to one should be made to the other.
 * TODO: make init() and applyNewData() share more functionality
 */
DataMap.prototype.applyNewData = function() {
  console.log('applyNewData();');

  let instance = this;

  let results = instance.data['results'].reduce((acc, val) => {
    let row = fips.fipsByState[val.state] || {};
    let code = row.STATE ? parseInt(row.STATE) : null;
    acc[code] = val.total;
    return acc;
  }, {});

  this.mapData = results;

  let quantiles = instance.opts.quantiles;
  let totals = instance.data['results']
    .map(value => value['total'])
    .filter(value => {
      return !!value;
    });

  let minValue = minValue || Math.min(...totals);
  let maxValue = maxValue || Math.max(...totals);
  maxValue = trimmedMaxValue(minValue, maxValue);

  let legendScale_colors = chroma
    .scale(instance.opts.colorScale)
    .domain([minValue, maxValue]);

  let legendQuantize_colors = d3.scale.linear().domain([minValue, maxValue]);

  // This bit is the big difference from init() }
  // because we're transitioning states' colors,
  // states we know already exist, have IDs, and may have mouseenter listeners, etc.
  this.svg
    .selectAll('path')
    .transition()
    .delay(function(d, i) {
      //
      d.value = instance.getStateValue(d.id);

      if (!d.value) return 0;
      else return 20 * i;
    })
    .attr('fill', function(d) {
      return calculateStateFill(
        d.value,
        legendScale_colors,
        legendQuantize_colors,
        instance.opts.colorZero,
        instance.opts.addLegend,
        quantiles
      );
    });

  this.svg
    .selectAll('circle')
    .transition()
    .delay(function(d, i) {
      d.value = instance.getStateValue(d.id);
      if (!d.value) return 0;
      else return 20 * i;
    })
    .attr('r', function(d) {
      // console.log('calculating radius: ', d);
      return calculateCircleSize(
        d.value,
        [minValue, maxValue],
        instance.opts.circleSizeScale,
        quantiles,
        instance.opts.addLegend
      );
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
    drawStateLegend(
      this.legendSVG,
      legendScale_colors,
      legendQuantize_colors,
      quantiles
    );
  }
};

/**
 *
 * @param {Event}
 */
DataMap.prototype.zoomToState = function(stateID) {
  // console.log('zoomToState(): ', stateID);
  this.focusedState = stateID;

  this.svg.selectAll('path').attr('class', d => {
    return this.chooseStateClasses(d, 'shape');
  });
  this.svg.selectAll('circle').attr('class', d => {
    return this.chooseStateClasses(d, 'circle');
  });
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
  let ticks = quantize.ticks(quantiles);
  // .ticks() returns an array of the values at the various breaking points
  // The number of ticks (quantiles) is just a guide.
  // If the data range is more evenly split into one or two above this number, it will be.
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
    .text(function(d, i) {
      // d is the data; i is the increment position of the loop
      let toReturn = '';

      if (i < ticks.length - 1) {
        // If we're looking at any block other than the last,
        toReturn += '<';
        toReturn += compactNumber(d, compactRule).toString();
      } else {
        // Otherwise, for the last element, use the penultimate value plus a plus
        toReturn += compactNumber(ticks[i - 1], compactRule).toString();
        toReturn += '+';
      }

      return toReturn;
    });
}

/**
 * Used to determine the fill color based on the value, scale, and quantiles of the legend
 * @param {Number} value Value to be used to determine the color.
 * @param {Function} legendScale_colors Determines the color scale for the current range of values.
 * @param {d3.scale} legendQuantize_colors Represents the range of data.
 * @param {Number} quantiles How many bars to include in the legend.
 * @param {*} colorZero Color code to use if the value is 0.
 * @param {Boolean} hasLegend Default: false. If a legend is being used, will "round" colors to those in the legend. If no legend is being used, colors will not be rounded.
 * @returns {String} 'fill' value based on the parameters provided.
 */
function calculateStateFill(
  value,
  legendScale_colors,
  legendQuantize_colors,
  colorZero,
  hasLegend = false,
  quantiles
) {
  let colorToReturn = colorZero;
  let legendValueTicks = legendQuantize_colors.ticks(quantiles);

  if (!value || value == 0) {
    // If the state value is zero, use the zero color (default) and be done
    colorToReturn = colorZero;
  } else if (!hasLegend) {
    // If we aren't using the legend we don't have to stick to its color stops
    colorToReturn = legendScale_colors(value);
  } else {
    // Otherwise, let's figure out which legend color we should use
    // Let's change the default to the highest color because we're checking if each value is less than each legend block
    colorToReturn = legendScale_colors(
      legendValueTicks[legendValueTicks.length - 1]
    );
    // For each block in the legend
    for (let i = 0; i < legendValueTicks.length; i++) {
      // If this block's value is greater than this state's value, that's the color we want
      if (value < legendValueTicks[i]) {
        // so we'll grab the color for this block's value instead of the color for the state's value
        colorToReturn = legendScale_colors(legendValueTicks[i]);
        break;
      }
      // Otherwise, check the next one
    }
  }

  return colorToReturn;
}

/**
 *
 * @param {Number} value
 * @param {Array} valueRange
 * @param {int} quantiles
 * @param {Array} circleSizeRange
 * @param {Boolean} hasLegend
 */
function calculateCircleSize(
  value,
  valueRange,
  sizeRange,
  quantiles,
  hasLegend = false
) {
  let sizeToReturn = 0;
  // let legendValueTicks = legendQuantize_sizes.ticks(quantiles);

  if (!value || value == 0) {
    // If the state value is zero, use the zero color (default) and be done
    sizeToReturn = 0;
  } else if (!hasLegend) {
    // If we aren't using the legend we don't have to stick to its color stops
    // sizeToReturn = legendScale_sizes(value);
    // TODO - this
  } else {
    // How much is each step in the value range?
    let valueStepValue = (valueRange[1] - valueRange[0]) / quantiles;
    // How much is each step in the size range?
    let sizeStepValue = (sizeRange[1] - sizeRange[0]) / quantiles;

    // Let's break the value and size ranges into steps
    let valueSteps = [];
    let sizeSteps = [];
    // Until we've made enough steps (i < quantiles),
    // Assign the next step value to the lowest value in the range times the number of the loop
    for (let i = 0; i < quantiles; i++) {
      valueSteps[i] = valueRange[0] + valueStepValue * i;
      sizeSteps[i] = sizeRange[0] + sizeStepValue * i;
    }

    // Let's change the default to the largest size because we're checking if each value is less than each legend block
    sizeToReturn = sizeRange[1];

    // For each block in the legend
    for (let i = 0; i < valueSteps.length; i++) {
      // If this block's value is greater than this state's value, that's the size we want
      if (value < valueSteps[i]) {
        // so we'll grab the size for this block's value instead of the size for the state's value
        // (if this state falls into the second value, we'll use the second size)
        sizeToReturn = sizeSteps[i];
        break;
      }
      // Otherwise, check the next one
    }
  }

  return `${sizeToReturn}px`;
}

/**
 * Used to adjust scales so the higher values don't skew the range / blow the curve,
 * to show more variation in our map colors.
 * @param {Number} minValue The smaller number / the starting point of the return value.
 * @param {Number} maxValue The largest number on the scale.
 * @returns {Number} A new maxValue about half-way between minValue and maxValue
 * @example trimmedMaxValue(10, 100); // 55
 */
function trimmedMaxValue(minValue, maxValue) {
  return minValue + (maxValue - minValue) * 0.5;
}

/**
 * Creates the tooltip element and adds mouse listeners to states
 * TODO: need to remove the click for non-clickable maps (e.g. WCCF)
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
  svg
    .selectAll('path, circle')
    .on('mouseenter', function(d) {
      let thisValue = instance.getStateValue(d.id);
      if (thisValue && thisValue !== 0) {
        // this.parentNode.appendChild(this);
        let html = tooltipTemplate({
          name: fips.fipsByCode[d.id].STATE_NAME,
          total: '$' + Math.round(instance.getStateValue(d.id)).toLocaleString()
        });
        tooltip.style('display', 'block').html(html);
        moveTooltip(tooltip);
      }
    })
    .on('mousemove', function(d) {
      let thisValue = instance.getStateValue(d.id);
      if (thisValue && thisValue !== 0) {
        let html = tooltipTemplate({
          name: fips.fipsByCode[d.id].STATE_NAME,
          total: '$' + Math.round(instance.getStateValue(d.id)).toLocaleString()
        });
        moveTooltip(tooltip);
        tooltip.style('display', 'block').html(html);
      } else {
        tooltip.style('display', 'none');
      }
    })
    .on('click', function(d) {
      this.dispatchEvent(
        new CustomEvent('STATE_CLICKED', {
          detail: {
            abbr: fips.fipsByCode[d.id].STUSAB,
            name: fips.fipsByCode[d.id].STATE_NAME
          },
          bubbles: true
        })
      );
    });

  // Add the mouseleave listeners to the dom elements rather than relying on d3
  // (d3 kept converting mouseleave to mouseout for IE11 and they're different for IE)
  let theLargeMap = document.querySelector('.election-map svg');
  let theStatesPaths = theLargeMap.querySelectorAll('path');

  theLargeMap.addEventListener('mouseleave', () => {
    tooltip.style('display', 'none');
  });
  for (let i = 0; i < theStatesPaths.length; i++) {
    theStatesPaths[i].addEventListener('mouseleave', () => {
      tooltip.style('display', 'none');
    });
  }

  // IE doesn't always recognize mouseout or mouseleave
  // When the toolip is visible and the window changes size,
  // the tooltip can jump to very different parts of the screen.
  // So let's hide it on resize, just in case.
  window.addEventListener('resize', function() {
    tooltip.style('display', 'none');
  });
}

/**
 *
 */
DataMap.prototype.chooseStateClasses = function(d, shapeType) {
  console.log('chooseStateClasses(): ', d, shapeType);
  let toReturn = shapeType;

  console.log('  this.focusedState: ', this.focusedState);

  if (
    this.focusedState == fips.fipsByCode[d.id].STUSAB &&
    shapeType != 'circle'
  )
    toReturn += ' zoomed';
  else if (this.focusedState != 'US') toReturn += ' blur';

  return toReturn;
};

/**
 * Controls the tooltip position and visibility, called on each state's mouseenter and mousemove
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

/* eslint-enable no-undef */
