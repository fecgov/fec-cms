/**
 * Initial (likely temporary) class
 */

// import { default as _debounce } from 'underscore/modules/debounce.js';
import { default as URI } from 'urijs';

import { default as FilterPanel } from './modules/filters/filter-panel.js';
import { default as TagList } from './modules/filters/filter-tags.js';
import { buildUrl, SUCCESS_DELAY } from './modules/helpers.js';
import KeywordModal from './modules/keyword-modal.js';
import { updateQuery } from './modules/urls.js';

/**
 * @property {FilterPanel} this.filterPanel - The left column's filters panel element
 * @property {HTMLElement} this.resultsTbody - The table body where fetched results should go
 * @property {boolean} this.isLoading - Controls appearance and behavior of elements on the screen
 * @property {number} this.debounceTimer - The number for the debouncing setTimeout
 * @property {number} this.messageTimer - The number for the "filter added/removed" fade-outs
 * @property {string} this.lastFilterId - The last filter ID that was changed by the user
 * @property {number} this.lastQuery - The most recent query results
 */
export default function LegalSearchAo() {
  this.filterPanel;
  this.resultsTbody = document.querySelector('.legal-search-results tbody');
  this.isLoading = false;
  this.debounceTimer;
  this.sortOrder = 'desc';

  this.lastQueryResponse = {};

  this.initFilters();
  new KeywordModal();
  this.initTable();

  // const Paginator = OffsetPaginator;
  // this.paginator = new Paginator();
}

LegalSearchAo.prototype.initFilters = function() {
  this.lastQueryResponse.total_advisory_opinions =
    parseInt(document.querySelector('.js-count .tags__count').textContent) || 0;

  document.querySelector('.js-count .tags__count').textContent =
    this.lastQueryResponse.total_advisory_opinions.toLocaleString('en-US');

  this.updatePagination(this.lastQueryResponse.total_advisory_opinions);

  const taglist = new TagList({
    resultType: 'results',
    showResultCount: true,
    tableTitle: 'Advisory opinions',
    existingFilterTagsElement: $('.js-filter-tags')
    // We're using the table title to decide whether to clear or reset filters.
    // This is a temporary solution to clear filters and not break pages/tables that still require two-year restrictions
    // TODO
  });

  // Because search keywords is a special situation,
  // grab the search value from the URL and create the tag directly
  const queryParams = URI.parseQuery(window.location.search);
  if (queryParams.search)
    taglist.addTag(null, { key: 'search-input', name: 'search', value: queryParams.search });

  this.filterPanel = new FilterPanel();
  this.filterSet = this.filterPanel.filterSet;

  document.body.querySelector('#filters').addEventListener('change', this.handleFiltersChanged.bind(this));

  const conflictingCheckboxes = document.querySelectorAll('#ao_is_pending-field, #ao_category-field');
  conflictingCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', this.overrideCheckboxes.bind(this));
  });

  // Update the window.location based on filters, in case this special template is setting values
  updateQuery(this.filterSet.serialize(), this.filterSet.fields);

  /**
   * Keep scroll-position with each reload
   * @TODO: do we still need this if we're refreshing the data immediately?
   * {@link https://stackoverflow.com/questions/17642872/refresh-page-and-keep-scroll-position}
  */
  // document.addEventListener('DOMContentLoaded', function() {
  //   const scrollpos = localStorage.getItem('scrollpos');
  //   if (scrollpos) window.scrollTo(0, scrollpos);
  //   // this.getResults();
  // });

  // window.onbeforeunload = function() {
  //   localStorage.setItem('scrollpos', window.scrollY);
  //   location.reload();
  // };
};

/**
 * Assigns event listeners to the sortable column
 */
LegalSearchAo.prototype.initTable = function() {
  // Add the functionality for the ao_no sorting, but only if the table exists
  const theTh = document.querySelector('#results th[data-sort]');
  if (theTh) {
    theTh.setAttribute('aria-controls', 'results');
    theTh.addEventListener('click', this.handleSortClick.bind(this));
    updateTableSortColumn(theTh, this.sortOrder);
  }
};

/**
 * Toggle sortOrder and start the data refresh
 * @param {Event} e
 */
LegalSearchAo.prototype.handleSortClick = function(e) {
  e.stopImmediatePropagation();

  this.sortOrder = this.sortOrder == 'asc' ? 'desc' : 'asc';

  updateTableSortColumn(e.target, this.sortOrder == 'asc' ? 'desc' : 'asc');

  this.lastFilterId = undefined;
  this.debounce(this.getResults.bind(this), 250);
};

/**
 * Update the appearance and attributes of the sort column's th
 * @param {HTMLElement} th
 */
function updateTableSortColumn(th, newVal) {
  const oldVal = newVal == 'asc' ? 'desc' : 'asc';

  // Could probably just toggle these but this feels more stable
  th.classList.add(`sorting_${newVal}`, 'sorting');
  th.classList.remove(`sorting_${oldVal}`);

  th.setAttribute('aria-sort', newVal == 'asc' ? 'ascending' : 'descending');
  th.setAttribute('aria-description',
    `${th.textContent}: Activate to sort column ${newVal == 'asc' ? 'ascending' : 'descending'}`);
}

/**
 * Handle conflicts between "Show only pending" vs all the document types—pending don't have document types
 * @param {Event} e
 */
LegalSearchAo.prototype.overrideCheckboxes = function(e) {
  // If we've checked 'only pending', we need to uncheck all the categories
  if (e.target.id == 'ao_is_pending') {
    const checkedCategories = document.querySelectorAll('#ao_category-field input:checked');
    checkedCategories.forEach(input => {
      $(input).trigger('click'); // Remote trigger a click so we also remove the tag
    });

    // If pending has been unchecked, we need to re-select Final Opinions
    if (!e.target.checked)
      $('#ao_category_F').trigger('click');

  // We need to uncheck only-pending if we've chosen a category
  } else if (e.target.id.indexOf('ao_category_') === 0) {
    // (but only trigger a click if it's checked—we're not trying to toggle its checked state)
    $('#ao_is_pending-field input:checked').trigger('click'); // Remote trigger a click so we also remove the tag
  }
};

/**
 * Initialize everything
 */
document.addEventListener('DOMContentLoaded', () => {
  new LegalSearchAo();
});

/**
 * After we've received the call for more data, let's so get it
 * @param {Event} e
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

  // Set the sort param value according to this.sortOrder
  serializedFilters.sort = this.sortOrder == 'asc' ? 'case_no' : '-case_no';

  // Then update the URL with currently params
  updateQuery(serializedFilters, filterFields);

  // Where are we going to search?
  const fetchPath = ['legal', 'search'].join('/');

  // Initial params from the URL
  const fetchParams = URI.parseQuery(window.location.search);

  // Dates have been problematic so we'll remove any empty query params.
  // Problematic in that URIs with &ao_max_issue_date=& would get a warning: date must be MM/DD/YYYY or YYYY-MM-DD
  for (let param in fetchParams) {
    if (!fetchParams[param]) delete fetchParams[param];
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

  // Update the results count
  document.querySelector('.js-count .tags__count').textContent =
    response.total_advisory_opinions.toLocaleString('en-US');

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
            <div class="t-sans">
              ${advisory_opinion.summary}
            </div>
          </td>`;
    newRow += `
          <td class="simple-table__cell">
            <div class="t-sans">`;
    if (advisory_opinion.aos_cited_by.length > 0) {
      advisory_opinion.aos_cited_by.forEach(citation => {
        newRow += `<div><a href="${citation.no}">${citation.no}</a></div>`;
      });
    } else {
      newRow += `This advisory opinion is not cited by other advisory opinions`;
    }
    newRow += `
            </div>
          </td>
        </tr>`;

    tableBodyRows.push(newRow);
  });
  this.resultsTbody.innerHTML = tableBodyRows.join('');
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
  document.querySelector('.overlay.is-loading').setAttribute('style', `display:${isLoading ? 'block' : 'none'}`);

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
  const paginationHolder = document.querySelector('.results-info');
  const control_count = paginationHolder.querySelector('.results-length');
  const summary = paginationHolder.querySelector('.dataTables_info');
  const maxButtonCount = 5;

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

  const totalNumberOfPages = Math.floor(resultsCount / resultLimit);
  const currentPageNum = Math.floor(currentOffset / resultLimit);
  const pageNumbers = [];

  // If we have fewer pages than our max buttons, we don't need to worry about balancing them
  if (totalNumberOfPages <= maxButtonCount) {
    // Yay! We can just use every button
    for (let i = 0; i < totalNumberOfPages; i++) {
      pageNumbers.push(i + 1);
    }
  } else {
    const buttonsBeforeCurrent = Math.floor(maxButtonCount / 2);

    pageNumbers.push(currentPageNum);

    // Let's pad buttons for pages before the current page.
    // Start backward from the current page, adding page numbers but only as many as buttonsBeforeCurrent allows
    // (Perfect if we're on page 3 of 5 buttons)
    for (let i = currentPageNum - 1; i >= 0 && pageNumbers.length < buttonsBeforeCurrent + 1; i--) {
      pageNumbers.unshift(i);
    }
    // Now for the buttons after the current page
    // Start at the current page and work forward but not to exceed maxButtonCount
    // (Perfect if we're on page 3-5 of 5 buttons)
    for (let i = currentPageNum + 1; i < totalNumberOfPages && pageNumbers.length < maxButtonCount; i++) {
      pageNumbers.push(i);
    }
    // Coming back to the front, let's build to maxButtonCount
    // (Necessary if we're on 4-5 of 5 buttons and only added two to the beginning)
    for (let i = currentPageNum - buttonsBeforeCurrent - 1; i >= 0 && pageNumbers.length < maxButtonCount; i--) {
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
};
