'use strict';

/* global require, module, document */

var $ = require('jquery');

/**
 * Skip nav link
 * @constructor
 * @param {string} anchor - CSS selector for the anchor element that will function as the skip nav
 * @param {string} targetBody - CSS selector for the main content area to look for a focusable element in
 */

function Skipnav(anchor, targetBody) {
  this.anchor = anchor;
  this.$targetBody = $(targetBody);
  this.$target = $(this.findTarget());
  $(document.body).on(
    'click keyup',
    this.anchor,
    this.focusOnTarget.bind(this)
  );
}

Skipnav.prototype.findTarget = function() {
  return this.$targetBody
    .find(':first-child')
    .not('div, header, section, article, aside')
    .filter(':visible')[0];
};

Skipnav.prototype.focusOnTarget = function(e) {
  e.preventDefault();

  if (e.keyCode === 13 || e.type === 'click') {
    this.$target.attr('tabindex', '0');
    this.$target.focus();
  }
};

module.exports = { Skipnav: Skipnav };
