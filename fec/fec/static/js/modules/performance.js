// global perfBar
/**
 * This is being called by window.performance.mark() in
 * fec/data/templates/layouts/main.jinja and fec/data/templates/layouts/widgets.jinja
*/
/*
import { chain as _chain, max as _max } from 'underscore';
import 'perfbar/build/perfbar';

var performanceBudgets = {
  loadTime: { max: 3000 },
  latency: { max: 10000 },
  FirstPaint: { max: 150 },
  frontEnd: { max: 1200 },
  backEnd: { max: 300 },
  large_search_loaded: { max: 400 }
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

export function bar() {
  var marks =
    (window.performance &&
      window.performance.getEntriesByType &&
      window.performance.getEntriesByType('mark')) ||
    [];

  perfBar.init({ budget: performanceBudgets });

  _chain(marks)
    .groupBy('name')
    .each(function(marks) {
      var mark = _max(marks, 'startTime');
      perfBar.addMetric(getMetric(mark));
    });
}
*/
