/**
 * Initial (likely temporary) class
 */

import { default as URI } from 'urijs';

import { default as FilterPanel } from './modules/filters/filter-panel.js';
import { default as TagList } from './modules/filters/filter-tags.js';
import { buildUrl, SUCCESS_DELAY } from './modules/helpers.js';
import KeywordModal from './modules/keyword-modal.js';
import { updateQuery } from './modules/urls.js';
import { Accordion } from 'aria-accordion';

/**
 * @property {FilterPanel} this.filterPanel - The left column's filters panel element
 * @property {HTMLElement} this.resultsTable - The table of results
 * @property {HTMLElement} this.paginationElements - The <div>s that hold the pagination
 * @property {HTMLElement} this.noResultsMessage - The <div> to toggle to show or hide the 'no results' message
 * @property {HTMLElement} widgetsElement - The <div> that holds the header filter tags and message
 * @property {boolean} this.isLoading - Controls appearance and behavior of elements on the screen
 * @property {number} this.debounceTimer - The number for the debouncing setTimeout
 * @property {number} this.messageTimer - The number for the "filter added/removed" fade-outs
 * @property {number} this.lastQuery - The most recent query results
 * @property {string} this.lastFilterId - The last filter ID that was changed by the user
 */
export default function LegalSearchAo() {
  this.debounceTimer;
  this.filterPanel;
  this.isLoading = false;
  this.lastQueryResponse = {};
  this.noResultsMessage;
  this.paginationElements;
  this.resultsTable;
  this.sortOrder;
  this.sortType;
  this.tagList;

  // Get sortOrder and sortType from request.get('sort') in the view.
  // To preserve sortOrder/Type when paginating or when pasting/visiting a url that already has sort parameter
  if (window.context.sort) {
    this.sortOrder = window.context.sort.includes('-') ? 'desc' : 'asc';
    this.sortType = window.context.sortType;
  }

  this.widgetsElement = document.querySelector('.data-container__widgets');
  this.initPageParts();
  this.initFilters();
  new KeywordModal();
  this.initTable();
}

/**
 * The Jinja templates add either the results table + pagination or the no-results message.
 * This adds what's missing
 */
LegalSearchAo.prototype.initPageParts = function() {
  const tableExists = document.querySelector('.panel__main.legal-search-results');
  const paginationExists = document.querySelector('.results-info');
  const noResultsMessageExists = document.querySelector('.u-padding--left.u-padding--right .message.message--no-icon');

  // We're inserting html after the widgets, so let's insert the pagination first,
  if (!paginationExists)
    this.widgetsElement.insertAdjacentHTML('afterend', template_no_pagination);

  // then push a missing results table between widgets and pagination
  if (!tableExists)
    this.widgetsElement.insertAdjacentHTML('afterend', template_no_table);

  if (!noResultsMessageExists)
    document.querySelector('.results-info').insertAdjacentHTML('afterend', template_no_results);

  // Now that all the parts are created, save 'em
  this.resultsTable = document.querySelector('.js-legal-search-results');
  this.paginationElements = document.querySelectorAll('.js-legal-search-pagination');
  this.noResultsMessage = document.querySelector('.js-legal-search-no-results');
};

/**
 * Do the work to get the filters initialized and wired together
 */
LegalSearchAo.prototype.initFilters = function() {
  // The template includes a <input id="search-type" type="hidden"> that we want to fix
  // because 'search_type' goes to the URL upon this.filterSet.serialize() but we want `type`.
  // But only change its name and id if there isn't already a #type element
  // TODO: Change this in legal-doc-search-results.jinja, moving that input into the filters blocks?
  // TODO: It would require changing all the templates that extend legal-doc-search-results
  if (!document.querySelector('#type')) {
    const theSearchType = document.querySelector('#search-type');
    theSearchType.id = 'type';
    theSearchType.name = 'type';
  }

  // If we have a results count,
  // (without one, we'll get errors)
  const resultsCountHolder = document.querySelector('.js-count .tags__count');
  if (resultsCountHolder) {
    // Save its textContent as our initial results count
    this.lastQueryResponse.total_advisory_opinions = parseInt(resultsCountHolder.textContent) || 0;
    // Add commas to that value
    resultsCountHolder.textContent = this.lastQueryResponse.total_advisory_opinions.toLocaleString('en-US');
    // And tell the pagination to update its results counts (adding commas, too)
    this.updatePagination(this.lastQueryResponse.total_advisory_opinions);
  }

  this.tagList = new TagList({
    resultType: 'results',
    showResultCount: true,
    tableTitle: 'Advisory opinions',
    existingFilterTagsElement: $('.js-filter-tags')
    // Notes carried over from filter-tags.js:
    // We're using the table title to decide whether to clear or reset filters.
    // This is a temporary solution to clear filters and not break pages/tables that still require two-year restrictions
  });

  // Because search keywords is a special situation,
  // grab the search value from the URL and create the tag directly
  const queryParams = URI.parseQuery(window.location.search);
  if (queryParams.search)
    this.tagList.addTag(null, { key: 'search-input', name: 'search', value: queryParams.search });

  this.filterPanel = new FilterPanel();
  this.filterSet = this.filterPanel.filterSet;
  
  const categoryFiltersFormElement = document.querySelector('#category-filters');
  categoryFiltersFormElement.addEventListener('change', this.handleFiltersChanged.bind(this));

  // Add a null submit button at the top of the form to prevent Enter submits
  const submitBlocker = document.createElement('input');
  submitBlocker.setAttribute('type', 'submit');
  submitBlocker.setAttribute('disabled', 'disabled');
  submitBlocker.setAttribute('style', 'display:none');
  submitBlocker.setAttribute('aria-hidden', 'true');
  categoryFiltersFormElement.prepend(submitBlocker);

  // Change the keyword search button from submit to a regular button since JS will be handling it
  const searchInputField = document.querySelector('#search-input');
  if (searchInputField) {
    const searchInputSubmitButton = searchInputField.parentNode.querySelector('[type="submit"]');
    if (searchInputSubmitButton) searchInputSubmitButton.setAttribute('type', 'button');
  }

  // Update the window.location based on filters, in case this special template is setting values
  updateQuery(this.filterSet.serialize(), this.filterSet.fields);

  document.querySelector('#search-input').addEventListener('change', this.handleKeywordSearchChange.bind(this));
};

/**
 * Assign event listeners to the sortable column
 */
LegalSearchAo.prototype.initTable = function() {

  // Update the functionality to sort by one or more columns
  const theThElements = document.querySelectorAll('#results th[data-sort]');
  theThElements.forEach(theThElement => {
  if (theThElement) {
    theThElement.setAttribute('aria-controls', 'results');
    theThElement.addEventListener('click', this.handleSortClick.bind(this));
    // Only update the sort columns if page loads with a sort param in the url (upon paginating or pasting/visiting a url with sort param )
    if (this.sortType) {
      updateTableSortColumn(theThElement, this.sortOrder, this.sortType);
    }
  }
  });
};

/**
 * Toggle sortOrder and start the data refresh
 * @param {Event} e
 */
LegalSearchAo.prototype.handleSortClick = function(e) {
  e.stopImmediatePropagation();

  this.sortType = e.target.dataset.sort;
  this.sortOrder = e.target.classList.contains('sorting_asc') ? 'desc' : 'asc';

  updateTableSortColumn(e.target, this.sortOrder, this.sortType );

  this.lastFilterId = undefined;
  this.debounce(this.getResults.bind(this), 250);
};

/**
 * Update the appearance and attributes of the sort column's th
 * @param {HTMLElement} th
 */
function updateTableSortColumn(th, newVal, sortType) {
  const oldVal = newVal == 'asc' ? 'desc' : 'asc';

  // Could probably just toggle these but this feels more stable
  th.classList.add(`sorting_${newVal}`, 'sorting');
  th.classList.remove(`sorting_${oldVal}`);

  th.setAttribute('aria-sort', newVal == 'asc' ? 'ascending' : 'descending');
  th.setAttribute('aria-description',
    `${th.textContent}: Activate to sort column ${newVal == 'asc' ? 'ascending' : 'descending'}`);

  // Remove sorting-* class style on the th that us NOT current sortType
  document.querySelector(`#results th[data-sort]:not(th[data-sort="${sortType}"`).classList.remove('sorting_asc','sorting_desc');
}

/**
 * Handle conflicts between "Show only pending" vs all the document types—pending don't have document types
 * @param {Event} e
 */
LegalSearchAo.prototype.overrideCheckboxes = function(e) {
  // If we've checked 'only pending', we need to uncheck all the categories
  if (e.target.id == 'ao_is_pending') {
    const checkedCategories = document.querySelectorAll('#ao_doc_category_id-field input:checked');
    checkedCategories.forEach(input => {
      $(input).trigger('click'); // Remote trigger a click so we also remove the tag
    });

    // If pending has been unchecked, we need to re-select Final Opinions
    if (!e.target.checked)
      $('#ao_doc_category_id_F').trigger('click');

  // We need to uncheck only-pending if we've chosen a category
  } else if (e.target.id.indexOf('ao_doc_category_id_') === 0) {
    // (but only trigger a click if it's checked—we're not trying to toggle its checked state)
    $('#ao_is_pending-field input:checked').trigger('click'); // Remote trigger a click so we also remove the tag
  }
};

LegalSearchAo.prototype.handleKeywordSearchChange = function(e) {
  const newVal = e.target.value;
  const currentTag = document.querySelectorAll('.tags .tag__item[data-id="search-input"]');

  // If there's already a tag, we need to change its label
  if (currentTag.length >= 1) {
    currentTag.forEach((tag, i) => {
      // We only want to keep one filter tag for keywords, so change its label
      // but only if it has a value to show
      if (i === 0 && newVal.length > 0)
        tag.textContent = newVal;
      // Otherwise, if it's after the first one, click its X button
      else tag.querySelector('.js-close').click();
    });
  } else {
    this.tagList.addTag(null, { key: 'search-input', name: 'search', value: newVal });
  }
};

/**
 * Initialize everything
 */
document.addEventListener('DOMContentLoaded', () => {
  new LegalSearchAo();
});

/**
 * After we've received the demand for more data, let's go get it
 * @param {Event} [e]
 */
LegalSearchAo.prototype.getResults = function(e) {
  if (e) e.preventDefault();

  // Adjust various classes and appearances
  // TODO ?

  // If getResults is called after a delay, reset that timeout var
  if (this.debounceTimer) delete this.debounceTimer;

  // Get data from our filters
  const serializedFilters = this.filterSet.serialize();
  const filterFields = this.filterSet.fields;

  // Let's override any filters here

  // Make sure search and sort are allowed fields
  filterFields.push('search', 'sort');

  // Set the sort param value according to this.sortType
  if (this.sortType == 'ao_no'){
    serializedFilters.sort = this.sortOrder == 'asc' ? 'ao_no' : '-ao_no';
  } else {
    serializedFilters.sort = this.sortOrder == 'asc' ? 'issue_date' : '-issue_date';
  }

    // If we're getting new results, let's reset the page offset (go back to page 1)
    serializedFilters['offset'] = 0;

  // Then update the URL with currently params
  updateQuery(serializedFilters, filterFields);

  // Where are we going to search?
  const fetchPath = ['legal', 'search'].join('/');

  // Initial params from the URL
  const fetchParams = URI.parseQuery(window.location.search);

  // Dates and ao_no have been problematic so we'll remove any empty query params.
  // Problematic in that URIs with &ao_max_issue_date=& would get a warning: date must be MM/DD/YYYY or YYYY-MM-DD
  for (let param in fetchParams) {
    if (!fetchParams[param] || fetchParams[param] === '' || fetchParams == [''] || fetchParams[param].length < 1)
      delete fetchParams[param];

    if (param == 'search') {
      // We need to divide any 'search' value into q and q_exclude, split on ` -`
      const qStrings = [];
      const qExcludeStrings = [];
      if (fetchParams['search'].indexOf(' -') >= 0) {
        const allTerms = fetchParams['search'].split(' ');
        allTerms.forEach(term => {
          if (term.startsWith('-'))
            qExcludeStrings.push(term.substring(1));
          else qStrings.push(term);
        });
        if (qStrings.length > 0)
          fetchParams['q'] = qStrings.join(' ');
        if (qExcludeStrings.length > 0)
          fetchParams['q_exclude'] = qExcludeStrings.join(' ');
      } else
        fetchParams['q'] = fetchParams['search'];

      delete fetchParams['search'];
    }
  }

  const fetchUrl = buildUrl(fetchPath, fetchParams);

  // Set the various states to loading
  this.setLoading(true);

  // And start loading
  $.getJSON(
    fetchUrl.toString(),
    this.handleFetchSuccess.bind(this)
  );
};

/**
 * Takes the response and puts its data into the table, the results count
 * @param {Object} response
 */
LegalSearchAo.prototype.refreshTable = function(response) {

  const resultsTableBody = this.resultsTable.querySelector('tbody');

  // Update the results count
  const resultsCountHolder = document.querySelector('.js-count .tags__count');
  if (resultsCountHolder)
    resultsCountHolder.textContent = response.total_advisory_opinions.toLocaleString('en-US');

  // If we don't have a table to put the results, no reason to continue
  // TODO: seems this should create a table if it doesn't exist
  if (!resultsTableBody) return;

  // Update the table itself
  const tableBodyRows = [];
  response.advisory_opinions.forEach(advisory_opinion => {
    let newRow = `<tr class="simple-table__row">`;
    newRow += `
          <td class="simple-table__cell">
            <div class="t-sans">
              <i class="icon i-folder icon--inline--left"></i>
              <a class="t-bold" title="${advisory_opinion.name}" href="/data/legal/advisory-opinions/${advisory_opinion.ao_no}">AO ${advisory_opinion.ao_no}<br />${advisory_opinion.name}</a>`;
    if (advisory_opinion.status === 'Pending') {
      newRow += `
              <div>
                <i class="icon pending-ao__icon icon--inline--left"></i>
                Pending request
              </div>`;
    }
    newRow += `
            </div>
          </td>`;
    newRow += `
          <td class="simple-table__cell">
            <div class="t-sans">
              ${['Pending','Withdrawn'].includes(advisory_opinion.status) ? advisory_opinion.status : new Date(advisory_opinion.issue_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            </div>
          </td>`;
    newRow += `
          <td class="simple-table__cell">
            <div class="t-sans">`;
    if (advisory_opinion.aos_cited_by.length > 0) {
      advisory_opinion.aos_cited_by.forEach(citation => {
        newRow += `<div><a href="/data/legal/advisory-opinions/${citation.no}/">${citation.no}</a></div>`;
      });
    } else {
      newRow += `This advisory opinion is not cited by other advisory opinions`;
    }
    newRow += `
    <td class="simple-table__cell">
      <div class="t-sans">
        ${advisory_opinion.summary}
      </div>
      ${this.showDocuments(advisory_opinion)}
    </td>`;
    newRow += `
            </div>
          </td>
        </tr>`;

    tableBodyRows.push(newRow);
    //let elm = document.getElementsByClassName('js-accordion');
    //new Accordion('.js-accordion' , {trigger: '.js-accordion-trigger'}, '');
  });
  resultsTableBody.innerHTML = tableBodyRows.join('');

};

/**
 * Handle when any of the filters have been updated, debounce the call to getResults
 * @param {Event} e
 */
LegalSearchAo.prototype.handleFiltersChanged = function(e) {
  this.lastFilterId = e.target.id;
  this.debounce(this.getResults.bind(this), 250);
};

/**
 * Serves as a delay so multiple calls to the same function don't get stacked
 * @param {Function} callback - What should be called after the timeout?
 * @param {number} delay - How many milliseconds to delay
 */
LegalSearchAo.prototype.debounce = function(callback, delay) {
  if (!this.debounceTimer) {
    this.debounceTimer = window.setTimeout(callback, delay);
  }
};

/**
 * Handle a successful fetch response, removing the loading status, updating results counts,
 * send the data to the paginator, build the table, and save the response to compare it to the next one
 * @param {*} response
 */
LegalSearchAo.prototype.handleFetchSuccess = function(response) {
  this.setLoading(false);

  const resultsChangeCount =
    response.total_advisory_opinions - this.lastQueryResponse.total_advisory_opinions;

  this.updateFiltersOnSuccess(resultsChangeCount);

  this.updatePagination(response.total_advisory_opinions);

  this.refreshTable(response);

  // Now that we're finished with the response, save it so we can look at it when another filter is changed
  this.lastQueryResponse = response;
};

/**
 * Adjust various classes, locking and unlocking parts while we're in a loading state
 * @param {boolean} isLoading - Whether we're in a loading state
 */
LegalSearchAo.prototype.setLoading = function(isLoading) {
  this.isLoading = isLoading;
  const isLoadingElement = document.querySelector('.overlay.is-loading');
  if (isLoadingElement) isLoadingElement.setAttribute('style', `display:${isLoading ? 'block' : 'none'}`);

  // Since we have a success, let's change all the is-loading filters to is-successful
  if (!this.isLoading) {
    $('.is-loading:not(.overlay)')
      .removeClass('is-loading')
      .addClass('is-successful');
  }
};

/**
 * Update the changed filter if there have been changes, telling the user how many more or fewer results we've found
 * @param {number} changeCount
 * {@see tables.js filterSuccessUpdates()}
 */
LegalSearchAo.prototype.updateFiltersOnSuccess = function(changeCount) {
  // check if there is a changed form element
  if (this.lastFilterId) {
    let $label;
    const $elm = $(`#${this.lastFilterId}`);
    const type = $elm.attr('type');
    let message = '';
    let filterAction = '';
    let filterResult = '';
    const $filterMessage = $('.filter__message');

    $('.is-successful').removeClass('is-successful');
    $('.is-unsuccessful').removeClass('is-unsuccessful');
    // Enable all restricted fields on success
    $(
      '.restricted-fields input, .restricted-fields button, .restricted-fields legend'
    )
      .removeClass('is-disabled-filter')
      .addClass('is-active-filter');

    // Reenable committee ID typeahead input
    $('#committee_id').removeClass('is-disabled-filter');

    if (type === 'checkbox') {
      $label = $('label[for="' + this.lastFilterId + '"]');

      filterAction = 'Filter added';

      if (!$elm.is(':checked')) {
        filterAction = 'Filter removed';
      }
    } else if (type === 'radio') {
      // Add the message after the last radio button / toggle
      $label = $('label[for="' + this.lastFilterId + '"]').closest('fieldset');
      filterAction =
        $elm.attr('name') == 'data_type'
          ? 'Data type changed.'
          : 'Filter applied.';

      if (!$elm.is(':checked')) {
        filterAction = 'Filter removed.';
      }
    } else if (type === 'text') {
      // typeahead
      if ($elm.hasClass('tt-input')) {
        // show message after generated checkbox (last item in list)
        $label = $('[data-filter="typeahead"] li').last();
        filterAction = 'Filter added';
      } else if ($elm.closest('.range').hasClass('range--currency')) {
        $label = $elm.closest('.range');
        filterAction = 'Filter applied';
      } else if ($elm.closest('.range').hasClass('range--date')) {
        $label = $('.date-range-grid');
        filterAction = 'Filter applied';
      }
      // text input search
      else {
        $label = $('.is-loading:not(.overlay)');
        filterAction = 'Filter added';
      }
    } else {
      // probably a select dropdown
      $label = $elm;
      filterAction = '"' + $elm.find('option:selected').text() + '" applied.';
    }

    $('.is-loading:not(.overlay)')
      .removeClass('is-loading')
      .addClass('is-successful');

    // build message with number of results returned

    if (changeCount > 0) {
      filterResult = changeCount.toLocaleString() + ' more results';
    } else if (changeCount === 0) {
      filterResult = 'No change in results';
    } else {
      filterResult = Math.abs(changeCount).toLocaleString() + ' fewer results';
    }

    message = '<strong>' + filterAction + '</strong><br>' + filterResult;

    $filterMessage.fadeOut().remove();
    // if there is a message already, cancel existing message timeout
    // to avoid timing weirdness
    clearTimeout(this.messageTimer);

    // Clicking on "Clear all filters" will remove all dropdown checkboxes,
    // so we check to make sure the message isn't shown inside the dropdown panel.
    if ($label.closest('.dropdown__list').length < 1) {
      // append filter change count message after input
      $label.after(
        $(
          '<div class="filter__message filter__message--success">' +
            message +
            '</div>'
        )
          .hide()
          .fadeIn()
      );
    }

    this.messageTimer = setTimeout(function() {
      $('.filter__message.filter__message--success').fadeOut(function() {
        $(this).remove();
      });
      $('.is-successful').removeClass('is-successful');
      $('.date-range-grid').fadeOut();
    }, SUCCESS_DELAY);
  }
};

/**
 * Update the pagination buttons, updating text content, URLs, and appearance
 * @param {number} resultsCount
 */
LegalSearchAo.prototype.updatePagination = function(resultsCount) {
  if (!this.paginationElements) return; // If we can't find the pagination holder, no reason to continue

  // Toggle major components on whether we have results
  if (resultsCount > 0) {
    this.noResultsMessage.setAttribute('aria-hidden', true);
    this.paginationElements.forEach(el => {
      el.removeAttribute('aria-hidden');
    });
    this.resultsTable.removeAttribute('aria-hidden');
  } else {
    this.noResultsMessage.removeAttribute('aria-hidden');
    this.paginationElements.forEach(el => {
      el.setAttribute('aria-hidden', true);
    });
    this.resultsTable.setAttribute('aria-hidden', true);
  }

  const control_count = this.paginationElements[0].querySelector('.results-length');
  const summary = this.paginationElements[0].querySelector('.dataTables_info');
  const maxButtonsOnScreen = 5;

  const resultLimit = parseInt(control_count.value);

  const currentSearchParams = new URLSearchParams(window.location.search);

  let currentOffset = parseInt(currentSearchParams.get('offset')) || 0;

  if (currentOffset > resultsCount || currentOffset < 0) currentOffset = 0;

  // Update the text summary
  const firstResultShown = currentOffset + 1; // Working with 0-indexed (i.e. the first will be 0)
  const lastResultShown = Math.min(firstResultShown - 1 + resultLimit, resultsCount); // Will be 0-indexed
  summary.textContent = 'Showing ';
  summary.textContent += firstResultShown < 1000 ? firstResultShown : firstResultShown.toLocaleString('en-US');
  summary.textContent += '-';
  summary.textContent += lastResultShown < 1000 ? lastResultShown : lastResultShown.toLocaleString('en-US');
  summary.textContent += ' of ';
  summary.textContent += resultsCount < 1000 ? resultsCount : resultsCount.toLocaleString('en-US');
  summary.textContent += ' results';

  const totalNumberOfPages = Math.ceil(resultsCount / resultLimit);
  const currentPageNum = Math.floor(currentOffset / resultLimit);
  const pageNumbers = [];

  // If we have fewer pages than our max buttons, we don't need to worry about balancing them
  if (totalNumberOfPages <= maxButtonsOnScreen) {
    // Yay! We can just use every button
    for (let i = 0; i < totalNumberOfPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    const buttonsBeforeCurrent = Math.floor(maxButtonsOnScreen / 2);

    pageNumbers.push(currentPageNum);

    // Let's pad buttons for pages before the current page.
    // Start backward from the current page, adding page numbers but only as many as buttonsBeforeCurrent allows
    // (Perfect if we're on page 3 of 5 buttons)
    for (let i = currentPageNum - 1; i >= 0 && pageNumbers.length < buttonsBeforeCurrent + 1; i--) {
      pageNumbers.unshift(i);
    }
    // Now for the buttons after the current page
    // Start at the current page and work forward but not to exceed maxButtonsOnScreen
    // (Perfect if we're on page 3-5 of 5 buttons)
    for (let i = currentPageNum + 1; i < totalNumberOfPages && pageNumbers.length < maxButtonsOnScreen; i++) {
      pageNumbers.push(i);
    }
    // Coming back to the front, let's build to maxButtonsOnScreen
    // (Necessary if we're on 4-5 of 5 buttons and only added two to the beginning)
    for (let i = currentPageNum - buttonsBeforeCurrent - 1; i >= 0 && pageNumbers.length < maxButtonsOnScreen; i--) {
      pageNumbers.unshift(i);
    }
  }

  // Start building the URLs for the buttons
  const fetchParams = URI.parseQuery(window.location.search);
  const sharedUri = URI(window.location.pathname).addQuery(fetchParams);

  // Find the buttons holder and remove its content
  const buttonsParent = document.querySelector('.paginate_button').parentElement;
  buttonsParent.innerText = '';

  // Let's start with the Previous button (because we want to use appendChild because it's still more widely supported)
  const newPrevButton = document.createElement(currentPageNum === 0 ? 'span' : 'a');
  newPrevButton.classList.add('paginate_button', 'previous');
  newPrevButton.textContent = 'Previous';
  if (newPrevButton.nodeName == 'SPAN') {
    newPrevButton.classList.add('is-disabled');
    newPrevButton.setAttribute('aria-label', `No previous results to show`);
  } else {
    newPrevButton.setAttribute('aria-label', `Go to page ${currentPageNum}`);
    newPrevButton.setAttribute(
      'href',
      sharedUri.setQuery({ offset: Math.max(0, currentPageNum - 1) * resultLimit }).toString()
    );
  }
  buttonsParent.appendChild(newPrevButton);

  // Now continue with the numbered buttons
  for (let i = 0; i < pageNumbers.length; i++) {
    const newPageButton = document.createElement(pageNumbers[i] == currentPageNum ? 'span' : 'a');
    newPageButton.classList.add(`paginate_button`);
    newPageButton.textContent = `${pageNumbers[i] + 1}`;
    if (pageNumbers[i] == currentPageNum) {
      newPageButton.classList.add('current');
      newPageButton.setAttribute('aria-label', `Showing results for page ${pageNumbers[i] + 1}`);
      newPageButton.setAttribute('aria-current', 'true');
    } else {
      newPageButton.setAttribute(
        'href',
        sharedUri.setQuery({ offset: pageNumbers[i] * resultLimit, limit: resultLimit }).toString()
      );
      newPageButton.setAttribute('aria-label', `Go to page ${pageNumbers[i] + 1}`);
    }

    buttonsParent.appendChild(newPageButton);
  }

  // Finally, the Next button
  const newNextButton = document.createElement(currentOffset + resultLimit >= resultsCount ? 'span' : 'a');
  newNextButton.classList.add('paginate_button', 'next');
  newNextButton.textContent = 'Next';
  if (newNextButton.nodeName == 'SPAN') {
    newNextButton.classList.add('is-disabled');
    newPrevButton.setAttribute('aria-label', `No next results to show`);
  } else {
    newNextButton.setAttribute('aria-label', `Go to page ${currentPageNum + 2}`);
    newNextButton.setAttribute(
      'href',
      sharedUri.setQuery({ offset: (currentPageNum + 1) * resultLimit }).toString()
    );
  }
  buttonsParent.appendChild(newNextButton);

  // Finally, if we have a second pagination element, set its innerHTML to whatever we set for [0]'s
  if (this.paginationElements[1])
    this.paginationElements[1].innerHTML = this.paginationElements[0].innerHTML;
};

// The bare-minimum html for the results table
const template_no_results = `<div class="u-padding--left u-padding--right js-legal-search-no-results">
  <div class="message message--no-icon">
    <h2 class="message__title">No results</h2>
    <p>Sorry, we didn’t find any documents matching your search.</p>
    <div class="message--alert__bottom">
      <p>Think this was a mistake?</p>
      <ul class="list--buttons">
        <li><a class="button button--standard" href="${window.WEBMANAGER_EMAIL}">Email our team</a></li>
        <li><a class="button button--standard" href="https://github.com/fecgov/fec/issues">File an issue</a></li>
      </ul>
    </div>
  </div>
</div>`;

const template_no_table = `<div class="panel__main legal-search-results js-legal-search-results">
  <div class="overlay is-loading" style="display: none;"></div>
  <table id="results" class="simple-table simple-table--display">
    <thead>
      <tr class="simple-table__header">
        <th class="simple-table__header-cell cell--15 sorting_desc sorting" data-sort="ao_no" aria-controls="results" aria-sort="descending" aria-description="Case: Activate to sort column descending">Case</th>
        <th class="simple-table__header-cell cell--15 sorting_desc sorting" data-sort="issue_date" aria-controls="results" aria-sort="descending" aria-description="Data issued: Activate to sort column descending">Date issued</th>
        <th class="simple-table__header-cell">Summary</th>
        <th class="simple-table__header-cell">This opinion is cited by these later opinions</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>`;

const template_no_pagination = `<div class="results-info u-border-top-base">
  <div class="dataTables_length">
    <label for="results-length">Results per page: 
      <select name="results_length" aria-controls="results" class="results-length">
          <option value="20" selected="">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
      </select>
    </label> 
  </div>
  <div class="dataTables_paginate">
    <span class="paginate_button previous is-disabled" aria-label="No previous results to show">Previous</span>
    <span class="paginate_button next" aria-label="Go to page 2">Next</span>
  </div>
  <div class="dataTables_info">Showing 0 results</div>
</div>`;

LegalSearchAo.prototype.showDocuments = function(ao) {
  
  const filters = this.filterSet.serialize();
  const filters_category_type = 'ao_doc_category_id' in filters;
  const filters_keyword = 'search' in filters;
  const filters_proximity = 'q_proximity' in filters && filters.q_proximity.length == 2;
  const proximity_only = filters_proximity && !filters_keyword;

   // Opening div tags are lined up with their closing divs below
  let document_content = ''
  if (ao.document_highlights || ao.source || ao.ao_doc_category_id) {
    document_content += 
   `<div class="legal-search-result__hit u-margin--top">`;
    if ((filters_category_type || filters_keyword) && !proximity_only) {  
        let category_shown = '';                                                                                                            
        for (const [index, document] of ao.documents.entries()) { 

          /*This will show documents in all 3 scenarios:
            - When there is a keyword query and selected document categories
            - When there are selected document categories and no keyword query
            - When there is a keyword query and no selected document categories */

          let category_match = !filters_category_type || filters.ao_doc_category_id.includes(document.ao_doc_category_id) ? true : false;
          let text_match = index in ao.document_highlights || !filters_keyword ? true : false;
          let show_document = category_match && text_match;  
          if (show_document) {
            let top_border_class = '';
            let show_category = '';
            let current_category = document.ao_doc_category_id;
            if (category_shown != current_category) {
                  top_border_class = "u-border-top-nuetral";
                  show_category = document.category;
                  category_shown = current_category;
              }
              else {
                show_category = '';
              }
            document_content += `
                  <div class="document-container">
                    <div class="document-category ${top_border_class}">${show_category}</div>
                    <div class="document_details u-border-top-nuetral">
                      <div class="post--icon">
                        <span class="icon icon--inline--left i-document"></span>
                        <a href="${document.url}">
                          ${document.description}
                        </a>
                      </div>`;       
            if (ao.document_highlights[index]) {
              if (ao.document_highlights[index].length) {
                  document_content += `
                      <ul>
                        <li class="post--icon t-serif t-italic u-padding--top--med">&#8230;${ao.document_highlights[index][0]}&#8230;
                        </li>
                      </ul>`;
              }
              if (ao.document_highlights[index].length > 1) {
                  document_content += `
                      <div class="js-accordion u-margin--top" data-content-prefix="additional-result-${ao.no}-${index}">
                        <button type="button" class="js-accordion-trigger accordion-trigger-on accordion__button results__button" aria-controls="additional-result-${ao.no}-${index}" aria-expanded="false">
                          ${ao.document_highlights[index].length > 2 ? ao.document_highlights[index].length -1 + " more keyword matches" : "1 more keyword match"}
                        </button>
                        <div class="accordion__content results__content" aria-hidden="true">
                          <ul>`;
                          for (let i = 1; i <= ao.document_highlights[index].length -1; i++) {
                            document_content += `<li class="t-serif t-italic">&#8230;${ao.document_highlights[index][i]}&#8230;</li>`;
                          }
                            document_content += `
                          </ul>
                        </div>
                      </div>`;       
              }
            }
            document_content += `
                    </div> 
                  </div>`;
          } 
        } 
    } else if (proximity_only) {
      let category_shown = '';
        for (const document of ao.source) {
              let top_border_class = '';
              let show_category = '';
              let current_category = document.ao_doc_category_id;
                if (category_shown != current_category) {
                    top_border_class = "u-border-top-nuetral";
                    show_category = document.category;
                    category_shown = current_category;
                }
                else {
                  show_category = '';
                }
                  document_content += `
                    <div class="document-container">
                      <div class="document-category ${top_border_class}">${show_category}</div>
                      <div class="document_details u-border-top-nuetral">
                        <div class="post--icon">
                          <span class="icon icon--inline--left i-document"></span>
                          <a href="${document.url}">
                            ${document.description}
                          </a>
                        </div>
                      </div>
                    </div>`;
        }
    }
    document_content += `
    </div>`;
  }

  return document_content;
}
