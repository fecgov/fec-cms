// Implementing a polyfill for js native WeakMap
// in order to patch functionality in an included library
// require('es6-weak-map/implement');
import { default as A11yDialog } from 'a11y-dialog';
import { Accordion } from 'aria-accordion/src/accordion.js';
import { default as Sticky } from 'component-sticky/index.js';

import CycleSelect from './modules/cycle-select.js';
import { hydrate as downloadHydrate } from './modules/download.js';
import Dropdown from './modules/dropdowns.js';
import Search from './modules/search.js';
import { default as initToggles } from './modules/toggle.js';
import { init as initTablist } from './vendor/tablist.js';

// Hack: Append jQuery to `window` for use by legacy libraries
// window.$ = window.jQuery = $;

initTablist();

$(function() {
  $('.js-dropdown').each(function() {
    new Dropdown(this);
  });

  // Initialize stick side elements
  $('.js-sticky-side').each(function() {
    const container = $(this).data('sticky-container');
    const opts = {
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
    const contentPrefix = $(this).data('content-prefix') || 'accordion';
    const openFirst = $(this).data('open-first');
    const reflectStatic = $(this).data('reflect-static');
    const selectors = {
      trigger: '.js-accordion-trigger'
    };
    const opts = {
      contentPrefix: contentPrefix,
      openFirst: openFirst,
      reflectStatic: reflectStatic,
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

  // Initialize cycle selects
  $('.js-cycle').each(function(idx, elm) {
    CycleSelect.build($(elm));
  });

  initToggles();
  downloadHydrate();
});
