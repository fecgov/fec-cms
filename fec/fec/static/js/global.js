/**
 * Scripts used on every page of the site e.g. main nav, search, feedback
 */
import Glossary from 'glossary-panel/src/glossary.js';

import { default as A11yDialog } from 'a11y-dialog';
import { default as terms } from './data/terms.json' assert { type: 'json' };
import Feedback from './modules/feedback.js';
import SiteNav from './modules/site-nav.js';
import Skipnav from './modules/skip-nav.js';
import TOC from './modules/toc.js';
import Typeahead from './modules/typeahead.js';

$(function() {
  /**
   * Glossary and "Table of Contents"
   */
  new Glossary(
    terms,
    {},
    {
      termClass: 'glossary__term accordion__button',
      definitionClass: 'glossary__definition accordion__content'
    }
  );
  new TOC('.js-toc');

  /**
   * Skip-nav link
   */
  new Skipnav('.skip-nav', 'main');

  /**
   * Site header
   */
  new SiteNav('.js-site-nav');

  /**
   * Site/header text search
   */
  // Initialize header Typeahead
  $('.js-site-search').each(function() {
    new Typeahead($(this), 'all', '/data/');
  });
  // Initialize main search Typeahead
  if (document.querySelector('.js-search-input')) new Typeahead('.js-search-input', 'allData', '/data/');

  /**
   * Feedback widget
   */
  let feedbackWidget = null;
  if (!$('body').hasClass('status-mode')) {
    // Don't show the feedback box on the 500 status page (if there's no 'status-mode' class on the body)
    feedbackWidget = new Feedback('/data/issue/');
  }
  // Expose a global function for Recaptcha to invoke after the challenge is complete.
  window.submitFeedback = function(token) {
    feedbackWidget.submit(token);
  };

  $('.js-modal').each(function() {
    new A11yDialog(this);
    this.addEventListener('dialog:show', function() {
      $('body').css('overflow', 'hidden');
      });
    this.addEventListener('dialog:hide', function() {
      $('body').css('overflow', 'scroll');
      });
    });
});
