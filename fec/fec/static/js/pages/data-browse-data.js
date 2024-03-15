
import { default as LineChartCommittees } from '../modules/line-chart-committees.js';
import { onShow as onTabShow } from '../vendor/tablist.js';

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
  onTabShow($('#raising'), function() {
    new PlotChart('.js-raised-overview', 'raised', 1).init();
  });

  onTabShow($('#spending'), function() {
    new PlotChart('.js-spent-overview', 'spent', 2).init();
  });
});
