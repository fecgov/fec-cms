/**
 * Rulemakings datatable page {@link /legal-resources/rulemakings}
 **/

import { default as URI } from 'urijs';

import { rulemakings as cols_rulemakings } from '../modules/columns.js';
import KeywordProximityFilter from '../modules/filters/keyword-proximity-filter.js';
import KeywordModal from '../modules/keyword-modal.js';
import { DataTable_FEC } from '../modules/tables.js';

$(function() {

// Search_input change fires handleKeywordSearchChange() on change, with no page reload
// Keyword_modal search_input submit fires keyworkModal.handleSubmit() which fires handleKeywordSearchChange(), with no reload

//Override KeywordModal.prototype.handleSubmit to use 'q' parameter instead of 'search' parameter and not reload page
KeywordModal.prototype.handleSubmit = function(e) {
  e.preventDefault();
  const searchQuery = this.generateQueryString();
  this.dialog.hide();
  // Event record for GTM
  this.fireEvent('Keyword modal query: ' + searchQuery);

  // Put value in field and trigger handleKeywordSearchChange()
  $('input[name="q"]').val(searchQuery).trigger('change');

};

if (document.querySelector('.js-keyword-modal')) {
  new KeywordModal();
}

const validationStates = {
  empty: 'EMPTY',
  incomplete: 'INCOMPLETE',
  valid: 'VALID'
};

// Override the original handleNumberChange to add a change event on $keyword0 to force it to recognize changed max_gaps
KeywordProximityFilter.prototype.handleNumberChange = function(e) {
  if (e && !$(e.target).data('loaded-once')){
    this.handleInputChange(e);
  }
  else {
    if (!e) {
      this.handleInputChange({ target: this.$maxGaps.get(0) });
      if (this.validationState == validationStates.valid) {
        // Force the change event
        this.bubbleTheChangeEvent();
      }
    } else {
      e.stopPropagation();
      if (this.validationState == validationStates.valid) {
        this.waitForMaxGapsChanges();
      }
    }
  }
  this.$keyword0.trigger('change');
};

// Change type to button to disable native submit
$('.modal__form [type="submit"]').attr('type', 'button');

// Stores the original keyword query (including any exclude terms like " -word")
// This is used to restore the full query to the text field after API calls
let new_val = $('input[name="q"]').val() || '';

// Handles keyword search field changes - updates tags and stores original value
// Actual splitting of q/q_exclude happens in splitQExclude before API call
const handleKeywordSearchChange = function() {
  const currentQ = $('input[name="q"]').val() || '';
  // Only update new_val if current value has exclude terms, or if new_val doesn't already have them
  if (currentQ.indexOf(' -') >= 0 || new_val.indexOf(' -') < 0) {
    new_val = currentQ;
  }

  const displayVal = new_val || currentQ;
  const currentTag = document.querySelectorAll('.tags .tag__item[data-id="search-input"]');

  if (currentTag.length >= 1) {
    // Update existing tag label
    currentTag.forEach((tag, i) => {
      if (i === 0 && displayVal.length > 0) {
        $(tag).contents()[0].nodeValue = displayVal;
      } else {
        tag.querySelector('.js-close').click();
      }
    });
  } else if (displayVal.length > 0) {
    // Create new tag - setTimeout ensures .tags element is loaded
    setTimeout(() => {
      $('.tags').attr('aria-hidden', 'false').append(
        `<li data-tag-category="q" class="tag__category">` +
        `<div data-id="search-input" data-removable="true" class="tag__item">${displayVal}` +
        `<button class="button js-close tag__remove"><span class="u-visually-hidden">Remove</span></button>` +
        `</div></li>`
      );
    }, 0);
  }
};

$('input[name="q"]').on('change', function(e) {
  handleKeywordSearchChange(e);
});

// Initialize q field from URL parameters on page load
const params = new URLSearchParams(window.location.search);
const init_q_param = params.getAll('q');
if (init_q_param.length > 0 && init_q_param[0]) {
  $('input[name="q"]').val(init_q_param).trigger('change');
}
// Remove max-gaps value from field and querystring upon tag removal
$(document).on('click', '.js-close.tag__remove[data-filter-id="keyword-proximity"]', function() {
   $('input[name="max_gaps"]').attr('placeholder','0').val('');
});

// Add a null submit button at the top of the form to prevent Enter submits
const rulemakingFiltersFormElement = document.querySelector('#rulemaking-filters');
const submitBlocker = document.createElement('input');
submitBlocker.setAttribute('type', 'submit');
submitBlocker.setAttribute('disabled', 'disabled');
submitBlocker.setAttribute('style', 'display:none');
submitBlocker.setAttribute('aria-hidden', 'true');
rulemakingFiltersFormElement.prepend(submitBlocker);

// Accordions in highlights need this implicit listener due to conflict with filter panel accordions
$(document).on('click', '.accordion-trigger-on', function() {
  const exp = $(this).attr('aria-expanded') === 'false' ? 'true' : 'false';
  $(this).attr('aria-expanded', exp);
  $(this).next('div').attr('aria-hidden', exp === 'true' ? 'false' : 'true');
});

// Handle removal of keyword search tag
$(document).on('click', '[data-id="search-input"] .tag__remove', function() {
  const tag_params = new URLSearchParams(window.location.search);
  tag_params.delete('q');
  window.history.pushState(null, '', window.location.pathname + `?${tag_params.toString()}`);
});

/**
 * Splits the keyword query into positive terms (q) and exclude terms (q_exclude).
 * Called before DataTable serializes filters to ensure correct API parameters.
 *
 * Example: "contribution -limit" becomes q="contribution" and q_exclude="limit"
 *
 * @param {boolean} isQFieldChange - true if user directly changed the q field
 */
const splitQExclude = function(isQFieldChange = false) {
  const fieldVal = $('input[name="q"]').val() || '';
  let currentQ = fieldVal;

  if (isQFieldChange) {
    // User directly changed q field - use the new value
    new_val = fieldVal;
    currentQ = fieldVal;
  } else if (new_val && new_val.indexOf(' -') >= 0) {
    // User changed a different filter - check if we should use stored new_val
    const positiveTerms = new_val.split(' ').filter(t => !t.startsWith('-')).join(' ');
    if (fieldVal === positiveTerms || fieldVal === new_val) {
      // Field matches expected value after splitting, use stored original
      currentQ = new_val;
    } else {
      // Field has unexpected value (user changed it), use the new value
      new_val = fieldVal;
    }
  }

  if (currentQ.indexOf(' -') >= 0) {
    // Split into positive and negative terms
    new_val = currentQ;
    const qStrings = [];
    const qExcludeStrings = [];
    currentQ.split(' ').forEach(term => {
      if (term.startsWith('-')) {
        qExcludeStrings.push(term.substring(1));
      } else if (term) {
        qStrings.push(term);
      }
    });

    if (qStrings.length > 0) {
      $('input[name="q"]').val(qStrings.join(' '));
    }
    if (qExcludeStrings.length > 0) {
      $('input[name="q_exclude"]').val(qExcludeStrings.join(' '));
    }
  } else {
    // No exclude terms, clear q_exclude
    $('input[name="q_exclude"]').val('');
  }
};

// Intercept ALL filter changes to split q/q_exclude BEFORE DataTable processes them
// Use native capture phase to ensure this runs before jQuery/DataTable handlers
document.querySelector('#rulemaking-filters').addEventListener('change', function(e) {
  // Don't process if this is the q_exclude field itself
  if (e.target.name === 'q_exclude') return;

  // If the change is on the q field itself, user is changing the query - update new_val
  const isQFieldChange = (e.target.name === 'q');

  // Split q value before DataTable serializes filters
  splitQExclude(isQFieldChange);
}, true); // capture phase runs before bubble phase

const $table = $('#results');

new DataTable_FEC($table, {
  autoWidth: false,
  title: 'Rulemakings',
  path: ['rulemaking', 'search'],
  columns: cols_rulemakings,
  order: [[2, 'desc']],
  useFilters: true,
  useExport: false,

  // After API call, restore the original keyword query (with exclude terms) to the text field
  // This preserves the user's input syntax for editing
  drawCallback: function() {
    let query;
    if (new_val) {
      $('input[name="q"]').val(new_val);
      $('input[name="q_exclude"]').val('');
      query = URI(window.location.search)
        .removeSearch('q')
        .removeSearch('q_exclude')
        .addSearch('q', new_val);
    } else {
      query = URI(window.location.search);
    }

    window.history.pushState(null, '', window.location.pathname + query.toString());
  }
});

});
