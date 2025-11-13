/**
 * Rulemakings datatable page {@link /legal-resources/rulemakings}
 **/

import { default as URI } from 'urijs';

import { murs as cols_murs } from '../modules/columns.js';
import KeywordProximityFilter from '../modules/filters/keyword-proximity-filter.js';
import KeywordModal from '../modules/keyword-modal.js';
import { DataTable_FEC } from '../modules/tables.js';

$(function() {
const params = new URLSearchParams(window.location.search);

 if (params.q) {
     $('input[name="q"]').val(params.q);
  }

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

$('#search-input').on('change', function(e) {
  handleKeywordSearchChange(e);
 });

  const handleKeywordSearchChange = function(e) {
  const newVal = e.target.value;
  const currentTag = document.querySelectorAll('.tags .tag__item[data-id="search-input"]');
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
   if (newVal != '') {
    query = URI(window.location.search)
    .removeSearch('q')
    .addSearch('q', newVal);
   }
   else {
    query = URI(window.location.search)
     .removeSearch('q');
   }

  window.history.pushState(
      null,
      '',
      window.location.pathname + query.toString()
      );
};

// Remove max-gaps value from field and querystring upon tag removal
$(document).on('click', '.js-close.tag__remove[data-filter-id="keyword-proximity"]', function() {
   $('input[name="max_gaps"]').attr('placeholder','0').val('');
});

 // Add a null submit button at the top of the form to prevent Enter submits
  const mursFiltersFormElement = document.querySelector('#murs-filters');
  const submitBlocker = document.createElement('input');
  submitBlocker.setAttribute('type', 'submit');
  submitBlocker.setAttribute('disabled', 'disabled');
  submitBlocker.setAttribute('style', 'display:none');
  submitBlocker.setAttribute('aria-hidden', 'true');
  mursFiltersFormElement.prepend(submitBlocker);

  const get_subject_ids = function(type) {
    const params = new URLSearchParams(window.location.search);
    let ids = params.getAll(`${type}_subject_id`) || [];
    return ids
  };
    // JS for subject MUR/ADR selects
      // The window.context is declared in datatable.jinja
     if (window.context) {
        //TO DO: Find another way to NOT use "var" so this variable is available in scope below
        var secondary_subject_ids = window.context.secondary_subject_ids || [];
        }
        const primary_subject_id = get_subject_ids('primary');
        const secondary_subject_id = get_subject_ids('secondary');
      
        const subject_select = document.getElementById('primary_subject_id');
        const secondary_select_div = document.querySelector("[data-modifies-filter='secondary_subject_id']");
        const secondary_select = document.getElementById('secondary_subject_id');

        // Populate secondary select on page load
        load_secondary_select(primary_subject_id);
        
        // Add aria attribute to selected option in primary select
        Array.from(subject_select.options).forEach(option => {
          if (option.value == primary_subject_id) option.setAttribute('aria-selected', 'true');
        });

        // Load secondary select, upon change of primary select
        subject_select.addEventListener('change', event => {
          const selected_id = event.target.value;
          load_secondary_select(selected_id);
          $(secondary_select).val('').trigger('change')
        });

        function load_secondary_select(id) {
          // First, reset the secondary select to default
          secondary_select.replaceChildren(new Option('All', "", true, true));
          // Show and populate secondary select options, if applicable
          if (id in secondary_subject_ids) {
            // Show secondary select
            secondary_select_div.style.display = 'block';
            // Append secondary select options
            for (const [key, value] of Object.entries(secondary_subject_ids[id])) {
              //If there is a current secondary_subject_id, append it as the selected option
              if (key == secondary_subject_id) {
                secondary_select.append(new Option(value, key, true, true));
                // Add aria-selected to that option
                secondary_select.options[secondary_select.selectedIndex].setAttribute('aria-selected', 'true');
              // Append other options, unselected
              } else {
                secondary_select.append(new Option(value, key));
              };
            };

          } else {
            secondary_select_div.style.display = 'none';
          };
        };

    //Accordions in highlights need this implicit listener to work becuase of conflict eith accordions in filter panel
    $(document).on('click','.accordion-trigger-on',  function(e){ 
      let exp = $(this).attr('aria-expanded') == 'false' ? 'true' : 'false'
      $(this).attr('aria-expanded', exp)
      //let hid = $(this).next('div').attr('aria-hidden') == 'true' ? 'false' : 'false'
      $(this).next('div').attr('aria-hidden', exp == 'true' ? 'false' : 'true')

    })

   
  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Closed Matters Under Review',
    path: ['legal', 'search'],
    query: { type: "murs", doc_type: "murs" },
    columns: cols_murs,
    order: [[0, 'desc']],
    useFilters: true,
    useExport: false,
    // Initiate the field value and fire change for keyword if included in querystring in a link or copy/pasted url
    // TODO: DO I NEED THIS AT ALL?, ALSO - If so Don't think I need to also add tags here(commented out)...Updated comment...No, it ends up with two tags once I added trigger('change')
    initComplete: function () {
       const queryParams = URI.parseQuery(window.location.search);
      if (queryParams.q) {
        $('input[name="q"]').val(queryParams.q).trigger('change');
      }
      // TODO: Below is a temporary hack to force initial hits_returned to be 30 insted of the default 20. 
      // If we go with this table, have backend team switch default in api code to 30 if possible just for MURs.
      $('#results-length').trigger('change');
    },
//     "drawCallback": function() {
//    }
  });

});
