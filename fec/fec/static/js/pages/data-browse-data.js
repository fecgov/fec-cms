import LineChartCommittees from '../modules/line-chart-committees.js';
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

$(function() {
  onTabShow($('#raising'), function() {
    new PlotChart('.js-raised-overview', 'raised', 1).init();
  });

  onTabShow($('#spending'), function() {
    new PlotChart('.js-spent-overview', 'spent', 2).init();
  });
});

/**
 * Add event listeners for buttons that want to remote trigger tabs and/or accordions
 */
const remoteEls = document.querySelectorAll('.js-remote-tabpanel, .js-remote-accordion');
remoteEls.forEach((el) => {
  el.addEventListener('click', handleRemoteClick.bind(this));
});

function handleRemoteClick(e) {
  e.preventDefault();

  const targetHref = new URL(e.target.getAttribute('href'));
  const targetTabId = targetHref.searchParams.get('tab');
  const targetAccordionId = targetHref.hash.substring(1); // (.hash also returns the #, so remove it)

  $(`[role="tab"][data-name="${targetTabId}"]`).trigger('click'); // trigger the tab click
  $(`[aria-controls="${targetAccordionId}"][aria-expanded="false"]`).trigger('click'); // trigger the accordion click
  if (targetAccordionId) location.hash = `#${targetAccordionId}`; // Jump to the accordion
}
