'use strict';

var $ = require('jquery');
var helpers = require('./helpers');
const accessibility = require('./accessibility');

window.$ = window.jQuery = $;

require('accessible-mega-menu');

/** SiteNav module
 * On mobile: Controls the visibility of the the hamburger menu and sublists
 * On desktop: Controls the visibility of dropdown sublists on hover and focus
 * @constructor
 * @param {object} selector - CSS selector for the nav component
 * @param {object} opts - Options, including base URLs
 */

function SiteNav(selector) {
  this.$body = $('body');
  this.$element = $(selector);
  this.$menu = this.$element.find('#site-menu');
  this.$toggle = this.$element.find('.js-nav-toggle');
  this.$searchbox = this.$body.find('.utility-nav__search');

  this.assignAria();

  this.initMenu();

  // Open and close the menu on mobile
  this.$toggle.on('click', this.toggleMenu.bind(this));

  /*matchMedia is used belowto ensure searchbox is appended to correct location when 
  user resizes screen while mobile menu is open */

  //Define min-width media query that matches our med('mobile') breakpoint
  const mql = window.matchMedia('screen and (min-width: 860px)');
  // call listener function explicitly at run time
  this.mediaQueryResponse(mql);
  // attach listener function to listen for change in mediaQuery list
  mql.addListener(this.mediaQueryResponse);
}

SiteNav.prototype.initMenu = function() {
  this.initMegaMenu();
};

SiteNav.prototype.initMegaMenu = function() {
  this.$element.find('[data-submenu]').each(function() {
    // Remove hrefs and default click behavior for links that have submenus
    $(this)
      .find('.site-nav__link')
      .attr('href', '#0')
      .on('click', function(e) {
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
    accessibility.removeTabindex(this.$menu);
  }
};

//Append searchbox to correct location uponn user screen resize
SiteNav.prototype.mediaQueryResponse = function(mql) {
  //If large
  if (mql.matches) {
    $('body')
      .find('.utility-nav__search')
      .appendTo('.utility-nav.list--flat');
  }
  //if mobile
  else {
    $('body')
      .find('.utility-nav__search')
      .prependTo('.site-nav__panel');
    if ($('.js-site-nav').hasClass('is-open')) {
      accessibility.restoreTabindex($('.utility-nav__search'));
    } else {
      accessibility.removeTabindex($('.utility-nav__search'));
    }
  }
};

SiteNav.prototype.toggleMenu = function() {
  var method = this.isOpen ? this.hideMenu : this.showMenu;
  method.apply(this);
};

SiteNav.prototype.showMenu = function() {
  this.$body.css({
    overflow: 'hidden'
  });
  this.$element.addClass('is-open');
  this.$toggle.addClass('active');
  this.$menu.attr('aria-hidden', false);
  //append seacrh to mobile menu uponn opening
  $('.site-nav__panel').prepend(this.$searchbox);
  accessibility.restoreTabindex(this.$menu);

  this.isOpen = true;
};

SiteNav.prototype.hideMenu = function() {
  this.$body.css({
    overflow: 'auto'
  });
  this.$element.removeClass('is-open');
  this.$toggle.removeClass('active');
  this.$menu.attr('aria-hidden', true);
  //append search to header
  $('.utility-nav.list--flat').prepend(this.$searchbox);
  accessibility.removeTabindex(this.$menu);

  this.isOpen = false;
  if (this.isMobile) {
    this.$element.find('[aria-hidden=false]').attr('aria-hidden', true);
  }
};

module.exports = {
  SiteNav: SiteNav
};
