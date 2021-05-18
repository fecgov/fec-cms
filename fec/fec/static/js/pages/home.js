'use strict';

var homepageEvents = require('../modules/home-events');

// accessible tabs for alt sidebar
require('../vendor/tablist').init();

// Home Page: Events and deadlines
new homepageEvents.HomepageEvents();

// We don't want the homepage to have any query parameters
function scrubURI() {
  const uri = window.location.href.toString();
  if (uri.indexOf('?') > 0) {
    stopWatchingHref(); // Stop the automatic check after we've found one
    window.history.replaceState(
      {},
      document.title,
      window.location.href.split('?')[0]
    );
  }
}

// Start a timer to watch until we have a query parameter to remove
// (election-search.html will add them when it loads)
let hrefInterval = null;
function startWatchingHref() {
  hrefInterval = window.setInterval(scrubURI, 100);
}
function stopWatchingHref() {
  if (hrefInterval) {
    window.clearInterval(hrefInterval);
    hrefInterval = null;
  }
}
startWatchingHref();

// For any elements who want to add query parameters to the URL, remove 'em
let inputs = document.querySelectorAll('#main input, #main select');
inputs.forEach(element => {
  element.addEventListener('change', scrubURI);
});

//
let offices = document.querySelectorAll('.js-office');
offices.forEach(element => {
  element.value = 'S';
});

let years = document.querySelectorAll('.js-election-year');
years.forEach(element => {
  element.value = '2022';
});

let toggles = document.querySelectorAll('.js-chart-toggle[value=receipts]');
toggles.forEach(element => {
  element.checked = true;
});
