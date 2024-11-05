import { default as FilterSet } from './filter-set.js';
import { removeTabindex, restoreTabindex } from '../accessibility.js';
import { BREAKPOINTS, getWindowWidth, isLargeScreen } from '../helpers.js';

/** @enum */
const defaultOptions = {
  body: '.filters',
  content: '.filters__content',
  filterHeader: '.js-filter-header',
  form: '#category-filters',
  focus: '.js-filter-toggle',
  toggle: '.js-filter-toggle'
};

/**
 * Powers the left-hand columns of filters
 * @param {Object} [options=defaultOptions]
 * @param {string} [options.body]
 * @param {string} [options.content]
 * @param {string} [options.filterHeader]
 * @param {string} [options.focus]
 * @param {string} [options.form]
 * @param {string} [options.toggle]
 */
export default function FilterPanel(options) {
  this.isOpen = false;
  this.options = Object.assign(defaultOptions, options);

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
  if (getWindowWidth() >= BREAKPOINTS.LARGE) {
    this.show();
  } else if (!this.isOpen) {
    this.hide();
  }
};

FilterPanel.prototype.show = function(focus) {
  if (!isLargeScreen()) {
    this.$content.css('top', 0);
  }
  this.$body.addClass('is-open');
  this.$content.attr('aria-hidden', false);
  restoreTabindex(this.$form);
  $('body').addClass('is-showing-filters');
  this.isOpen = true;
  // Don't focus on the first unless explicitly intended to
  // Prevents the first filter from being focused on initial page load
  if (focus) {
    this.$body
      .find('input, select, button:not(.js-filter-close)')
      .first()
      .focus(); // TODO: jQuery deprecation
  }
};

FilterPanel.prototype.hide = function() {
  if (!isLargeScreen()) {
    const top = this.$toggle.outerHeight() + this.$toggle.position().top;
    this.$content.css('top', top);
  }
  this.$body.removeClass('is-open');
  this.$content.attr('aria-hidden', true);
  this.$focus.focus(); // TODO: jQuery deprecation
  removeTabindex(this.$form);
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

/**
 * @param {jQuery.Event} e
 * @param {Object} opts
 */
FilterPanel.prototype.handleAddEvent = function(e, opts) {
  // If it's a data-type toggle, we tell it to ignore for the count of active filters
  if (opts.ignoreCount) {
    // return; // return nothing
  } else {
    const filterCount = this.$filterHeader.find('.filter-count');

    if (filterCount.html()) {
      filterCount.html(parseInt(filterCount.html(), 10) + 1);
    } else {
      this.$filterHeader.append('<span class="filter-count">1</span>');
    }
  }
};

/**
 * If it hasn't been called once, updates the content of .filter-count
 * @param {jQuery.Event} e
 * @param {Object} opts
 */
FilterPanel.prototype.handleRemoveEvent = function(e, opts) {
  if (opts.loadedOnce !== true) {
    // return; // return nothing
  } else {

    const filterCount = this.$filterHeader.find('.filter-count');

    if (filterCount.html() === '1') {
      filterCount.remove();
    } else {
      filterCount.html(parseInt(filterCount.html(), 10) - 1);
    }
  }
};
