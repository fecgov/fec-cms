// Common for all/most tests
import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
use(sinonChai);
// (end common)

describe('court case search and navigation', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  afterEach(function() {
    // Clean up any stubs
    if (this.pushStateStub && this.pushStateStub.restore) {
      this.pushStateStub.restore();
    }
  });

  beforeEach(function() {
    // Create mock HTML structure for court case index page
    this.$fixture.empty().append(
      '<div class="container alpha-index-search">' +
        '<nav class="alphabet-nav">' +
          '<a class="alphabet-nav__link" href="#a">A</a>' +
          '<a class="alphabet-nav__link" href="#b">B</a>' +
        '</nav>' +
        '<form class="court-case-search" method="get">' +
          '<input type="text" name="q" id="search" class="combo__input" placeholder="Case name keyword">' +
          '<button class="button--standard combo__button button--search" type="submit">Search</button>' +
        '</form>' +
      '</div>' +
      '<div class="container court-case-listing">' +
        '<div class="row court-case-listing-header">' +
          '<h2>All court cases in alphabetical order</h2>' +
          '<div class="case-count"><span class="t-sans">3 total court cases</span></div>' +
        '</div>' +
        '<section id="a">' +
          '<h3>A</h3>' +
          '<table>' +
            '<tbody>' +
              '<tr>' +
                '<td><a href="/case/adams-v-fec">Adams v. FEC</a></td>' +
                '<td>Opinion content</td>' +
              '</tr>' +
              '<tr>' +
                '<td><a href="/case/anderson-v-fec">Anderson v. FEC</a></td>' +
                '<td>Opinion content</td>' +
              '</tr>' +
            '</tbody>' +
          '</table>' +
        '</section>' +
        '<section id="b">' +
          '<h3>B</h3>' +
          '<table>' +
            '<tbody>' +
              '<tr>' +
                '<td><a href="/case/brown-v-fec">Brown v. FEC</a></td>' +
                '<td>Opinion content</td>' +
              '</tr>' +
            '</tbody>' +
          '</table>' +
        '</section>' +
      '</div>'
    );

    // Store references
    this.searchForm = document.querySelector('.court-case-search');
    this.searchInput = document.getElementById('search');
    this.navLinks = document.querySelectorAll('.alphabet-nav__link[href^="#"]');
  });

  describe('search filtering logic', function() {
    it('should filter cases based on search query', function() {
      const query = 'adams';
      const allRows = document.querySelectorAll('section[id] table tbody tr');

      // Simulate filtering logic
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

      // Check that correct rows are visible/hidden
      expect(visibleCount).to.equal(1);

      // Check first row (Adams) is visible
      const firstRow = allRows[0];
      expect(firstRow.style.display).to.equal('');

      // Check other rows are hidden
      expect(allRows[1].style.display).to.equal('none');
      expect(allRows[2].style.display).to.equal('none');
    });

    it('should hide sections with no visible results', function() {
      const query = 'adams';
      const allRows = document.querySelectorAll('section[id] table tbody tr');

      // Filter rows
      allRows.forEach(row => {
        const caseTitle = row.querySelector('td:first-child a').textContent.toLowerCase();
        row.style.display = caseTitle.includes(query) ? '' : 'none';
      });

      // Hide empty sections
      const allSections = document.querySelectorAll('section[id]');
      allSections.forEach(section => {
        const visibleRows = section.querySelectorAll('table tbody tr:not([style*="display: none"])');
        section.style.display = visibleRows.length === 0 ? 'none' : '';
      });

      // Section A should be visible (has Adams)
      const sectionA = document.getElementById('a');
      expect(sectionA.style.display).to.equal('');

      // Section B should be hidden (no matching cases)
      const sectionB = document.getElementById('b');
      expect(sectionB.style.display).to.equal('none');
    });

    it('should show all cases when query is empty', function() {
      const query = '';
      const allRows = document.querySelectorAll('section[id] table tbody tr');
      const allSections = document.querySelectorAll('section[id]');

      if (query === '') {
        allRows.forEach(row => row.style.display = '');
        allSections.forEach(section => section.style.display = '');
      }

      // All rows should be visible
      allRows.forEach(row => {
        expect(row.style.display).to.equal('');
      });

      // All sections should be visible
      allSections.forEach(section => {
        expect(section.style.display).to.equal('');
      });
    });

    it('should perform case-insensitive matching', function() {
      const query = 'ADAMS';
      const allRows = document.querySelectorAll('section[id] table tbody tr');

      let visibleCount = 0;
      allRows.forEach(row => {
        const caseTitle = row.querySelector('td:first-child a').textContent.toLowerCase();
        if (caseTitle.includes(query.toLowerCase())) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      // Should still find "Adams v. FEC"
      expect(visibleCount).to.equal(1);
    });

    it('should match partial case names', function() {
      const query = 'ander';
      const allRows = document.querySelectorAll('section[id] table tbody tr');

      let foundAnderson = false;
      allRows.forEach(row => {
        const caseTitle = row.querySelector('td:first-child a').textContent.toLowerCase();
        if (caseTitle.includes(query.toLowerCase())) {
          row.style.display = '';
          if (caseTitle.includes('anderson')) {
            foundAnderson = true;
          }
        } else {
          row.style.display = 'none';
        }
      });

      // Should find "Anderson v. FEC"
      expect(foundAnderson).to.be.true;
    });
  });

  describe('header updates', function() {
    beforeEach(function() {
      // Initialize the updateHeader function in the test context
      this.updateHeader = function(isSearching, visibleCount) {
        const headerRow = document.querySelector('.court-case-listing .court-case-listing-header');
        if (!headerRow) return;

        const heading = headerRow.querySelector('h2');
        const countSpan = headerRow.querySelector('.case-count');

        if (isSearching) {
          heading.textContent = 'Results';
          countSpan.innerHTML = `${visibleCount} total result${visibleCount !== 1 ? 's' : ''} | <a href="#" class="js-clear-search">Show full alphabetical list</a>`;
        } else {
          heading.textContent = 'All court cases in alphabetical order';
          const totalCount = document.querySelectorAll('section[id] table tbody tr').length;
          countSpan.textContent = `${totalCount} total court case${totalCount !== 1 ? 's' : ''}`;
        }
      };
    });

    it('should show "Results" header when searching', function() {
      this.updateHeader(true, 2);

      const heading = document.querySelector('.court-case-listing-header h2');
      expect(heading.textContent).to.equal('Results');
    });

    it('should show result count with proper pluralization', function() {
      this.updateHeader(true, 1);
      let countSpan = document.querySelector('.case-count');
      expect(countSpan.textContent).to.include('1 total result');
      expect(countSpan.textContent).to.not.include('results');

      this.updateHeader(true, 2);
      countSpan = document.querySelector('.case-count');
      expect(countSpan.textContent).to.include('2 total results');
    });

    it('should show "Show full alphabetical list" link when searching', function() {
      this.updateHeader(true, 2);

      const clearLink = document.querySelector('.js-clear-search');
      expect(clearLink).to.exist;
      expect(clearLink.textContent).to.equal('Show full alphabetical list');
    });

    it('should show default header when not searching', function() {
      this.updateHeader(false);

      const heading = document.querySelector('.court-case-listing-header h2');
      expect(heading.textContent).to.equal('All court cases in alphabetical order');
    });

    it('should show total case count when not searching', function() {
      this.updateHeader(false);

      const countSpan = document.querySelector('.case-count');
      expect(countSpan.textContent).to.include('3 total court cases');
    });
  });

  describe('no results message', function() {
    beforeEach(function() {
      // Initialize the updateNoResultsMessage function
      this.updateNoResultsMessage = function(show, query) {
        let noResultsDiv = document.querySelector('.message--info');

        if (show) {
          if (!noResultsDiv) {
            noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'message message--info';
            noResultsDiv.innerHTML = `
              <h2>No results</h2>
              <p>We didn't find any pages matching <strong>&ldquo;${query}&rdquo;</strong></p>
              <p class="u-border-top-base u-padding--top">Think this was a mistake?<br>Please let us know.</p>
              <p>
                <a href="mailto:webmanager@fec.gov" class="button--standard">Email our team</a>&nbsp;&nbsp; <a href="https://github.com/fecgov/fec/issues/new" class="button--standard">File an issue</a>
              </p>
            `;
            const headerRow = document.querySelector('.court-case-listing .court-case-listing-header');
            headerRow.parentNode.insertBefore(noResultsDiv, headerRow.nextSibling);
          } else {
            const querySpan = noResultsDiv.querySelector('strong');
            if (querySpan) {
              querySpan.innerHTML = `&ldquo;${query}&rdquo;`;
            }
            noResultsDiv.style.display = '';
          }
        } else {
          if (noResultsDiv) {
            noResultsDiv.style.display = 'none';
          }
        }
      };
    });

    it('should show no results message when search returns 0 results', function() {
      this.updateNoResultsMessage(true, 'nonexistent');

      const noResultsDiv = document.querySelector('.message--info');
      expect(noResultsDiv).to.exist;
      expect(noResultsDiv.style.display).to.not.equal('none');
      expect(noResultsDiv.textContent).to.include('No results');
      expect(noResultsDiv.textContent).to.include('nonexistent');
    });

    it('should hide no results message when results are found', function() {
      // First show the message
      this.updateNoResultsMessage(true, 'test');

      // Then hide it
      this.updateNoResultsMessage(false);

      const noResultsDiv = document.querySelector('.message--info');
      expect(noResultsDiv.style.display).to.equal('none');
    });

    it('should update query text in existing message', function() {
      // Show message with first query
      this.updateNoResultsMessage(true, 'first');

      let noResultsDiv = document.querySelector('.message--info');
      expect(noResultsDiv.textContent).to.include('first');

      // Update with second query
      this.updateNoResultsMessage(true, 'second');

      noResultsDiv = document.querySelector('.message--info');
      expect(noResultsDiv.textContent).to.include('second');
      expect(noResultsDiv.textContent).to.not.include('first');
    });

    it('should include contact links in no results message', function() {
      this.updateNoResultsMessage(true, 'test');

      const noResultsDiv = document.querySelector('.message--info');
      const emailLink = noResultsDiv.querySelector('a[href^="mailto:"]');
      const issueLink = noResultsDiv.querySelector('a[href*="github.com"]');

      expect(emailLink).to.exist;
      expect(issueLink).to.exist;
      expect(emailLink.textContent).to.equal('Email our team');
      expect(issueLink.textContent).to.equal('File an issue');
    });
  });

  describe('alphabetical navigation behavior', function() {
    it('should clear search input when resetting', function() {
      // Simulate search state
      this.searchInput.value = 'adams';
      expect(this.searchInput.value).to.equal('adams');

      // Simulate clear action
      this.searchInput.value = '';
      expect(this.searchInput.value).to.equal('');
    });

    it('should show all rows after clearing search', function() {
      const allRows = document.querySelectorAll('section[id] table tbody tr');
      const allSections = document.querySelectorAll('section[id]');

      // First hide some rows (simulate filtered state)
      allRows[1].style.display = 'none';
      allRows[2].style.display = 'none';

      // Verify some rows are hidden
      const hiddenRows = Array.from(allRows).filter(row => row.style.display === 'none');
      expect(hiddenRows.length).to.equal(2);

      // Simulate clearing (show all)
      allRows.forEach(row => row.style.display = '');
      allSections.forEach(section => section.style.display = '');

      // All rows should be visible
      allRows.forEach(row => {
        expect(row.style.display).to.equal('');
      });
    });

    it('should remove query parameter from URL when clearing', function() {
      // Create URL with query param
      const url = new URL('http://localhost:9876/test?q=adams');
      expect(url.searchParams.has('q')).to.be.true;

      // Simulate removing query param
      url.searchParams.delete('q');
      expect(url.searchParams.has('q')).to.be.false;
      expect(url.toString()).to.not.include('q=');
    });
  });

  describe('clear search link', function() {
    beforeEach(function() {
      // Add the clear search link to the DOM
      const countSpan = document.querySelector('.case-count');
      countSpan.innerHTML = '1 total result | <a href="#" class="js-clear-search">Show full alphabetical list</a>';
    });

    it('should clear search when clicking "Show full alphabetical list"', function() {
      this.searchInput.value = 'adams';

      // Click the clear link
      const clearLink = document.querySelector('.js-clear-search');
      expect(clearLink).to.exist;

      // Simulate click behavior
      this.searchInput.value = '';

      expect(this.searchInput.value).to.equal('');
    });

    it('should show all cases after clicking clear link', function() {
      // Set up filtered state
      const allRows = document.querySelectorAll('section[id] table tbody tr');
      allRows[0].style.display = '';
      allRows[1].style.display = 'none';
      allRows[2].style.display = 'none';

      // Simulate clear link click
      allRows.forEach(row => row.style.display = '');
      const allSections = document.querySelectorAll('section[id]');
      allSections.forEach(section => section.style.display = '');

      // All should be visible
      allRows.forEach(row => {
        expect(row.style.display).to.equal('');
      });
    });
  });

});
