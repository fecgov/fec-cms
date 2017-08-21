'use strict';

var $ = require('jquery');
var _ = require('underscore');

var FilterSet = require('./filter-set').FilterSet;
var accessibility = require('../accessibility');
var helpers = require('../helpers');

var defaultOptions = {
  body: '.filters',
  content: '.filters__content',
  filterHeader: '.js-filter-header',
  form: '#category-filters',
  focus: '.js-filter-toggle',
  toggle: '.js-filter-toggle'
};

function FilterPanel(options) {
  this.isOpen = false;
  this.options = _.extend({}, defaultOptions, options);

  this.$body = $(this.options.body);
  this.$content = this.$body.find(this.options.content);
  this.$form = $(this.options.form);
  this.$focus = $(this.options.focus);
  this.$toggle = $(this.options.toggle);
  this.$filterHeader = $(this.options.filterHeader);

  this.$toggle.on('click', this.toggle.bind(this));
  this.$body.on('filter:added', this.handleAddEvent.bind(this));
  this.$body.on('filter:removed', this.handleRemoveEvent.bind(this));

  this.filterSet = new FilterSet(this.$form).activateAll();

  this.setInitialDisplay();
}

FilterPanel.prototype.setInitialDisplay = function() {
  if (helpers.getWindowWidth() >= helpers.BREAKPOINTS.LARGE) {
    this.show();
  } else if (!this.isOpen) {
    this.hide();
  }
};

FilterPanel.prototype.show = function(focus) {
  if (!helpers.isLargeScreen()) {
    this.$content.css('top', 0);
  }
  this.$body.addClass('is-open');
  this.$content.attr('aria-hidden', false);
  accessibility.restoreTabindex(this.$form);
  $('body').addClass('is-showing-filters');
  this.isOpen = true;
  // Don't focus on the first filter unless explicitly intended to
  // Prevents the first filter from being focused on initial page load
  if (focus) {
    this.$body.find('input, select, button:not(.js-filter-close)').first().focus();
  }
};

FilterPanel.prototype.hide = function() {
  if (!helpers.isLargeScreen()) {
    var top = this.$toggle.outerHeight() +  this.$toggle.position().top;
    this.$content.css('top', top);
  }
  this.$body.removeClass('is-open');
  this.$content.attr('aria-hidden', true);
  this.$focus.focus();
  accessibility.removeTabindex(this.$form);
  $('body').removeClass('is-showing-filters');
  this.isOpen = false;
};

FilterPanel.prototype.toggle = function() {
  if (this.isOpen) {
    this.hide();
  } else {
    this.show(true);
  }
};

FilterPanel.prototype.handleAddEvent = function(e, opts) {
  // If it's a data-type toggle, we tell it to ignore for the count of active filters
  if (opts.ignoreCount) { return; }

  var filterCount = this.$filterHeader.find('.filter-count');

  if (filterCount.html()) {
    filterCount.html(parseInt(filterCount.html(), 10) + 1);
  }
  else {
    this.$filterHeader.append(' <span class="filter-count">1</span>');
  }
};

FilterPanel.prototype.handleRemoveEvent = function(e, opts) {
  if (opts.loadedOnce !== true) { return; }

  var filterCount = this.$filterHeader.find('.filter-count');

  if (filterCount.html() === '1') {
    filterCount.remove();
  }
  else {
    filterCount.html(parseInt(filterCount.html(), 10) - 1);
  }
};

module.exports = {FilterPanel: FilterPanel};
