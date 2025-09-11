/**
 * Rulemakings datatable page {@link //}
 * ---------------------
 *
 */
import { default as URI } from 'urijs';

import { rulemakings as cols_rulemakings } from '../modules/columns.js';
import KeywordModal from '../modules/keyword-modal.js';
import { DataTable_FEC } from '../modules/tables.js';
// import { DataTable_FEC, OffsetPaginator, SeekPaginator, modalRenderFactory, modalRenderRow } from '../modules/tables.js';
// import { default as Filter } from '../modules/filters/filter-base.js';
// import { default as FilterPanel } from '../modules/filters/filter-panel.js';
// import { default as TagList } from '../modules/filters/filter-tags.js';
// import { updateQuery } from '../modules/urls.js';
//import { default as KeywordModal } from '../legal.js';

$(function() {
const params = new URLSearchParams(window.location.search);
let docs = params.getAll('doc_category_id');
let q_query = params.get('q');
console.log('q_query:', q_query); // eslint-disable-line no-console
console.log('DOCK IDS:', docs); // eslint-disable-line no-console

 if (params.q) {
     $('input[name="q"]').val(params.q);//.trigger('change')
  }

//  NOTE TO SELF:
// search_input fires handleKeywordSearchChange on change with no page reload
// keyword_modal fires keyworkModal.handleSubmit() on click of button with page reload

//Override KeywordModal.prototype.handleSubmit to look use 'q' parameter instead of 'search' parameter
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
 // $('input[name="q"]').val(searchQuery)
//   setTimeout(function() {
//   handleKeywordSearchChange(e)
// }, 2000);
  //handleKeywordSearchChange(e)
  //.trigger('change')
  //$('#search-input').trigger('change')
 $('input[name="q"]').val(searchQuery).trigger('change');

  //window.location = this.$form.attr('action') + query.toString();

  // window.history.pushState(
  //   null,
  //   '',
  //   window.location.pathname + query.toString()
  //   );

};

 if (document.querySelector('.js-keyword-modal')) {
    new KeywordModal();
    //const keyWordModal = new KeywordModal();
  }

//change type to button to stop reload - not working to handleSubmit() though
 $('.modal__form [type="submit"]').attr('type', 'button');

//This attempt does not work to keep it from reloading page or handle submit
// $('.modal__form button').on('click', function () {
//     KeywordModal.handleSubmit()
// });

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
   //TODO: just use newVal
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

   // window.history.replaceState(
  window.history.pushState(
      null,
      '',
      window.location.pathname + query.toString()
      );
};

  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Rulemakings',
    path: ['rulemaking', 'search'],
    columns: cols_rulemakings,
    //query: { sort: '-rm_no'},
    //orderFixed: {
    //         pre: [2, 'asc'], // Always sort by column 2 ascending first
    //         post: [[0, 'desc']] // Always sort by column 0 descending last
    //     },
    //aaSorting: [[ 2, 'asc' ]],
    order: [[0, 'desc']],
    useFilters: true,
    useExport: true,
    // rowCallback: modalRenderRow,
    // callbacks: {
    //   afterRender: modalRenderFactory(loansTemplate)
    // }

    // Add tag for keyword modal boolean after page reload
    initComplete: function () {
       const queryParams = URI.parseQuery(window.location.search);
      if (queryParams.q) {
        //tagList.addTag(null, { key: 'search-input', name: 'q', value: queryParams.q });
        $('input[name="q"]').val(queryParams.q);//.css('background','#f90')
        $('#search_input').val(queryParams.q);
        $('.tags').attr('aria-hidden', 'false').append(`<li data-tag-category="q" class="tag__category"><div data-id="search-input" data-removable="true" class="tag__item">${queryParams.q}
          <button class="button js-close tag__remove"><span class="u-visually-hidden">Remove</span></button>
          </div></li>`);
      }
      console.log('INIT'); // eslint-disable-line no-console
    }
  });

});
