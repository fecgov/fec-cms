import FilterPanel from '../modules/filters/filter-panel.js';
import KeywordModal from '../modules/keyword-modal.js';
import loadRegulationRelated from '../modules/regulation-related.js';

new FilterPanel();

if (document.querySelector('.js-keyword-modal')) {
  new KeywordModal();
}

if (document.getElementById('results-regulations')) {
  const form = document.getElementById('category-filters');
  // Wait for the typeahead to add the selected citation to the form.
  $(document).on('typeahead:selected', '#regulatory_citation', function() {
    window.setTimeout(() => form.requestSubmit(), 0);
  });
  $(document.body).on('filter:removed', function(event, options) {
    if (options && options.name === 'regulatory_citation') form.requestSubmit();
  });
  document.querySelectorAll('[data-regulation-related-url]').forEach(loadRegulationRelated);
}
