
var LineChartCommittees = require('../modules/line-chart-committees')
  .LineChartCommittees;
var tabs = require('../vendor/tablist');

function PlotChart(selector, type, index) {
  this.selector = selector;
  this.$element = $(selector);
  this.type = type;
  this.index = index;
  this.initialized = false;
  this.totals = this.$element.find('.js-total');
}

PlotChart.prototype.init = function() {
  if (this.initialized) {
    return;
  }
  new LineChartCommittees(
    this.selector + ' .js-chart',
    '.js-' + this.type + '-snapshot',
    this.type,
    this.index
  );
  this.initialized = true;
};

$(document).ready(function() {
  tabs.onShow($('#raising'), function() {
    new PlotChart('.js-raised-overview', 'raised', 1).init();
  });

  tabs.onShow($('#spending'), function() {
    new PlotChart('.js-spent-overview', 'spent', 2).init();
  });
});
