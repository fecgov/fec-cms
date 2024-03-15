// Implementing a polyfill for js native WeakMap
// in order to patch functionality in an included library
// require('es6-weak-map/implement');

import { Sticky } from 'component-sticky';
import { Accordion } from 'aria-accordion/src/accordion.js';
import { default as A11yDialog } from 'a11y-dialog';

// Hack: Append jQuery to `window` for use by legacy libraries
// window.$ = window.jQuery = $;

import Dropdown from './modules/dropdowns.js';
import { default as Search } from './modules/search.js';

// Include vendor scripts
import { init as tablistInit } from './vendor/tablist.js';
tablistInit();

import { init as toggleInit } from './modules/toggle.js';
import { hydrate as downloadHydrate } from './modules/download.js';
import { default as CycleSelect } from './modules/cycle-select.js';

$(document).ready(function() {
  $('.js-dropdown').each(function() {
    new Dropdown(this);
  });

  // Initialize stick side elements
  $('.js-sticky-side').each(function() {
    var container = $(this).data('sticky-container');
    var opts = {
      within: document.getElementById(container)
    };
    new Sticky(this, opts);
  });

  // Until we can re-configure the modal windows used with the filters panel,
  // let's re-parent #version-methodology-modal_processed and
  // #version-methodology-modal_raw to <body> so their positioning
  // aren't stuck inside the rules for .filters__content (position: relative, top: 0, left: 0)
  $('#version-methodology-modal_processed, #version-methodology-modal_raw')
    .detach()
    .appendTo('body');


  // Initialize new accordions
  $('.js-accordion').each(function() {
    var contentPrefix = $(this).data('content-prefix') || 'accordion';
    var openFirst = $(this).data('open-first');
    var selectors = {
      trigger: '.js-accordion-trigger'
    };
    var opts = {
      contentPrefix: contentPrefix,
      openFirst: openFirst,
      collapseOthers:
        window.location.href.indexOf('president/presidential-map') > 0
          ? true
          : false,
      customHiding:
        window.location.href.indexOf('president/presidential-map') > 0
          ? true
          : false
    };
    new Accordion(this, selectors, opts);
  });

  // Initialize search
  $('.js-search').each(function() {
    new Search($(this));
  });

  $('.js-modal').each(function() {
    new A11yDialog(this);
    this.addEventListener('dialog:show', function(e) {
      $('body').css('overflow', 'hidden');
    });
    this.addEventListener('dialog:hide', function(e) {
      $('body').css('overflow', 'scroll');
    });
  });

  // TODO: Restore
  // @if DEBUG
  // var perf = require('./modules/performance');
  // perf.bar();
  // @endif

  // Initialize cycle selects
  $('.js-cycle').each(function(idx, elm) {
    CycleSelect.build($(elm));
  });

  toggleInit();
  downloadHydrate();
});
