'use strict';

/* global require, module, window, perfBar */

var _ = require('underscore');

require('perfbar/build/perfbar');

var performanceBudgets = {
  loadTime: {max: 3000},
  latency: {max: 10000},
  FirstPaint: {max: 150},
  frontEnd: {max: 1200},
  backEnd: {max: 300},
  large_search_loaded: {max: 400}
};

function getMetric(mark) {
  return {
    id: 'mark_' + mark.name,
    label: mark.name,
    unit: 'ms',
    value: Math.floor(mark.startTime),
    budget: performanceBudgets[mark.name]
  };
}

function bar() {
  var marks = window.performance &&
    window.performance.getEntriesByType &&
    window.performance.getEntriesByType('mark') ||
    [];

  perfBar.init({budget: performanceBudgets});

  _.chain(marks)
    .groupBy('name')
    .each(function(marks, name) {
      var mark = _.max(marks, 'startTime');
      perfBar.addMetric(getMetric(mark));
    });
}

module.exports = {bar: bar};
