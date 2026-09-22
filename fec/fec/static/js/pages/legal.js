import FilterPanel from '../modules/filters/filter-panel.js';
import KeywordModal from '../modules/keyword-modal.js';
import loadRegulationRelated from '../modules/regulation-related.js';

new FilterPanel();

if (document.querySelector('.js-keyword-modal')) {
  new KeywordModal();
}

if (document.getElementById('results-regulations')) {
  document.querySelectorAll('[data-regulation-related-url]').forEach(loadRegulationRelated);
}
