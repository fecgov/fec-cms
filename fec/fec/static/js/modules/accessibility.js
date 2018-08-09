'use strict';

/* global require, module */

var $ = require('jquery');

/**
 * Utilities for setting or removing tabindex on all focusable elements
 * in a parent div. Useful for hiding elements off-canvas without setting
 * display:none, while still removing from the tab order
 */

function removeTabindex($elm) {
  $elm.find('a, button, :input, [tabindex]').attr('tabindex', '-1');
}

function restoreTabindex($elm) {
  $elm.find('a, button, :input, [tabindex]').attr('tabindex', '0');
}

module.exports = {
  removeTabindex: removeTabindex,
  restoreTabindex: restoreTabindex
};
