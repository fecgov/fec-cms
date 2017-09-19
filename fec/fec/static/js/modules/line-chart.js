'use strict';

/* global module, DEFAULT_TIME_PERIOD */
var $ = require('jquery');
var _ = require('underscore');
var d3 = require('d3');
var numeral = require('numeral');
var helpers = require('./helpers');

var parseM = d3.time.format('%b');
var parseMY = d3.time.format('%b %Y');
var parseMDY = d3.time.format('%b %e, %Y');

var bisectDate = d3.bisector(function(d) { return d.date; }).left;

var currentYear = new Date().getFullYear();
var MIN_CYCLE = 2008;
var MAX_CYCLE = currentYear % 2 === 0 ? currentYear : currentYear + 1;
var MAX_RANGE = 4000000000; // Set the max y-axis to 4 billion

/**
 * Line Chart
 * @constructor
 *
 * Creates an SVG line chart for total raising and spending
 *
 * @param {String} selector - Selector of the parent element
 * @param {String} snapshot - Selector to use for the snapshot,
 *   which is the set of numbers that is updated when moving the cursor
 * @param {String} dataType - The type of data the chart is showing ('raised' or 'spent')
 *
 */

function LineChart(selector, snapshot, dataType) {
  this.element = d3.select(selector);
  this.dataType = dataType;
  this.cycle = Number(DEFAULT_TIME_PERIOD);
  this.entityNames = ['candidate', 'party', 'pac'];
  this.margin = {top: 10, right: 20, bottom: 30, left: 50};
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
  if (helpers.isMediumScreen()) {
    this.$snapshot.height(this.baseHeight - this.margin.bottom);
  }

  // Add event listeners
  this.element.on('mousemove', this.handleMouseMove.bind(this));
  this.$prev.on('click', this.goToPreviousMonth.bind(this));
  this.$next.on('click', this.goToNextMonth.bind(this));
}

LineChart.prototype.fetch = function(cycle) {
  var entityTotalsURL = helpers.buildUrl(
    ['totals', 'by_entity'],
    { 'cycle': cycle, 'per_page': '100'}
  );

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
  var formattedData = [];
  var dataType = this.dataType;
  var today = new Date();
  _.each(results, function(item) {
    var datum;
    var date = helpers.utcDate(item.date);
    // If the data is in the future, it's probably wrong, so ignore it
    if (date > today) { return; }

    if (dataType === 'raised') {
      datum = {
        'date': date,
        'candidate': item.cumulative_candidate_receipts,
        'pac': item.cumulative_pac_receipts,
        'party': item.cumulative_party_receipts
      };
    } else {
      datum = {
        'date': date,
        'candidate': item.cumulative_candidate_disbursements,
        'pac': item.cumulative_pac_disbursements,
        'party': item.cumulative_party_disbursements
      };
    }
    formattedData.push(datum);
  });

  this.chartData = _.sortBy(formattedData, 'date');
};

LineChart.prototype.groupEntityTotals  = function() {
  // Create separate arrays of data for each entity type
  // These will be used to draw the lines on the chart
  var chartData = this.chartData;
  var entityTotals = {};
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

LineChart.prototype.setXScale = function() {
  // Set the x-scale to be from the first of the first year to the last day of the cycle
  var x = d3.time.scale()
    .domain([new Date('01/01/' + String(this.cycle - 1)),
              new Date('12/31/' + String(this.cycle))])
    .nice(d3.time.month)
    .range([0, this.width]);
  this.x = x;
  return x;
};

LineChart.prototype.setYScale = function() {
  // Set the y-axis from 0 to the MAX_RANGE ($4 billion)
  var y = d3.scale.linear()
      .domain([0, Math.ceil(MAX_RANGE / 1000000000) * 1000000000])
      .range([this.height, 0]);
  return y;
};

LineChart.prototype.appendSVG = function() {
  // Adds a basic SVG container with all the right dimensions
  var svg = this.element.append('svg')
      .attr('class', 'bar-chart')
      .attr('width', '100%')
      .attr('height', this.height + this.margin.top + this.margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
  return svg;
};

LineChart.prototype.drawChart = function() {
  var entityTotals = this.groupEntityTotals();
  var x = this.setXScale();
  var y = this.setYScale();
  var xAxis = d3.svg.axis()
      .scale(x)
      .ticks(d3.time.month)
      .tickFormat(this.xAxisFormatter())
      .orient('bottom');
  var yAxis = d3.svg.axis()
      .scale(y)
      .orient('right')
      .tickSize(this.width)
      .tickFormat(function(d) {
        return numeral(d).format('($0.0a)');
      });

  // Create the base SVG
  var svg = this.appendSVG();

  // Add the xAxis
  svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(xAxis);

  // Add the yAxis
  svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .selectAll('text')
        .attr('y', -4)
        .attr('x', -4)
        .attr('dy', '.71em')
        .style('text-anchor', 'end');

  var lineBuilder = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.amount); });

  // Draw a line and populate data for each entity type
  this.entityNames.forEach(function(entity) {
    var line = svg.append('g').attr('class', 'line--' + entity);
    var points = line.append('g').attr('class', 'line__points');

    line.append('path')
      .datum(entityTotals[entity])
      .attr('d', lineBuilder)
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    points.selectAll('circle')
      .data(entityTotals[entity])
      .enter()
      .append('circle')
      .attr('cx', function(d) {
          return x(d.date);
      })
      .attr('cy', function(d) { return y(d.amount); })
      .attr('r', 2);
  });

  this.drawCursor(svg);
};

LineChart.prototype.drawCursor = function(svg) {
  // Add a dotted vertical line for the cursor
  this.cursor = svg.append('line')
    .attr('class', 'cursor')
    .attr('stroke-dasharray', '5,5')
    .attr('x1', 10).attr('x2', 10)
    .attr('y1', 0).attr('y2', this.height);
};

LineChart.prototype.xAxisFormatter = function() {
  // Draw tick marks for the x-axis at different intervals depending on screen size
  var formatter;
  if (helpers.isMediumScreen()) {
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
  var svg = this.element.select('svg')[0][0];
  var x0 = this.x.invert(d3.mouse(svg)[0]),
    i = bisectDate(this.chartData, x0, 1),
    d = this.chartData[i - 1];
  this.moveCursor(d);
};

LineChart.prototype.moveCursor = function(datum) {
  var target = datum ? datum : this.getCursorStartPosition();
  var i = this.chartData.indexOf(target);
  this.cursor.attr('x1', this.x(target.date)).attr('x2', this.x(target.date));
  this.nextDatum = this.chartData[i+1] || false;
  this.prevDatum = this.chartData[i-1] || false;
  this.populateSnapshot(target);
  this.element.selectAll('.line__points circle')
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
  var firstYear = cycle - 1;
  var firstOfCycle = new Date('01/01/' + firstYear);
  this.$snapshot.find('.js-min-date').html(parseMDY(firstOfCycle));
};

LineChart.prototype.populateSnapshot = function(datum) {
  // Update the snapshot with the correct dates, data and decimal-padding
  this.snapshotSubtotals(datum);
  this.snapshotTotal(datum);
  this.$snapshot.find('.js-max-date').html(parseMDY(datum.date));
  helpers.zeroPad(this.$snapshot, '.snapshot__item-number', '.figure__decimals');
};

LineChart.prototype.snapshotSubtotals = function(datum) {
  // Update the snapshot with the values for each category
  this.$snapshot.find('[data-total-for]').each(function() {
    var category = $(this).data('total-for');
    var value = helpers.currency(datum[category]);
    $(this).html(value);
  });
};

LineChart.prototype.snapshotTotal = function(datum) {
  // Total all the categories and show it as the total total
  var total = _.chain(datum)
    .omit('date')
    .values()
    .reduce(function(a, b) { return a + b; })
    .value();
  this.$snapshot.find('[data-total-for="all"]').html(helpers.currency(total));
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

module.exports = {
  LineChart: LineChart
};
