/**
 * Court Case Alphabetical Index Search
 * Handles client-side search and filtering for the court case index page
 */

export function initCourtCaseSearch() {
  const navLinks = document.querySelectorAll('.alphabet-nav__link[href^="#"]');
  const searchForm = document.querySelector('.court-case-search');
  const searchInput = document.getElementById('search');

  if (!searchForm || !searchInput) {
    return;
  }

  // Function to update header based on search state
  function updateHeader(isSearching, visibleCount) {
    const headerRow = document.querySelector('.court-case-listing .court-case-listing-header');
    if (!headerRow) return;

    const heading = headerRow.querySelector('.court-case-listing-header h2');
    const countSpan = headerRow.querySelector('.case-count');

    if (isSearching) {
      // Show "Results" header
      heading.textContent = 'Results';
      countSpan.innerHTML = `${visibleCount} total result${visibleCount !== 1 ? 's' : ''} | <a href="#" class="js-clear-search">Show full alphabetical list</a>`;
    } else {
      // Show "All court cases" header
      heading.textContent = 'All court cases in alphabetical order';
      const totalCount = document.querySelectorAll('section[id] table tbody tr').length;
      countSpan.textContent = `${totalCount} total court case${totalCount !== 1 ? 's' : ''}`;
    }
  }

  // Function to show/hide no results message
  function updateNoResultsMessage(show, query) {
    let noResultsDiv = document.querySelector('.message--info');

    if (show) {
      // Create the message if it doesn't exist
      if (!noResultsDiv) {
        noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'message message--info';
        noResultsDiv.innerHTML = `
          <h2>No results</h2>
          <p>We didn't find any court cases matching <strong>&ldquo;${query}&rdquo;</strong></p>
          <p class="u-border-top-base u-padding--top">Think this was a mistake?<br>Please let us know.</p>
          <p>
            <a href="mailto:webmanager@fec.gov" class="button--standard">Email our team</a>&nbsp;&nbsp; <a href="https://github.com/fecgov/fec/issues/new" class="button--standard">File an issue</a>
          </p>
        `;
        const headerRow = document.querySelector('.court-case-listing .court-case-listing-header');
        headerRow.parentNode.insertBefore(noResultsDiv, headerRow.nextSibling);
      } else {
        // Update the query in the existing message
        const querySpan = noResultsDiv.querySelector('strong');
        if (querySpan) {
          querySpan.innerHTML = `&ldquo;${query}&rdquo;`;
        }
        noResultsDiv.style.display = '';
      }
    } else {
      // Hide the message if it exists
      if (noResultsDiv) {
        noResultsDiv.style.display = 'none';
      }
    }
  }

  // Clear search when clicking alpha nav
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (searchInput.value) {
        searchInput.value = '';
        // Show all rows and sections
        const allRows = document.querySelectorAll('section[id] table tbody tr');
        const allSections = document.querySelectorAll('section[id]');
        allRows.forEach(row => row.style.display = '');
        allSections.forEach(section => section.style.display = '');

        // Update header to show all cases
        updateHeader(false);

        // Hide no results message
        updateNoResultsMessage(false);

        // Update URL to remove query param
        const url = new URL(window.location);
        url.searchParams.delete('q');
        window.history.pushState({}, '', url);
      }
    });
  });

  // Handle search without page reload
  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = searchInput.value.toLowerCase().trim();

    // Get all case rows
    const allRows = document.querySelectorAll('section[id] table tbody tr');
    const allSections = document.querySelectorAll('section[id]');

    if (query === '') {
      // Show all rows and sections
      allRows.forEach(row => row.style.display = '');
      allSections.forEach(section => section.style.display = '');
      updateHeader(false);
      updateNoResultsMessage(false);
    } else {
      // Filter rows
      let visibleCount = 0;
      allRows.forEach(row => {
        const caseTitle = row.querySelector('td:first-child a').textContent.toLowerCase();
        if (caseTitle.includes(query)) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      // Hide empty sections
      allSections.forEach(section => {
        const visibleRows = section.querySelectorAll('table tbody tr:not([style*="display: none"])');
        if (visibleRows.length === 0) {
          section.style.display = 'none';
        } else {
          section.style.display = '';
        }
      });

      // Update header to show results
      updateHeader(true, visibleCount);

      // Show/hide no results message
      updateNoResultsMessage(visibleCount === 0, searchInput.value);
    }

    // Update URL without reloading
    const url = new URL(window.location);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    window.history.pushState({}, '', url);
  });

  // Handle "Show full alphabetical list" link clicks (event delegation for dynamically created link)
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('js-clear-search')) {
      e.preventDefault();

      // Clear the search input
      searchInput.value = '';

      // Show all rows and sections
      const allRows = document.querySelectorAll('section[id] table tbody tr');
      const allSections = document.querySelectorAll('section[id]');
      allRows.forEach(row => row.style.display = '');
      allSections.forEach(section => section.style.display = '');

      // Update header to show all cases
      updateHeader(false);

      // Hide no results message
      updateNoResultsMessage(false);

      // Update URL to remove query param
      const url = new URL(window.location);
      url.searchParams.delete('q');
      window.history.pushState({}, '', url);
    }
  });

  // Trigger search on input if there's a query in URL on page load
  const urlParams = new URLSearchParams(window.location.search);
  const urlQuery = urlParams.get('q');
  if (urlQuery) {
    searchInput.value = urlQuery;
    searchForm.dispatchEvent(new Event('submit'));
  }
}
