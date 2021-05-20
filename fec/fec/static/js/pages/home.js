'use strict';

var homepageEvents = require('../modules/home-events');

// accessible tabs for alt sidebar
require('../vendor/tablist').init();

// Home Page: Events and deadlines
new homepageEvents.HomepageEvents();

// We don't want the homepage to have any query parameters
// but election-search wants to add them
function scrubURI() {
  const uri = window.location.href.toString();
  if (uri.indexOf('?') > 0) {
    window.history.replaceState(
      {},
      document.title,
      window.location.href.split('?')[0]
    );
  }
}
// After all the files are loaded and ready,
window.addEventListener('load', () => {
  // Let's remove any query params after the page
  scrubURI();

  // and make sure no interactive elements add a query param
  let inputs = document.querySelectorAll('#main input, #main select');
  inputs.forEach(element => {
    element.addEventListener('change', scrubURI);
  });

  // Set the default office value
  let offices = document.querySelectorAll('.js-office');
  offices.forEach(element => {
    element.value = 'S';
  });

  // Set the default election cycle
  let years = document.querySelectorAll('.js-election-year');
  years.forEach(element => {
    element.value = window.DEFAULT_ELECTION_YEAR;
  });

  // Set the chart toggle to receipts
  let toggles = document.querySelectorAll('.js-chart-toggle[value=receipts]');
  toggles.forEach(element => {
    element.checked = true;
  });
});
