import FilterPanel from '../modules/filters/filter-panel.js';
import KeywordModal from '../modules/keyword-modal.js';
import initRegulationHistory from '../modules/regulation-history.js';
import loadRegulationRelated from '../modules/regulation-related.js';
import initRegulationSearchMethods from '../modules/regulation-search-methods.js';

new FilterPanel();

if (document.querySelector('.js-keyword-modal')) {
  new KeywordModal();
}

if (document.getElementById('results-regulations')) {
  document.querySelectorAll('[data-regulation-related-url]').forEach(loadRegulationRelated);
  document.querySelectorAll('[data-regulation-history]').forEach(initRegulationHistory);
  document.querySelectorAll('[data-regulation-search-methods]').forEach(initRegulationSearchMethods);
}
