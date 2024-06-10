import 'babel-polyfill/dist/polyfill.js';

/**
 * Object.assign
 * used in calendars
 * filter-panel, top-entities,
 */
import 'core-js/es/object/assign.js';

/**
 * NodeList.forEach
 * used for widgets/aggregate-totals-box
 */
// eslint-disable-next-line no-undef
if ('NodeList' in window && !NodeList.prototype.forEach) {
  // eslint-disable-next-line no-undef
  NodeList.prototype.forEach = function(callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

// Polyfills
// NodeList.forEach:
// (function() {
// eslint-disable-next-line no-undef
// if (typeof NodeList.prototype.forEach === 'function') return false;
// eslint-disable-next-line no-undef
// else NodeList.prototype.forEach = Array.prototype.forEach;
//   })();

/**
 * Fetch
 * used for widgets/aggregate-totals-box
 */
import 'whatwg-fetch';

/**
 * Promise
 */
import 'promise-polyfill/src/polyfill.js';

/**
 * element-closest
 * used to find closest ancestor of element in IE
 */
import 'element-closest/browser.js';

/**
 * array-from-polyfill
 * used for reporting-dates tables for Arry.from() in IE
 */
import 'array-from-polyfill';

/**
 * element.remove polyfill
 * used for reporting-dates tables for remove() in IE
 */
import 'element-remove';

/**
 * css.escape polyfill
 * Used for reporting-dates for non-standard css selectors in IE
 */
import 'css.escape';

/**
 * WeakMap polyfill
 */
import 'core-js/es/weak-map/index.js';

/**
 * Adds CustomEvent capabilities to IE < 11
 */
(function() {
  if (typeof window.CustomEvent === 'function') return false;

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(
      event,
      params.bubbles,
      params.cancelable,
      params.detail
    );
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();
