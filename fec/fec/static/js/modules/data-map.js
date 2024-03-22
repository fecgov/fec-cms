/**
 * @fileoverview Interactive map based on fec/fec/static/js/modules/maps.js. Displays color-coded states based on the dataset provided
 * @copyright 2024 Federal Election Commission
 * @license CC0-1.0
 * @owner  fec.gov
 * @version 1.1
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

// import * as d3 from 'd3';
import { scale as chroma_scale } from 'chroma-js';
import { descending as d3_sort_descending } from 'd3-array';
import { geoAlbersUsa as d3_albersUsa, geoPath as d3_geoPath, projection as d3_projection, translate as d3_translate } from 'd3-geo';
import { scaleLinear as d3_scaleLinear, scaleOrdinal as d3_scaleOrdinal } from 'd3-scale';
import { scale as d3_scale_chroma } from 'd3-scale-chromatic';
import { pointer as d3_pointer, select, selectAll } from 'd3-selection';
import { transition } from 'd3-transition';
import { feature } from 'topojson-client/dist/topojson-client.js';

import { fipsByCode, fipsByState } from './fips.js';
import { default as statesJSON } from '../data/us-states-10m.json' assert { type: 'json' };

const stateFeatures = feature(statesJSON, statesJSON.objects.states).features;

// const fips = require('./fips');
const maxUSbounds = {
  west: Math.floor(31.268536820638), // (Alaska)
  east: Math.ceil(382.5599341), // (Maine)
  north: Math.floor(49.3991582), // (Washington)
  south: Math.ceil(253.5421288) // (Alaska)
}; // used to set the viewBox for the main SVG
const compactRules = [['B', 9], ['M', 6], ['K', 3], ['', 0]];

const defaultOpts = {
  colorScale: ['#e2ffff', '#278887'],
  colorZero: '#ffffff',
  circleSizeScale: [5, 20], // Smallest and largest circle sizes
  quantiles: 4,
  viewBox: `${maxUSbounds.west} \
    ${maxUSbounds.north} \
    ${maxUSbounds.east - maxUSbounds.west} \
    ${maxUSbounds.south - maxUSbounds.north}`, // min-x, min-y, width, height
  mapStyle: 'gradients',
  clickableFeatures: false,
  eventAppID: ''
};

/**
 * @constructor
 * @param {string} elm - selector for the div to put the map in
 * @param {Object} opts - configuration options
 * @param {boolean} opts.data - placeholder for this object to save its own data
 * @param {boolean} opts.addLegend - whether to add a legend
 * @param {boolean} opts.addTooltips - whether to add the tooltip functionality
 * @param {Array} opts.colorScale - list of hex color codes to use
 * @param {string} opts.colorZero - hex color code to use when no value is present
 * @param {Array} opts.circleSizeScale -
 * @param {string} opts.viewBox -
 * @param {string} opts.mapStyle -
 * @param {string} opts.eventAppID -
 */
export default function DataMap(elm, opts) {
  // Data, vars
  this.data;
  this.mapData; // saves results from init() and applyNewData(), formatted like {1: 123456789, 2: 6548, 4: 91835247} / {stateID: stateValue, stateID: stateValue}
  this.opts = Object.assign({}, defaultOpts, opts);
  this.eventAppID = this.opts.eventAppID;
  this.focusedStateID = 'US';

  // Elements
  this.elm = elm;
  this.legendSVG;
  this.svg;

  // d3 selections
  this.projection;
  this.pathProjection;
  this.pathDataEnter;
}

/**
 * Initialize the map
 * Called from {@see handleDataRefresh() } when needed
 * Very similar to {@see applyNewData() }—enough that changes to one should be made to the other.
 * TODO: make init() and applyNewData() share more functionality
 */
DataMap.prototype.init = function() {
  let instance = this;
  maxUSbounds.width = maxUSbounds.east - maxUSbounds.west;
  maxUSbounds.height = maxUSbounds.south - maxUSbounds.north;
  maxUSbounds.heightRatio = maxUSbounds.height / maxUSbounds.width; // TODO - need this?

  // Initialize the D3 map
  // viewBox is necessary for responsive scaling
  // preserveAspectRatio tells the map how to scale
  instance.svg = select(this.elm).append('svg');
  instance.svg
    .attr('viewBox', this.opts.viewBox)
    .attr('preserveAspectRatio', 'xMaxYMax meet'); // xMidYMid meet');

  // Create the base-level state/country shapes
  this.projection = d3_albersUsa()
    .scale(450) // lower numbers make the map smaller
    .translate([220, 150]); // lower numbers move the map up and to the left

  // Create the path based on those base-level shapes
  this.pathProjection = d3_geoPath().projection(this.projection);

  /** Go through our data results and pair/merge them with the fips state codes {@see this.mapData} */
  const results = instance.data['results'].reduce((acc, val) => {
    const row = fipsByState[val.state] || {};
    const code = row.STATE ? parseInt(row.STATE) : null;
    acc[code] = val.total;
    return acc;
  }, {});

  // Save the data for later
  this.mapData = results;

  // Work through how to group these results for the legend
  // For our current usage, we'll only be dealing with one map,
  // but the functionality will work with multiple maps using the same legend
  const quantiles = instance.opts.quantiles;
  // For each item in results, look at its total but only work with the value if it's truthy
  // Double bangs (!!value) :
  // `!!0` = false, `!!null` = false
  // `!!1` = true, `!!468546` = true
  const totals = instance.data['results']
    .map(value => value['total'])
    .filter(value => {
      return !!value;
    });
  // Of all of the values across all DataMap instances, these are the smallest and largest values:
  const minValue = Math.min(...totals);
  let maxValue = Math.max(...totals);
  maxValue = trimmedMaxValue(minValue, maxValue);

  // Decide the legend color scale for our values
  const legendScale_colors = chroma_scale(instance.opts.colorScale).domain([minValue, maxValue]);
  const legendQuantize_colors = d3_scaleLinear().domain([minValue, maxValue]);

  // Create the states SVG, color them, initialize mouseover interactivity
  // (`selectAll()` will select elements if they exist, or will create them if they don't.)
  this.g = instance.svg.append('g');

  this.pathDataEnter = this.g
    .selectAll('path')
    .data(stateFeatures)
    .enter();

  if (this.opts.mapStyle.indexOf('gradients') !== -1) {
    this.pathDataEnter
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
        return fipsByCode[d.id].STATE_NAME;
      })
      .attr('data-stateID', d => {
        return fipsByCode[d.id].STUSAB;
      })
      .attr('class', d => {
        return this.chooseStateClasses(d, 'shape');
      })
      .attr('d', this.pathProjection);
  }

  // If we're supposed to add a legend, let's do it
  if (this.opts.addLegend || typeof this.opts.addLegend === 'undefined') {
    this.legendSVG = select('.legend-container svg');
    drawStateLegend(
      this.legendSVG,
      legendScale_colors,
      legendQuantize_colors,
      quantiles
    );
  }

  // If we're supposed to add tooltips, let's do that, too
  if (this.opts.addTooltips) {
    buildStateTooltips(instance.svg, this.pathProjection, this);
  }
};

/**
 * Takes an ID and finds that ID's dollar value in {@see this.mapData }
 * @param {string, number} pathID
 * @returns {number} the value associated with the ID passed to it
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
  const instance = this;
  this.data = newData;
  this.data.results.sort((a, b) => a.value - b.value);

  if (!instance.svg) this.init();
  else this.applyNewData();
};

/**
 * Called from outside this element, it handles zooming out to show the rest of the US instead of just one state
 */
DataMap.prototype.handleZoomReset = function() {
  // TODO: zoom out to the full US
  this.zoomToState('US');
};

/**
 * Updates the map with new data
 * Called from {@see handleDataRefresh() } as needed
 * Very similar to {@see init() }—enough that changes to one should be made to the other.
 * TODO: make init() and applyNewData() share more functionality
 */
DataMap.prototype.applyNewData = function() {
  let instance = this;

  const results = instance.data['results'].reduce((acc, val) => {
    const row = fipsByState[val.state] || {};
    const code = row.STATE ? parseInt(row.STATE) : null;
    acc[code] = val.total;
    return acc;
  }, {});

  this.mapData = results;

  const quantiles = instance.opts.quantiles;
  const totals = instance.data['results']
    .map(value => value['total'])
    .filter(value => {
      return !!value;
    });

  let minValue = Math.min(...totals);
  let maxValue = Math.max(...totals);
  maxValue = trimmedMaxValue(minValue, maxValue);

  const legendScale_colors = chroma_scale(instance.opts.colorScale).domain([minValue, maxValue]);

  const legendQuantize_colors = d3_scaleLinear().domain([minValue, maxValue]);

  // This bit is the big difference from init() }
  // because we're transitioning states' colors,
  // states we know already exist, have IDs, and may have mouseenter listeners, etc.
  instance.svg
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
    })
    .attr('class', d => {
      return this.chooseStateClasses(d, 'shape');
    });

  // The rest of applyNewData is back to the same code from init()
  if (this.legendSVG) {
    const theCurrentLegend = document.querySelector(
      '.map-wrapper .legend-container svg'
    );

    while (theCurrentLegend.hasChildNodes()) {
      theCurrentLegend.removeChild(theCurrentLegend.lastChild);
    }

    this.legendSVG = select('.legend-container svg');
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
DataMap.prototype.zoomToState = function(stateID, d) {
  // Save the ID
  this.focusedStateID = stateID;

  // hide the tooltip when we start a zoom change
  select('body #map-tooltip').style.display = 'none';

  // Assign classes to paths and circles
  instance.svg.selectAll('path').attr('class', d => {
    return this.chooseStateClasses(d, 'shape');
  });
  instance.svg.selectAll('circle').attr('class', d => {
    return this.chooseStateClasses(d, 'circle');
  });

  // If we're zooming out,
  if (this.focusedStateID == 'US') {
    this.g
      .transition()
      .duration(750)
      .attr('transform', '');
  } else {
    const gutter = maxUSbounds.height * 0.05; // map "pixels" between edge of state and edge of svg stage

    const viewboxWidth = maxUSbounds.width;
    const viewboxHeight = maxUSbounds.height;

    const featBounds = this.pathProjection.bounds(d);
    const featWest = featBounds[0][0] - gutter;
    const featNorth = featBounds[0][1] - gutter;

    const featEast = Number(featBounds[1][0] + gutter);
    const featSouth = Number(featBounds[1][1] + gutter);
    const featWidth = featEast - featWest;
    const featHeight = featSouth - featNorth;
    const newScale = Math.min(
      viewboxWidth / featWidth,
      viewboxHeight / featHeight
    );

    let translateX = (featWest * newScale - maxUSbounds.west) * -1;
    let translateY = (featNorth * newScale - maxUSbounds.north) * -1;

    translateX += (viewboxWidth - featWidth * newScale) / 2;
    translateY += (viewboxHeight - featHeight * newScale) / 2;

    const scale = newScale;

    const translate = [translateX, translateY];

    this.g
      .transition()
      .delay(500) // time for the states to animate before zooming in
      .duration(750)
      .attr('transform', 'translate(' + translate + ')scale(' + scale + ')');
  }
};

/**
 *
 */
DataMap.prototype.sortCircles = function() {
  instance.svg.selectAll('circle').sort((a, b) => {
    return d3_sort_descending(a.value, b.value);
  });
};

/**
 * Creates (and updates) the map's legend
 * @param {d3.svg} svg - the element created by select()
 * @param {Function} scale
 * @param {*} quantize
 * @param {number} quantiles
 */
function drawStateLegend(svg, scale, quantize, quantiles) {
  const legendWidth = 40;
  const legendBar = 35;
  const ticks = quantize.ticks(quantiles);
  // .ticks() returns an array of the values at the various breaking points
  // The number of ticks (quantiles) is just a guide.
  // If the data range is more evenly split into one or two above this number, it will be.
  // e.g., if our range is $1M-$3M and we ask for four ticks, we'll probably only get three: $1M, $2M, $3M
  // instead of $750K, $1.5M, $2.25M, $3M

  // Create the legend itself
  const legend = svg
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
  const compactRule = chooseRule(ticks[Math.ceil(ticks.length / 2)]);

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
 * @param {number} value Value to be used to determine the color.
 * @param {Function} legendScale_colors Determines the color scale for the current range of values.
 * @param {d3_scaleLinear} legendQuantize_colors Represents the range of data.
 * @param {number} quantiles How many bars to include in the legend.
 * @param {*} colorZero Color code to use if the value is 0.
 * @param {boolean} hasLegend Default: false. If a legend is being used, will "round" colors to those in the legend. If no legend is being used, colors will not be rounded.
 * @returns {string} 'fill' value based on the parameters provided.
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
  const legendValueTicks = legendQuantize_colors.ticks(quantiles);

  if (!value || value == 0) {
    // If the state value is zero, use the zero color (default) and be done
    colorToReturn = colorZero;
  } else if (!hasLegend) {
    // If we aren't using the legend we don't have to stick to its color stops
    colorToReturn = legendScale_colors(value);
  } else {
    // Otherwise, const s figure out which legend color we should use
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
 * @param {number} value
 * @param {Array} valueRange
 * @param {int} quantiles
 * @param {Array} circleSizeRange
 * @param {boolean} hasLegend
 */
function calculateCircleSize(
  value,
  valueRange,
  sizeRange,
  quantiles,
  hasLegend = false
) {
  const sizeToReturn = 0;
  // const legendValueTicks = legendQuantize_sizes.ticks(quantiles);

  if (!value || value == 0) {
    // If the state value is zero, use the zero color (default) and be done
    sizeToReturn = 0;
  } else if (!hasLegend) {
    // If we aren't using the legend we don't have to stick to its color stops
    // sizeToReturn = legendScale_sizes(value);
    // TODO - this
  } else {
    // How much is each step in the value range?
    const valueStepValue = (valueRange[1] - valueRange[0]) / quantiles;
    // How much is each step in the size range?
    const sizeStepValue = (sizeRange[1] - sizeRange[0]) / quantiles;

    // Let's break the value and size ranges into steps
    const valueSteps = [];
    const sizeSteps = [];
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
 * @param {number} minValue The smaller number / the starting point of the return value.
 * @param {number} maxValue The largest number on the scale.
 * @returns {number} A new maxValue about half-way between minValue and maxValue
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
  const tooltip = select('body')
    .append('div')
    .attr('id', 'map-tooltip')
    .attr('class', 'tooltip tooltip--above tooltip--mouse data-map-tooltip')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('display', 'none');

  // Go through our svg/map and assign the mouse listeners to each path
  svg
    .selectAll('path, circle')
    .on('mouseenter', (e, d) => {
      const thisValue = instance.getStateValue(d.id);
      if (thisValue && thisValue !== 0) {
        // If the value is <$0, we want to move the negative sign to in front of the dollar sign
        const valueString =
          thisValue > 0
            ? '$' + Math.round(thisValue).toLocaleString()
            : '-$' + Math.abs(Math.round(thisValue).toLocaleString());
        const html = tooltipTemplate({
          name: fipsByCode[d.id].STATE_NAME,
          total: valueString
        });
        tooltip.style('display', 'block').html(html);
        moveTooltip(tooltip, e, d);
      }
    })
    .on('mousemove', (e, d) => {
      const thisValue = instance.getStateValue(d.id);
      if (thisValue && thisValue !== 0) {
        const valueString =
          thisValue > 0
            ? '$' + Math.round(thisValue).toLocaleString()
            : '-$' + Math.abs(Math.round(thisValue).toLocaleString());
        const html = tooltipTemplate({
          name: fipsByCode[d.id].STATE_NAME,
          total: valueString
        });
        moveTooltip(tooltip, e, d);
        tooltip.style('display', 'block').html(html);
      } else {
        tooltip.style('display', 'none');
      }
    })
    .on('click', (e, d) => {
      const shouldClick = instance.opts.clickableFeatures;
      if (!shouldClick) {
        return null;
      } else {
        this.dispatchEvent(
          new CustomEvent('STATE_CLICKED', {
            detail: {
              abbr: fipsByCode[d.id].STUSAB,
              name: fipsByCode[d.id].STATE_NAME,
              d: d
            },
            bubbles: true
          })
        );
      }
    });
  // Toggling the tooltip between states causes a flicker
  // but we don't want to leave it in place when the cursor is over the map but between circles
  svg.selectAll('circle').on('mouseleave', function() {
    moveTooltip(tooltip);
    tooltip.style('display', 'none');
  });

  // Add the mouseleave listeners to the dom elements rather than relying on d3
  // (d3 kept converting mouseleave to mouseout for IE11 and they're different for IE)
  const theLargeMap = document.querySelector('.election-map svg');
  const theStatesPaths = theLargeMap.querySelectorAll('path');

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
  // So const s hide it on resize, just in case.
  window.addEventListener('resize', function() {
    tooltip.style('display', 'none');
  });
}

/**
 *
 */
DataMap.prototype.chooseStateClasses = function(d, shapeType) {
  let toReturn = shapeType;

  // For fills, if we're looking at the zoomed state, add 'zoomed',
  // Otherwise 'blur' it
  if (
    this.focusedStateID == fipsByCode[d.id].STUSAB &&
    shapeType != 'circle'
  )
    toReturn += ' zoomed';
  else if (this.focusedStateID != 'US') toReturn += ' blur';

  // Add zero-value to turn off pointer events
  if (!d.value) toReturn += ' zero-value';

  return toReturn;
};

/**
 * Controls the tooltip position and visibility, called on each state's mouseenter and mousemove
 * @param {HTMLElement} Selection - the D3 Selection
 * @param {MouseEvent} e
 * @param {Object} d
 */
function moveTooltip(tooltip, e, d) {
  // Where's the pointer / where should the tooltip appear/move
  const x = e.pageX - tooltip._groups[0][0].offsetWidth / 2;
  const y = e.pageY - tooltip._groups[0][0].offsetHeight;
  // TODO: referencing the html element through _groups seems wrong
  
  const bottomPointerHeight = '.8rem';

  // The dom whose height we need to measure
  const theTooltipTitle = document.querySelector('#map-tooltip .tooltip__title');
  const theTooltipValue = document.querySelector('#map-tooltip .tooltip__value');

  // Measure those elements for our total height
  // IE doesn't handle mouseleave well so we'll set a value for it,
  // update for modern browsers, then continue
  let contentHeight = 50;
  if (theTooltipTitle) {
    contentHeight = theTooltipTitle.clientHeight;
    contentHeight += theTooltipValue.clientHeight;
  }
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
  const divisor = Math.pow(10, rule[1]);
  // return d3.round(value / divisor, 1).toString() + rule[0];
  return Math.round(value/divisor).toFixed(1) + rule[0];
  // return d3_scaleBandRound(value / divisor, 1).toString() + rule[0];
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
 * @param {string} obj.name - The state name to appear in the tooltip
 * @param {string} obj.total - The value for that state
 */
function tooltipTemplate(obj) {
  return `<div class="tooltip__title">${obj.name}</div>
    <div class="tooltip__value">${obj.total}</div>`;
}
