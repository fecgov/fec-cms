'use strict';

var $ = require('jquery');
var helpers = require('./helpers');

function StickyBar(selector) {
  this.$body = $('body');
  this.$bar = $(selector);
  this.offset = this.$bar.offset().top;
  this.triggerOffset = this.$bar.data('trigger-offset') || 0; // Delay before it sticks

  this.defaultBodyPadding = this.$body.css('padding-top');
  $(window).on('scroll', this.toggle.bind(this));
}

StickyBar.prototype.toggle = function() {
  if (!helpers.isLargeScreen()) { return; }

  var scrollTop = this.$body.scrollTop();
  if (scrollTop >= this.offset + this.triggerOffset) {
    var height = this.$bar.outerHeight();
    this.$bar.addClass('is-stuck');
    this.$body.css('padding-top', height);
  } else if (scrollTop < this.offset) {
    this.$bar.removeClass('is-stuck');
    this.$body.css('padding-top', this.defaultBodyPadding);
  }
};

module.exports = {StickyBar: StickyBar};
