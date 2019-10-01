import 'babel-polyfill';

/**
 * Object.assign
 * used in calendars
 * filter-panel, top-entities,
 */
import 'core-js/library/fn/object/assign';

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
 * TODO used for
 */
import 'promise-polyfill/src/polyfill';

// For ES6 Set data structure
// eslint-disable-next-line no-unused-vars
var Set = require('es6-set');
