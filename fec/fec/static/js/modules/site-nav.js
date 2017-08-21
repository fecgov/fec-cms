'use strict';

var $ = require('jquery');
var _ = require('underscore');
var helpers = require('./helpers');
var moment = require('moment');

window.$ = window.jQuery = $;

require('accessible-mega-menu');

/** SiteNav module
 * On mobile: Controls the visibility of the the hamburger menu and sublists
 * On desktop: Controls the visibility of dropdown sublists on hover and focus
 * @constructor
 * @param {object} selector - CSS selector for the nav component
 * @param {object} opts - Options, including base URLs
 */

var today = new Date();

var defaultOpts = {
  cmsUrl: 'http://localhost:8000',
  webAppUrl: 'http://localhost:3000',
  transitionUrl: 'https://transition.fec.gov',
  cycle: 2016,
  today: moment(today).format('MM/DD/YYYY'),
  tomorrow: moment(today).add(1, 'day').format('MM/DD/YYYY')
};

function SiteNav(selector, opts) {
  this.opts = _.extend({}, defaultOpts, opts);
  this.$body = $('body');
  this.$element = $(selector);
  this.$menu = this.$element.find('#site-menu');
  this.$toggle = this.$element.find('.js-nav-toggle');

  this.assignAria();

  this.initMenu();

  // Open and close the menu on mobile
  this.$toggle.on('click', this.toggleMenu.bind(this));
}

SiteNav.prototype.initMenu = function() {
  this.initMegaMenu();
};

SiteNav.prototype.initMegaMenu = function() {
  this.$element.find('[data-submenu]').each(function() {
    // Remove hrefs and default click behavior for links that have submenus
    $(this).find('.site-nav__link').attr('href', '#0').on('click', function(e) {
      e.preventDefault();
    });
  });

  this.$menu.accessibleMegaMenu({
    uuidPrefix: 'mega-menu',
    menuClass: 'site-nav__panel--main',
    topNavItemClass: 'site-nav__item',
    panelClass: 'mega-container',
    panelGroupClass: 'mega__group',
    hoverClass: 'is-hover',
    focusClass: 'is-focus',
    openClass: 'is-open',
    openDelay: 500,
    openOnClick: true,
    selectors: {
      topNavItems: '[data-submenu]'
    }
  });
};

SiteNav.prototype.assignAria = function() {
  this.$menu.attr('aria-label', 'Site-wide navigation');
  if (helpers.getWindowWidth() < helpers.BREAKPOINTS.LARGE) {
    this.$toggle.attr('aria-haspopup', true);
    this.$menu.attr('aria-hidden', true);
  }
};

SiteNav.prototype.toggleMenu = function() {
  var method = this.isOpen ? this.hideMenu : this.showMenu;
  method.apply(this);
};

SiteNav.prototype.showMenu = function() {
  this.$body.css({
    'overflow': 'hidden'
  });
  this.$element.addClass('is-open');
  this.$toggle.addClass('active');
  this.$menu.attr('aria-hidden', false);
  this.isOpen = true;
};

SiteNav.prototype.hideMenu = function() {
  this.$body.css({
    'overflow': 'auto'
  });
  this.$element.removeClass('is-open');
  this.$toggle.removeClass('active');
  this.$menu.attr('aria-hidden', true);
  this.isOpen = false;
  if (this.isMobile) {
    this.$element.find('[aria-hidden=false]').attr('aria-hidden', true);
  }
};

module.exports = {
  SiteNav: SiteNav
};
