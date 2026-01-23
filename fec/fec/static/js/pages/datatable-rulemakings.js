/**
 * Rulemakings datatable page {@link /legal-resources/rulemakings}
 **/

import { default as URI } from 'urijs';

import { rulemakings as cols_rulemakings } from '../modules/columns.js';
//import { default as FilterPanel } from '../modules/filters/filter-panel.js';
import KeywordProximityFilter from '../modules/filters/keyword-proximity-filter.js';
import KeywordModal from '../modules/keyword-modal.js';
import { DataTable_FEC } from '../modules/tables.js';

/* eslint-disable no-console */

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

let new_val = $('input[name="q"]').val() || '';
const handleKeywordSearchChange = function() {
  console.log('handleKeywordSearchChang-RAN');
  //new_val = e.target.value;
  new_val = $('input[name="q"]').val() || '';
  const currentTag = document.querySelectorAll('.tags .tag__item[data-id="search-input"]');
  // If there's already a tag, we need to change its label
  if (currentTag.length >= 1) {
    currentTag.forEach((tag, i) => {
      // We only want to keep one filter tag for keywords, so change its label
      // but only if it has a value to show
      if (i === 0 && new_val.length > 0)
        $(tag).contents()[0].nodeValue = new_val;
      // Otherwise, if it's after the first one, click its X button
      else tag.querySelector('.js-close').click();
    });
  }
  else if (new_val.length > 0) {
    //Zero second, setTimout to push this to end of script stack to ensure '.tags' is loaded before appending to it for refresh or links with  q in querystring
    setTimeout(() => {
    $('.tags').attr('aria-hidden', 'false').append(`<li data-tag-category="q" class="tag__category"><div data-id="search-input" data-removable="true" class="tag__item">${new_val}
    <button class="button js-close tag__remove"><span class="u-visually-hidden">Remove</span></button>
    </div></li>`);
}, 0);

  }

  const new_queryParams = new URLSearchParams(window.location.search);

      // We need to divide any 'search' value into q and q_exclude, split on ` -`
      // And put q value into q field and q_excluse value into hidden q_exclude field
      const qStrings = [];
      const qExcludeStrings = [];
      if (new_val.indexOf(' -') >= 0) {
        const allTerms = new_val.split(' ');
        allTerms.forEach(term => {
          if (term.startsWith('-'))
            qExcludeStrings.push(term.substring(1));
          else qStrings.push(term);
        });
        if (qStrings.length > 0) {
          new_queryParams['q'] = qStrings.join(' ');
          $('input[name="q"]').val(new_queryParams['q']);
        }
        if (qExcludeStrings.length > 0) {
          new_queryParams['q_exclude'] = qExcludeStrings.join(' ');
          $('input[name="q_exclude"]').val(new_queryParams['q_exclude']);
        }

      }
      else {
        new_queryParams['q'] = new_val;
        //$('input[name="q"]').val(new_val);
      }
};

$('input[name="q"]').on('change', function(e) {
  console.log('handleKeywordSearchChange triggered');
  handleKeywordSearchChange(e);
 });

const params = new URLSearchParams(window.location.search);
const init_q_param = params.getAll('q');
 if (init_q_param.length > 0 && init_q_param[0]) {
     $('input[name="q"]').val(init_q_param).trigger('change');
     //handleKeywordSearchChange(e)
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

  //Accordions in highlights need this implicit listener to work becuase of conflict with accordions in filter panel
  $(document).on('click','.accordion-trigger-on', function() {
    let exp = $(this).attr('aria-expanded') == 'false' ? 'true' : 'false';
    $(this).attr('aria-expanded', exp);
    $(this).next('div').attr('aria-hidden', exp == 'true' ? 'false' : 'true');

  });

  $(document).on('click','[data-id="search-input"] .tag__remove', function() {
    const tag_params = new URLSearchParams(window.location.search);
    tag_params.delete('q');
    window.history.pushState(
                  null,
                  '',
                  window.location.pathname + `?${tag_params.toString()}`
                  );
  });

// TRIED TO PUT CHANGE EVENT ON FORM ELEMENTS, WORKS BUT THE PROBLEM IS THAT A PAGE RELOAD OR
// PASTE ANS GO TO A LINK FIRES NUMEROUS CHANGE EVENTS ON THE FORM.
// AND IT PUTS VALUE OF Q W/O Q_EXCLUDE I FIELD AND TAGS
//$(document).on('change', '#rulemaking-filters', function (event) {
// $(document).on('change', '#rulemaking-filters .js-filter input, #rulemaking-filters .js-filter select', function (event) {
//      event.stopImmediatePropagation();

//       const newQueryParams = new URLSearchParams(window.location.search);
//       const new_q_param = newQueryParams.get('q')
//       if (new_q_param) {

//         $('input[name="q"]').val(new_q_param ).triggerHandler('change')
//         //handleKeywordSearchChange(e)//; CAN'T GET e

//     }
// })

const $table = $('#results');
let tbl;

 tbl = new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Rulemakings',
    path: ['rulemaking', 'search'],
    columns: cols_rulemakings,
    order: [[2, 'desc']],
    useFilters: true,
    useExport: false,
    //filterPanel : new FilterPanel(),

    //preDrawCallback: function(settings) {
    preDrawCallback: function() {
      //console.log('filterSet.serialize()):', settings.oInit.filterPanel.filterSet.serialize())
      console.log('QVAL:', $('input[name="q_exclude"]').val());
      console.log('QXCLUDE:', $('input[name="q"]').val());

    },

    initComplete: function () {
      console.log('tbl.filterSet.serialize(): ' , tbl.filterSet.serialize());
    },

    // After separating q and q_exclude, and getting reults from API call, put the original keyword search query
    // back into keyword (q)field to preserve any frontend keyword search operator syntax should a user want to edit
    // the value directly in the field instead of using the modal form to generate ta new query.
    drawCallback: function () {
         //TODO: May just need 'if (new_val) {...'
            //const newer_queryParams = new URLSearchParams(window.location.search);
            //if (newer_queryParams.has('q')) {
              let query;
              if (new_val) {
                $('input[name="q"]').val(new_val);
                $('input[name="q_exclude"]').val('');
                query = URI(window.location.search)
                .removeSearch('q')
                .removeSearch('q_exclude')//, `${newer_queryParams['q_exclude']}`)
                .addSearch('q', new_val);
                console.log('QUERY1: ', query.toString());

              }
              else {
                console.log('new_val2:', new_val);
                query = URI(window.location.search);
                // .removeSearch('q')
                // .addSearch('q', new_val);//.removeSearch('q')
                console.log('QUERY2: ', query.toString());
              }

              window.history.pushState(
                  null,
                  '',
                  window.location.pathname + query.toString()
                );
            //}
          }

      });

});
