'use strict';

var $ = require('jquery');
require('./vendor/tablist').init();

// Implementing a polyfill for js native WeakMap
// in order to patch functionality in an included library
require('es6-weak-map/implement');

var Accordion = require('aria-accordion').Accordion;
var Glossary = require('glossary-panel');

var terms = require('./data/terms');
var feedback = require('./modules/feedback');
var reaction = require('./modules/reaction-box');
var skipNav = require('./modules/skip-nav');
var siteNav = require('./modules/site-nav');
var dropdown = require('./modules/dropdowns');
var toc = require('./modules/toc');
var typeahead = require('./modules/typeahead');
var helpers = require('./modules/helpers');

// Hack: Append jQuery to `window` for use by legacy libraries
window.$ = window.jQuery = $;

var Sticky = require('component-sticky');
var FormNav = require('./modules/form-nav').FormNav;

// initialize a feedbackWidget which will be set after document is loaded.
var feedbackWidget = null;
// expose a global function for Recaptcha to invoke after the challenge is complete.
window.submitFeedback = function(token) {
  feedbackWidget.submit(token);
};

$(document).ready(function() {
  // Initialize glossary
  new Glossary(
    terms,
    {},
    {
      termClass: 'glossary__term accordion__button',
      definitionClass: 'glossary__definition accordion__content'
    }
  );

  // Initialize new accordions
  $('.js-accordion').each(function() {
    var contentPrefix = $(this).data('content-prefix') || 'accordion';
    var openFirst = $(this).data('open-first') || false;
    var selectors = {
      trigger: '.js-accordion-trigger'
    };
    var opts = {
      contentPrefix: contentPrefix,
      openFirst: openFirst
    };
    new Accordion(this, selectors, opts);
  });

  new skipNav.Skipnav('.skip-nav', 'main');
  new siteNav.SiteNav('.js-site-nav');

  // Initialize table of contents
  new toc.TOC('.js-toc');

  // Initialize sticky elements
  $('.js-sticky-side').each(function() {
    var container = $(this).data('sticky-container');
    var opts = {
      within: document.getElementById(container)
    };
    if (helpers.isLargeScreen()) {
      new Sticky(this, opts);
    }
  });

  // Initialize checkbox dropdowns
  $('.js-dropdown').each(function() {
    new dropdown.Dropdown(this);
  });

  // Don't show the feedback box on the 500 status page
  if (!$('body').hasClass('status-mode')) {
    // Initialize feedback widget
    feedbackWidget = new feedback.Feedback('/data/issue/');
  }

  $('.js-form-nav').each(function() {
    new FormNav(this);
  });

  // Initialize header typeaheads (mobile and desktop)
  $('.js-site-search').each(function() {
    new typeahead.Typeahead($(this), 'all', '/data/');
  });

  // For any link that should scroll to a section on the page apply .js-scroll to <a>
  $('.js-scroll').on('click', function(e) {
    e.preventDefault();
    var $link = $(e.target);
    var section = $link.attr('href');
    var sectionTop = $(section).offset().top;
    $('body, html').animate({
      scrollTop: sectionTop
    });
  });

  // Post feed
  // Move the read more links to be inline with the snippet from the post
  $('.js-post-content').each(function() {
    var $p = $(this).find('p:first-of-type');
    var $link = $(this).find('.js-read-more');
    if ($p.text() !== 'PDF') {
      $p.append($link);
    } else {
      $link.remove();
    }
    $p.nextAll().remove()
  });

  /**
 **************DONT FORGET TO EDIT THIS FOR HTML AND WAGTAIL !*********************
 * To implement a reaction box:
 * Add a reaction-box jinja macro to a template (use quoted strings for the name and location positional arguments)
 * Include a reference to this JS file in the parent template(preferably in extra JS block)
 * (The below function will use the name/location values of any
 *  reaction box on the page to initiate it as a new ReactionBox())
 */


  var reactionBoxes = document.querySelectorAll('.reaction-box');
  var names = [];
  for (var box of reactionBoxes) {
    
    var name = box.getAttribute('data-name');
    console.log('name: ',  name);
    var location = box.getAttribute('data-location');
    //push name to names array
    names.push(name);
    //inititailize new ReactionBox
    window[name] = new reaction.ReactionBox(
      `[data-name="${name}"][data-location="${location}"]`
    );
  }
  //use names array to define the submitReaction*() for each
  console.log('names: ',  names);
  names.forEach(function(nm) {
    window['submitReaction' + nm] = function(token) {
      window[nm].handleSubmit(token);
    };
    console.log('nm: ',nm)
  });

});


