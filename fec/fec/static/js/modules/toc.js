
import { default as scrollMonitor } from 'scrollmonitor';
import { default as _each } from 'underscore/modules/each.js';

/**
 * Table of Contents widget
 *
 * 1. Takes a list of links and finds all sections with IDs matching their hrefs
 * 2. Adds scrollwatchers to highlight the menu item when the section reaches top of viewport
 * 3. Animates the document to scroll to the section when clicking the link
 *
 * @constructor
 * @param {string} selector - Selector for the navigation menu for the TOC
 */

export default function TOC(selector) {
  this.$menu = $(selector);
  this.sections = this.getSections();
  this.offset = -1 * window.innerHeight;
  this.watchers = this.addWatchers();
  this.$menu.on('click', 'a', this.scrollTo.bind(this));
  $(window).on('resize', this.updateWatchers.bind(this));

  // Handle inbound URL with hash
  if (window.location.hash) {
    var self = this;
    /**
    Call updateWatchers and scrollTo in 0-second setTimeout to
    move to end of browser stack. This avoids intermittent/breaking
    race condifion where inbound hash goes to its location before
    TOC can respond to the scroll.
    */
    setTimeout(function() {
     self.updateWatchers();
    window.scrollTo(0, $(window.location.hash).offset().top + 20);
    }, 0);
   }
}

TOC.prototype.getSections = function() {
  return this.$menu.find('a').map(function(idx, elm) {
    return $(elm).attr('href');
  });
};

TOC.prototype.addWatchers = function() {
  var self = this;

  return this.sections.map(function(idx, section) {
    var elm = document.querySelector(section);
    var watcher = scrollMonitor.create(elm, { top: self.offset });
    watcher.$menuItem = self.$menu.find('a[href="' + section + '"]');
    watcher.enterViewport(function() {
      self.highlightActiveItem(this);
    });
    return watcher;
  });
};

TOC.prototype.highlightActiveItem = function(watcher) {
  var $currentHighlight = this.$menu.find('a.is-active');
  if (watcher.isInViewport) {
    $currentHighlight.removeClass('is-active');
    watcher.$menuItem.addClass('is-active');
  }
};

TOC.prototype.scrollTo = function(e) {
  e.preventDefault();
  var $link = $(e.target);
  var section = $link.attr('href');
  var sectionTop = $(section).offset().top + 20;
  $('body, html').animate({
    scrollTop: sectionTop
  });
};

TOC.prototype.updateWatchers = function() {
  var newOffset = -1 * window.innerHeight;
  _each(this.watchers, function(watcher) {
    watcher.offsets.top = newOffset;
    watcher.recalculateLocation();
  });
};
