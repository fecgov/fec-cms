/* global DEFAULT_TIME_PERIOD */

import * as d3 from 'd3';
import * as numeral from 'numeral';
import { default as _chain } from 'underscore/modules/chain.js';
import { default as _each } from 'underscore/modules/each.js';
import { default as _max } from 'underscore/modules/max.js';
import { default as _sortBy } from 'underscore/modules/sortBy.js';

import { buildUrl, currency, isMediumScreen, utcDate, zeroPad } from './helpers.js';

var parseM = d3.time.format('%b');
var parseMY = d3.time.format('%b %Y');
var parseMDY = d3.time.format('%m/%d/%Y');
var parsePlotPoints = d3.time.format('%Y-%m-01T%H:%M:%S.%L');

var bisectDate = d3.bisector(function(d) {
  return d.date;
}).left;

const currentYear = new Date().getFullYear();
const MIN_CYCLE = 2008;
const MAX_CYCLE = currentYear % 2 === 0 ? currentYear : currentYear + 1;
const MAX_RANGE = 4000000000; // Set the max y-axis to 4 billion

/**
 * Line Chart
 * @constructor
 *
 * Creates an SVG line chart for total raising and spending
 *
 * @param {string} selector - Selector of the parent element
 * @param {string} snapshot - Selector to use for the snapshot,
 *   which is the set of numbers that is updated when moving the cursor
 * @param {string} dataType - The type of data the chart is showing ('raised' or 'spent')
 *
 */

export default function LineChart(selector, snapshot, dataType) {
  this.element = d3.select(selector);
  this.dataType = dataType;
  this.cycle = Number(DEFAULT_TIME_PERIOD);
  this.entityNames = ['candidate', 'party', 'pac'];
  this.margin = { top: 10, right: 20, bottom: 30, left: 50 };
  this.baseWidth = $(selector).width();
  this.baseHeight = this.baseWidth * 0.5;
  this.height = this.baseHeight - this.margin.top - this.margin.bottom;
  this.width = this.baseWidth - this.margin.left - this.margin.right;
  this.startCursorAtEnd = true;

  // Locate DOM elements
  this.$snapshot = $(snapshot);
  this.$prev = this.$snapshot.find('.js-snapshot-prev');
  this.$next = this.$snapshot.find('.js-snapshot-next');

  // Fetch the data and build the chart
  this.fetch(this.cycle);

  // Set the snapshot height if we're in a medium-sized screen
  if (isMediumScreen()) {
    this.$snapshot.height(this.baseHeight - this.margin.bottom);
  }

  // Add event listeners
  this.element.on('mousemove', this.handleMouseMove.bind(this));
  this.$prev.on('click', this.goToPreviousMonth.bind(this));
  this.$next.on('click', this.goToNextMonth.bind(this));
}

LineChart.prototype.fetch = function(cycle) {
  const entityTotalsURL = buildUrl(['totals', 'by_entity'], {
    cycle: cycle,
    per_page: '100'
  });

  $.getJSON(entityTotalsURL).done(this.handleResponse.bind(this));
};

LineChart.prototype.handleResponse = function(response) {
  // Format the response and call all necessary methods to get the presentation right
  this.groupDataByType(response.results);
  this.drawChart();
  this.moveCursor();
  this.setupSnapshot(this.cycle);
};

LineChart.prototype.groupDataByType = function(results) {
  // Takes the results of the response and groups it into data for the chart
  // Stores an array of objects for each month,
  // with either raising or spending totals depending on the dataType of the chart
  const formattedData = [];
  const dataType = this.dataType;
  const today = new Date();
  _each(results, function(item) {
    let datum;
    const date = utcDate(item.end_date);
    // If the data is in the future, it's probably wrong, so ignore it
    if (date > today) {
      return;
    }

    if (dataType === 'raised') {
      datum = {
        date: date,
        candidate: item.cumulative_candidate_receipts,
        pac: item.cumulative_pac_receipts,
        party: item.cumulative_party_receipts
      };
    } else {
      datum = {
        date: date,
        candidate: item.cumulative_candidate_disbursements,
        pac: item.cumulative_pac_disbursements,
        party: item.cumulative_party_disbursements
      };
    }
    formattedData.push(datum);
  });

  this.chartData = _sortBy(formattedData, 'date');
};

LineChart.prototype.groupEntityTotals = function() {
  // Create separate arrays of data for each entity type
  // These will be used to draw the lines on the chart
  const chartData = this.chartData;
  let entityTotals = {};
  this.entityNames.forEach(function(type) {
    var totals = chartData.map(function(d) {
      return {
        date: d.date,
        amount: d[type] || 0
      };
    });
    entityTotals[type] = totals;
  });
  return entityTotals;
};

LineChart.prototype.getMaxAmount = function(entityTotals) {
  let max = 0;

  _each(entityTotals, function(element) {
    var entityMax = _max(element, function(item) {
      return item.amount;
    });
    max = max >= entityMax.amount ? max : entityMax.amount;
  });

  return max;
};

LineChart.prototype.setXScale = function() {
  // Set the x-scale to be from the first of the first year to the last day of the cycle
  let x = d3.time
    .scale()
    .domain([
      new Date('01/01/' + String(this.cycle - 1)),
      new Date('12/31/' + String(this.cycle))
    ])
    .nice(d3.time.month)
    .range([0, this.width]);
  this.x = x;
  return x;
};

LineChart.prototype.setYScale = function(amount) {
  // Set the y-axis from 0 to the MAX_RANGE ($4 billion)
  amount = amount || MAX_RANGE;

  let y = d3.scale
    .linear()
    .domain([0, Math.ceil(amount / 100000000) * 100000000])
    .range([this.height, 0]);
  return y;
};

LineChart.prototype.appendSVG = function() {
  // Adds a basic SVG container with all the right dimensions
  let svg = this.element
    .append('svg')
    .attr('class', 'bar-chart')
    .attr('width', '100%')
    .attr('height', this.height + this.margin.top + this.margin.bottom)
    .append('g')
    .attr(
      'transform',
      'translate(' + this.margin.left + ',' + this.margin.top + ')'
    );
  return svg;
};

LineChart.prototype.drawChart = function() {
  const entityTotals = this.groupEntityTotals();
  const maxY = this.getMaxAmount(entityTotals);
  const x = this.setXScale();
  const y = this.setYScale(maxY);
  let xAxis = d3.svg
    .axis()
    .scale(x)
    .ticks(d3.time.month)
    .tickFormat(this.xAxisFormatter())
    .orient('bottom');
  let yAxis = d3.svg
    .axis()
    .scale(y)
    .orient('right')
    .tickSize(this.width)
    .tickFormat(function(d) {
      return numeral(d).format('($0.0a)');
    });

  // Create the base SVG
  let svg = this.appendSVG();

  // Add the xAxis
  svg
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + this.height + ')')
    .call(xAxis);

  // Add the yAxis
  svg
    .append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .selectAll('text')
    .attr('y', -4)
    .attr('x', -4)
    .attr('dy', '.71em')
    .style('text-anchor', 'end');

  let lineBuilder = d3.svg
    .line()
    .x(function(d) {
      var myDate = new Date(parsePlotPoints(d.date));
      return x(myDate);
    })
    .y(function(d) {
      return y(d.amount);
    });

  // Draw a line and populate data for each entity type
  this.entityNames.forEach(function(entity) {
    let line = svg.append('g').attr('class', 'line--' + entity);
    let points = line.append('g').attr('class', 'line__points');

    line
      .append('path')
      .datum(entityTotals[entity])
      .attr('d', lineBuilder)
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    points
      .selectAll('circle')
      .data(entityTotals[entity])
      .enter()
      .append('circle')
      .attr('cx', function(d) {
        var myDate = new Date(parsePlotPoints(d.date));
        return x(myDate);
      })
      .attr('cy', function(d) {
        return y(d.amount);
      })
      .attr('r', 2);
  });

  this.drawCursor(svg);
};

LineChart.prototype.drawCursor = function(svg) {
  // Add a dotted vertical line for the cursor
  this.cursor = svg
    .append('line')
    .attr('class', 'cursor')
    .attr('stroke-dasharray', '5,5')
    .attr('x1', 10)
    .attr('x2', 10)
    .attr('y1', 0)
    .attr('y2', this.height - 2);
};

LineChart.prototype.xAxisFormatter = function() {
  // Draw tick marks for the x-axis at different intervals depending on screen size
  let formatter;
  if (isMediumScreen()) {
    formatter = function(d) {
      if (d.getMonth() === 0) {
        return parseMY(d);
      } else if (d.getMonth() % 2 === 0) {
        return parseM(d);
      } else {
        return '';
      }
    };
  } else {
    formatter = function(d) {
      if (d.getMonth() === 0) {
        return parseMY(d);
      } else if (d.getMonth() % 4 === 0) {
        return parseM(d);
      } else {
        return '';
      }
    };
  }

  return formatter;
};

LineChart.prototype.handleMouseMove = function() {
  const svg = this.element.select('svg')[0][0];
  const x0 = this.x.invert(d3.mouse(svg)[0]);
  const i = bisectDate(this.chartData, x0, 1);
  const d = this.chartData[i - 1];
  this.moveCursor(d);
};

LineChart.prototype.moveCursor = function(datum) {
  const target = datum ? datum : this.getCursorStartPosition();
  const i = this.chartData.indexOf(target);
  const myDate = new Date(parsePlotPoints(target.date));
  this.cursor.attr('x1', this.x(myDate)).attr('x2', this.x(myDate));
  this.nextDatum = this.chartData[i + 1] || false;
  this.prevDatum = this.chartData[i - 1] || false;
  this.populateSnapshot(target);
  this.element
    .selectAll('.line__points circle')
    .attr('r', 2)
    .filter(function(d) {
      return d.date === target.date;
    })
    .attr('r', 4);
};

LineChart.prototype.getCursorStartPosition = function() {
  // Determines whether to start the cursor at the begining or end of a time period
  // this.startCursorAtEnd is set to true by default, but when navigating
  // to next cycle, it is set to false so that the cursor starts at the beginning
  if (this.startCursorAtEnd) {
    return this.chartData[this.chartData.length - 1];
  } else {
    return this.chartData[0];
  }
};

LineChart.prototype.setupSnapshot = function(cycle) {
  // Change the header of the snapshot to show the correct dates when a new cycle is set
  const firstYear = cycle - 1;
  const firstOfCycle = new Date('01/01/' + firstYear);
  this.$snapshot.find('.js-min-date').html(parseMDY(firstOfCycle));
};

LineChart.prototype.populateSnapshot = function(datum) {
  // Update the snapshot with the correct dates, data and decimal-padding\
  this.snapshotSubtotals(datum);
  this.snapshotTotal(datum);
  this.$snapshot.find('.js-max-date').html(parseMDY(datum.date));
  zeroPad(
    this.$snapshot,
    '.snapshot__item-number',
    '.figure__decimals'
  );
};

LineChart.prototype.snapshotSubtotals = function(datum) {
  // Update the snapshot with the values for each category
  this.$snapshot.find('[data-total-for]').each(function() {
    const category = $(this).data('total-for');
    const value = currency(datum[category]);
    $(this).html(value);
  });
};

LineChart.prototype.snapshotTotal = function(datum) {
  // Total all the categories and show it as the total total
  let total = _chain(datum)
    .omit('date')
    .values()
    .reduce(function(a, b) {
      return a + b;
    })
    .value();
  this.$snapshot.find('[data-total-for="all"]').html(currency(total));
};

LineChart.prototype.goToNextMonth = function() {
  if (this.nextDatum) {
    this.moveCursor(this.nextDatum);
  } else if (this.cycle < MAX_CYCLE) {
    this.startCursorAtEnd = false;
    this.nextCycle();
  }
};

LineChart.prototype.goToPreviousMonth = function() {
  if (this.prevDatum) {
    this.moveCursor(this.prevDatum);
  } else if (this.cycle > MIN_CYCLE) {
    this.startCursorAtEnd = true;
    this.previousCycle();
  }
};

LineChart.prototype.removeSVG = function() {
  this.element.select('svg').remove();
};

LineChart.prototype.previousCycle = function() {
  this.removeSVG();
  this.cycle = this.cycle - 2;
  this.fetch(this.cycle);
};

LineChart.prototype.nextCycle = function() {
  this.removeSVG();
  this.cycle = this.cycle + 2;
  this.fetch(this.cycle);
};
