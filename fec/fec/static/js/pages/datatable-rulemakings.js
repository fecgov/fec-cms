/**
 * Rulemakings datatable page {@link /legal-resources/rulemakings}
 **/

import { default as URI } from 'urijs';

import { rulemakings as cols_rulemakings } from '../modules/columns.js';
import KeywordProximityFilter from '../modules/filters/keyword-proximity-filter.js';
import KeywordModal from '../modules/keyword-modal.js';
import { DataTable_FEC } from '../modules/tables.js';

$(function() {
const params = new URLSearchParams(window.location.search);
let docs = params.getAll('doc_category_id');
let q_query = params.get('q');
console.log('q_query:', q_query); // eslint-disable-line no-console
console.log('DOCK IDS:', docs); // eslint-disable-line no-console

 if (params.q) {
     $('input[name="q"]').val(params.q);//.trigger('change')
  }

// search_input change fires handleKeywordSearchChange on change with no page reload
// keyword_modal search_input submit fires keyworkModal.handleSubmit() which fires handleKeywordSearchChange() with no reload

//Override KeywordModal.prototype.handleSubmit to use 'q' parameter instead of 'search' parameter and not reload page
KeywordModal.prototype.handleSubmit = function(e) {
  e.preventDefault();
  const searchQuery = this.generateQueryString();
  let query = URI(window.location.search)
    .removeSearch('q')
    .addSearch('q', searchQuery);
  this.dialog.hide();
  // Event record for GTM
  this.fireEvent('Keyword modal query: ' + searchQuery);
  console.log('query', query); // eslint-disable-line no-console

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

// Hack - Override the original handleNumberChange to add a change event on $keyword0 to force it to recognize changed max_gaps
KeywordProximityFilter.prototype.handleNumberChange = function(e) {
  console.log('RAN handleNumberChange NEW' ); // eslint-disable-line no-console
  //console.log("e.target).data('loaded-once')", $(e.target).data('loaded-once')); // eslint-disable-line no-console
  if (e && !$(e.target).data('loaded-once')){
    this.handleInputChange(e);
  }
  else {
    if (!e) {
      this.handleInputChange({ target: this.$maxGaps.get(0) });
      if (this.validationState == validationStates.valid) {
        console.log('RAN TWO NEW'); // eslint-disable-line no-console
        // Force the change event
        this.bubbleTheChangeEvent();
      }
    } else {
      e.stopPropagation();
      if (this.validationState == validationStates.valid) {
         console.log('RAN THREE NEW'); // eslint-disable-line no-console
        this.waitForMaxGapsChanges();
      }
    }
  }
  this.$keyword0.trigger('change');
};

$('#category-filters').on('change', function() {
 console.log('FORM CHANGED'); // eslint-disable-line no-console

});

// Change type to button to disable native submit
 $('.modal__form [type="submit"]').attr('type', 'button');

 //Need better way to solve this, does not happen on other datatables. Problem: Selected items in checkbox dropdown submit form when clicked
$(document).on('click', '.dropdown__item--selected.is-checked', function(e) {
  return false
})

   $('#search-input').on('change', function(e) {
       console.log('RAN on(change)'); // eslint-disable-line no-console
       handleKeywordSearchChange(e);
   });

  const handleKeywordSearchChange = function(e) {
  const newVal = e.target.value;
  const currentTag = document.querySelectorAll('.tags .tag__item[data-id="search-input"]');
  console.log('RAN handleKeywordSearchChange'); // eslint-disable-line no-console
  // If there's already a tag, we need to change its label
  if (currentTag.length >= 1) {
    currentTag.forEach((tag, i) => {
      // We only want to keep one filter tag for keywords, so change its label
      // but only if it has a value to show
      if (i === 0 && newVal.length > 0)
        $(tag).contents()[0].nodeValue = newVal;
      // Otherwise, if it's after the first one, click its X button
      else tag.querySelector('.js-close').click();
    });
  }
  else {
    $('.tags').attr('aria-hidden', 'false').append(`<li data-tag-category="q" class="tag__category"><div data-id="search-input" data-removable="true" class="tag__item">${newVal}
    <button class="button js-close tag__remove"><span class="u-visually-hidden">Remove</span></button>
    </div></li>`);
  }

   let query;
   //TODO: just use newVal?
   const searchQuery = $('input[name="q"]').val();
   if (newVal != '') {
    query = URI(window.location.search)
    .removeSearch('q')
    .addSearch('q', searchQuery);
   }
   else {
    query = URI(window.location.search)
     .removeSearch('q');
   }

  //window.history.replaceState(
  window.history.pushState(
      null,
      '',
      window.location.pathname + query.toString()
      );
};

// TODO:Add comment
$(document).on('click', '.js-close.tag__remove[data-filter-id="keyword-proximity"]', function() {
   $('input[name="max_gaps"]').attr('placeholder','0').val('');
});

  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Rulemakings',
    path: ['rulemaking', 'search'],
    columns: cols_rulemakings,
    order: [[0, 'desc']],
    useFilters: true,
    useExport: false,
    // Initiate the field value and fire change for keyword if included in querystring in a link or copy/pasted url
    // TODO: DO I NEED THIS AT ALL?, ALSO - If so Don't think I need to also add tags here(commented out)...ends up with two tags once I added trigger('change')
    initComplete: function () {
       const queryParams = URI.parseQuery(window.location.search);
      if (queryParams.q) {
        $('input[name="q"]').val(queryParams.q).trigger('change');
        //$('#search_input').val(queryParams.q).trigger('change');
        // $('.tags').attr('aria-hidden', 'false').append(`<li data-tag-category="q" class="tag__category"><div data-id="search-input" data-removable="true" class="tag__item">${queryParams.q}
        //   <button class="button js-close tag__remove"><span class="u-visually-hidden">Remove</span></button>
        //   </div></li>`);
      }

      // Temporrily verify page load/reload or not
      console.log('INIT'); // eslint-disable-line no-console

    }
  });

});
