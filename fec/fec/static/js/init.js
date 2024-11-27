/**
 * Initializes things common to many pages, but not universal (the truly universal are inside global.js)
 * If present, this file initializes…
 * .js-dropdown, .js-form-nav, .js-post-content, .js-scroll, .js-sticky-side
 */

import { default as Sticky } from 'component-sticky/index.js';

import Dropdown from './modules/dropdowns.js';
import FormNav from './modules/form-nav.js';
import { isLargeScreen } from './modules/helpers.js';
import { init as tablistInit } from './vendor/tablist.js';

import './modules/calc-admin-fines-modal.js';

tablistInit();

$(function() {
  // Initialize sticky elements
  $('.js-sticky-side').each(function() {
    const container = $(this).data('sticky-container');
    const opts = {
      within: document.getElementById(container)
    };
    if (isLargeScreen()) {
      new Sticky(this, opts);
    }
  });

  // Initialize checkbox dropdowns
  $('.js-dropdown').each(function() {
    new Dropdown(this);
  });

  $('.js-form-nav').each(function() {
    new FormNav(this);
  });

  // For any link that should scroll to a section on the page apply .js-scroll to <a>
  $('.js-scroll').on('click', function(e) {
    e.preventDefault();
    const $link = $(e.target);
    const section = $link.attr('href');
    const sectionTop = $(section).offset().top;
    $('body, html').animate({
      scrollTop: sectionTop
    });
  });

  // Post feed
  // Move the read more links to be inline with the snippet from the post
  $('.js-post-content').each(function() {
    const $p = $(this).find('p:first-of-type');
    const $link = $(this).find('.js-read-more');
    if ($p.text() !== 'PDF') {
      $p.append($link);
    } else {
      $link.remove();
    }
    $p.nextAll().remove();
  });
});
