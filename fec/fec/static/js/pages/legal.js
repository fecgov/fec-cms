import FilterPanel from '../modules/filters/filter-panel.js';
import KeywordModal from '../modules/keyword-modal.js';

new FilterPanel();

if (document.querySelector('.js-keyword-modal')) {
  new KeywordModal();
}
